'use strict';

const OpenAI = require('openai');
const {
  GROQ_API_BASE, GROQ_MODEL,
  OLLAMA_BASE_URL, OLLAMA_MODEL,
} = require('../config/models');

// ── Client factory ────────────────────────────────────────────────────────────
// Both Groq and Ollama expose OpenAI-compatible endpoints.
// We lazily create one client per provider to avoid startup failures
// (e.g. Ollama not running yet).

const clients = {};

function getClient(provider) {
  if (clients[provider]) return clients[provider];

  if (provider === 'groq') {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not set in .env — required when MATCHING_PROVIDER=groq');
    }
    clients.groq = new OpenAI({
      apiKey:  process.env.GROQ_API_KEY,
      baseURL: GROQ_API_BASE,
    });
    return clients.groq;
  }

  if (provider === 'ollama') {
    clients.ollama = new OpenAI({
      apiKey:  'ollama',          // Ollama ignores API keys, but the SDK requires a non-empty string
      baseURL: OLLAMA_BASE_URL,
    });
    return clients.ollama;
  }

  throw new Error(`Unknown provider for OpenAI matching: "${provider}"`);
}

function getModel(provider) {
  return provider === 'groq' ? GROQ_MODEL : OLLAMA_MODEL;
}

// ── Matching prompt (text-based) ──────────────────────────────────────────────
// Same criteria as the Gemini version, but bid content is inlined as plain text
// instead of a native PDF attachment.

function buildMatchingPrompt(criterion, bidRawText) {
  return `You are a strict government procurement compliance auditor.

CRITERION TO CHECK
  Name:        ${criterion.criterion}
  Requirement: ${criterion.requirement_text}

VENDOR BID DOCUMENT (full text):
---
${bidRawText}
---

Read the vendor bid document text above carefully and determine whether it satisfies the criterion.

Rules:
1. "Compliant"     — bid clearly satisfies the requirement with explicit, cited evidence.
2. "Non-Compliant" — bid explicitly contradicts or fails to meet the stated requirement.
3. "Not Found"     — the bid does not contain information relevant to this criterion.

For "evidence": copy a short verbatim passage (max 120 characters) directly from the bid document
that supports your verdict. If you cannot find a relevant passage, return an empty string "".
Do NOT paraphrase or invent evidence.

Respond with ONLY a JSON object in this exact format (no markdown, no explanation outside the JSON):
{
  "criterion_id": ${criterion.id},
  "verdict": "Compliant" | "Non-Compliant" | "Not Found",
  "evidence": "verbatim quote or empty string",
  "confidence": 0-100,
  "reason": "one or two sentences"
}`;
}

// ── Main matching function ────────────────────────────────────────────────────
/**
 * Match a single criterion against bid text using an OpenAI-compatible API.
 * Works with both Groq (cloud) and Ollama (local).
 *
 * @param {object} criterion  - { id, criterion, requirement_text, ... }
 * @param {string} bidRawText - Plain text extracted from bid PDF (via pdf-parse)
 * @param {string} provider   - 'groq' or 'ollama'
 * @returns {Promise<object>}   Same contract as geminiService.matchCriterion
 */
async function matchCriterionOpenAI(criterion, bidRawText, provider) {
  const model  = getModel(provider);
  const prompt = buildMatchingPrompt(criterion, bidRawText);

  let client;
  try {
    client = getClient(provider);
  } catch (err) {
    return {
      criterion_id:        criterion.id,
      verdict:             'Not Found',
      evidence:            '',
      confidence:          0,
      reason:              err.message,
      hallucination_check: 'error',
    };
  }

  let rawText;
  try {
    console.log(`  [${provider}] Calling ${model} for criterion_id=${criterion.id}…`);

    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role:    'system',
          content: 'You are a government procurement compliance auditor. Respond ONLY with valid JSON.',
        },
        {
          role:    'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,        // low temperature for deterministic compliance verdicts
    });

    rawText = response.choices[0]?.message?.content || '';
    console.log(`  [${provider}] Raw response for criterion_id=${criterion.id}: ${rawText.slice(0, 200)}…`);
  } catch (err) {
    // ── Detect Ollama not running ───────────────────────────────────────────
    const msg = String(err.message || '');
    if (provider === 'ollama' && (msg.includes('ECONNREFUSED') || msg.includes('fetch failed'))) {
      const friendlyMsg = `Ollama is not running at ${OLLAMA_BASE_URL}. Start it with 'ollama serve' and ensure model '${OLLAMA_MODEL}' is downloaded.`;
      console.error(`  [ollama] ❌ ${friendlyMsg}`);
      return {
        criterion_id:        criterion.id,
        verdict:             'Not Found',
        evidence:            '',
        confidence:          0,
        reason:              friendlyMsg,
        hallucination_check: 'error',
      };
    }

    console.error(`  [${provider}] ❌ API call failed for "${criterion.criterion}": ${err.message}`);
    return {
      criterion_id:        criterion.id,
      verdict:             'Not Found',
      evidence:            '',
      confidence:          0,
      reason:              `${provider} API error: ${err.message}`,
      hallucination_check: 'error',
    };
  }

  // ── Parse JSON response ─────────────────────────────────────────────────
  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch (parseErr) {
    // Some models wrap JSON in markdown code fences — try to extract
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        console.error(`  [${provider}] ❌ JSON parse failed even after extraction: ${rawText.slice(0, 300)}`);
        return {
          criterion_id:        criterion.id,
          verdict:             'Not Found',
          evidence:            '',
          confidence:          0,
          reason:              `${provider} returned unparseable response`,
          hallucination_check: 'error',
        };
      }
    } else {
      console.error(`  [${provider}] ❌ No JSON found in response: ${rawText.slice(0, 300)}`);
      return {
        criterion_id:        criterion.id,
        verdict:             'Not Found',
        evidence:            '',
        confidence:          0,
        reason:              `${provider} returned non-JSON response`,
        hallucination_check: 'error',
      };
    }
  }

  // ── Normalise and return ────────────────────────────────────────────────
  const validVerdicts = ['Compliant', 'Non-Compliant', 'Not Found'];
  const verdict = validVerdicts.includes(parsed.verdict) ? parsed.verdict : 'Not Found';

  return {
    criterion_id:        criterion.id,
    verdict,
    evidence:            String(parsed.evidence || ''),
    confidence:          typeof parsed.confidence === 'number' ? parsed.confidence : 0,
    reason:              String(parsed.reason || ''),
    hallucination_check: 'skipped',   // hallucination guard runs in server.js, not here
  };
}

module.exports = { matchCriterionOpenAI };
