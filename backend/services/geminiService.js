'use strict';

const { GoogleGenAI } = require('@google/genai');
const { EXTRACTION_MODEL, MATCHING_MODEL } = require('../config/models');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ── JSON Response Schemas ─────────────────────────────────────────────────────

const CRITERIA_SCHEMA = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      id:               { type: 'integer',  description: 'Sequential ID starting at 1' },
      criterion:        { type: 'string',   description: 'Short name, max 8 words' },
      category:         { type: 'string',   enum: ['Financial','Technical','Legal','Certification','Experience','Other'] },
      requirement_text: { type: 'string',   description: 'Full requirement as stated or paraphrased from the document' },
      is_mandatory:     { type: 'boolean',  description: 'True if this is an eliminatory / must-have criterion' },
    },
    required: ['id', 'criterion', 'category', 'requirement_text', 'is_mandatory'],
  },
};

const MATCH_SCHEMA = {
  type: 'object',
  properties: {
    criterion_id: { type: 'integer' },
    verdict:      { type: 'string', enum: ['Compliant', 'Non-Compliant', 'Not Found'] },
    evidence:     { type: 'string', description: 'Verbatim quoted text from the bid that supports the verdict. Empty string if none found.' },
    confidence:   { type: 'integer', description: 'Confidence score 0-100' },
    reason:       { type: 'string',  description: 'One or two sentences explaining the verdict' },
  },
  required: ['criterion_id', 'verdict', 'evidence', 'confidence', 'reason'],
};

// ── Helper: PDF buffer → base64 inline part ───────────────────────────────────

function pdfPart(buffer) {
  return {
    inlineData: {
      mimeType: 'application/pdf',
      data: buffer.toString('base64'),
    },
  };
}

// ── Retry with exponential backoff ────────────────────────────────────────────
/**
 * Calls `fn()` up to `maxAttempts` times.
 * Retries only on 429 (rate limit) and 503 (overloaded) errors.
 * Other errors (4xx model/API errors) are rethrown immediately.
 */
async function withRetry(fn, maxAttempts = 3, baseDelayMs = 2000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const msg = String(err.message || '');
      const isRetryable = msg.includes('"code":429') || msg.includes('"code":503') ||
                          msg.includes('rate limit') || msg.includes('high demand');

      if (!isRetryable || attempt === maxAttempts) throw err;

      const delay = baseDelayMs * Math.pow(2, attempt - 1);   // 2s, 4s, 8s
      console.warn(`  ↻ Attempt ${attempt} failed (retryable). Retrying in ${delay / 1000}s…`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
}

// ── Hallucination Guard ───────────────────────────────────────────────────────
/**
 * Verify that the LLM-claimed evidence snippet actually exists in the raw bid text.
 *
 * Guard behaviour:
 *   rawText is empty  → returns 'skipped'  (pdf-parse failed; trust the LLM rather than block everything)
 *   snippet found     → returns 'passed'   (safe to display)
 *   snippet NOT found → returns 'failed'   (caller must downgrade verdict)
 *
 * Uses a 40-char sliding window on normalised text to tolerate minor whitespace differences
 * while still catching completely fabricated passages.
 *
 * @param {string} evidence  - The snippet the LLM claims to have found
 * @param {string} rawText   - Raw text extracted from the bid PDF (via pdf-parse)
 * @returns {'skipped'|'passed'|'failed'}
 */
function runHallucinationGuard(evidence, rawText) {
  if (!evidence || evidence.trim().length === 0) return 'skipped';   // nothing to verify

  // No raw text = pdf-parse failed. We cannot verify, so we trust the LLM rather than
  // blocking all results. The empty-text case is logged at the server level.
  if (!rawText || rawText.trim().length === 0) return 'skipped';

  const norm = (s) => s.replace(/\s+/g, ' ').trim().toLowerCase();

  const normEvidence = norm(evidence);
  const normRaw      = norm(rawText);

  // Check the first 40 chars of the snippet (enough to catch fabrication; tolerant of truncation)
  const checkLen = Math.min(normEvidence.length, 40);
  const checkStr = normEvidence.slice(0, checkLen);

  return normRaw.includes(checkStr) ? 'passed' : 'failed';
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Extract vendor eligibility criteria from a tender PDF.
 * Uses EXTRACTION_MODEL (flash-lite) — optimised for speed/cost.
 * The PDF is passed natively; no prior text extraction needed.
 *
 * @param  {Buffer} tenderPdfBuffer
 * @returns {Promise<Array>}  Structured criteria array
 */
async function extractCriteria(tenderPdfBuffer) {
  const prompt = `You are a government procurement expert.

Analyse this tender / RFP document and extract ALL vendor eligibility and compliance criteria.

Focus on:
- Financial thresholds (turnover, net worth, earnest money)
- Legal registrations (GST, PAN, company registration, MSME/Udyam)
- Certifications (ISO, BIS, quality marks)
- Past experience (years of operation, similar project value/count)
- Technical specifications and delivery requirements
- Any other eliminatory eligibility conditions

Return between 5 and 12 criteria. Be precise — copy the exact numbers and thresholds from the document.`;

  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: EXTRACTION_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            pdfPart(tenderPdfBuffer),
            { text: prompt },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: CRITERIA_SCHEMA,
      },
    });

    const parsed = JSON.parse(response.text);
    return Array.isArray(parsed) ? parsed : (parsed.items || parsed.criteria || []);
  });
}

/**
 * Match a single criterion against the vendor bid PDF.
 * Uses MATCHING_MODEL (flash) — stronger reasoning to avoid false positives.
 *
 * Hallucination guard rules:
 *   - If pdf-parse extracted no text → guard is 'skipped'; verdict and evidence are trusted as-is.
 *   - If pdf-parse extracted text AND snippet is verified → guard is 'passed'; display evidence.
 *   - If pdf-parse extracted text AND snippet NOT found → guard is 'failed'; verdict downgraded
 *     to "Not Found" and evidence is cleared so we never display fabricated text.
 *
 * @param {object} criterion       - { id, criterion, requirement_text, ... }
 * @param {Buffer} bidPdfBuffer    - Raw bid PDF buffer (passed natively to Gemini)
 * @param {string} bidRawText      - Plain text of the bid (from pdf-parse; used for guard only)
 * @returns {Promise<object>}
 */
async function matchCriterion(criterion, bidPdfBuffer, bidRawText) {
  const prompt = `You are a strict government procurement compliance auditor.

CRITERION TO CHECK
  Name:        ${criterion.criterion}
  Requirement: ${criterion.requirement_text}

Read the attached vendor bid document carefully and determine whether it satisfies the criterion above.

Rules:
1. "Compliant"     — bid clearly satisfies the requirement with explicit, cited evidence.
2. "Non-Compliant" — bid explicitly contradicts or fails to meet the stated requirement.
3. "Not Found"     — the bid does not contain information relevant to this criterion.

For "evidence": copy a short verbatim passage (max 120 characters) directly from the bid document
that supports your verdict. If you cannot find a relevant passage, return an empty string "".
Do NOT paraphrase or invent evidence.`;

  // ── DIAGNOSTIC: verify bid PDF data reaching this function ──────────────
  const b64Data = bidPdfBuffer ? bidPdfBuffer.toString('base64') : '';
  console.log(`  [DIAG] matchCriterion called for criterion_id=${criterion.id}`);
  console.log(`  [DIAG]   bidPdfBuffer: type=${typeof bidPdfBuffer}, isBuffer=${Buffer.isBuffer(bidPdfBuffer)}, length=${bidPdfBuffer ? bidPdfBuffer.length : 'NULL'} bytes`);
  console.log(`  [DIAG]   base64 length: ${b64Data.length} chars`);
  console.log(`  [DIAG]   bidRawText length: ${bidRawText ? bidRawText.length : 'NULL'} chars`);
  console.log(`  [DIAG]   model: ${MATCHING_MODEL}`);

  let rawResult;
  try {
    rawResult = await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: MATCHING_MODEL,
        contents: [
          {
            role: 'user',
            parts: [
              pdfPart(bidPdfBuffer),
              { text: prompt },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: MATCH_SCHEMA,
        },
      });

      // ── DIAGNOSTIC: raw model response for first criterion only ──────────
      if (criterion.id === 1) {
        console.log(`  [DIAG] RAW RESPONSE (criterion 1): ${response.text}`);
      }

      return JSON.parse(response.text);
    });
  } catch (err) {
    // ── DIAGNOSTIC: log the ACTUAL error that caused fallback ───────────────
    console.error(`  [DIAG] ❌ CATCH BLOCK HIT for "${criterion.criterion}": ${err.message}`);
    console.error(`  [DIAG]   Error name: ${err.name}, status: ${err.status || 'N/A'}`);
    return {
      criterion_id:        criterion.id,
      verdict:             'Not Found',
      evidence:            '',
      confidence:          0,
      reason:              `Analysis could not be completed after retries: ${err.message}`,
      hallucination_check: 'error',
    };
  }

  // ── Hallucination guard ───────────────────────────────────────────────────
  const guardResult = runHallucinationGuard(rawResult.evidence || '', bidRawText);

  let finalVerdict  = rawResult.verdict;
  let finalEvidence = rawResult.evidence || '';

  if (guardResult === 'failed') {
    console.warn(`  ⚠  Hallucination guard FAILED for "${criterion.criterion}". Evidence snippet not in raw text → downgrading.`);
    finalVerdict  = 'Not Found';
    finalEvidence = '';
    rawResult.reason     += ' (Evidence snippet could not be verified in the source document.)';
    rawResult.confidence  = Math.min(rawResult.confidence, 40);
  }

  return {
    criterion_id:        criterion.id,
    verdict:             finalVerdict,
    evidence:            finalEvidence,
    confidence:          rawResult.confidence,
    reason:              rawResult.reason,
    hallucination_check: guardResult,
  };
}

module.exports = { extractCriteria, matchCriterion };
