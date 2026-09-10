'use strict';

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const multer  = require('multer');

const { extractCriteria, matchCriterion }  = require('./services/geminiService');
const { matchCriterionOpenAI }             = require('./services/openaiMatchingService');
const { extractTextFromPDF }               = require('./services/pdfService');
const { generateComplianceReport }         = require('./services/reportService');
const config                               = require('./config/models');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    file.mimetype === 'application/pdf'
      ? cb(null, true)
      : cb(new Error('Only PDF files are accepted'));
  },
});

// ── Helper: resolve active matching model name for display ────────────────────
function getMatchingModelName() {
  switch (config.MATCHING_PROVIDER) {
    case 'gemini': return config.GEMINI_MATCHING_MODEL;
    case 'groq':   return config.GROQ_MODEL;
    case 'ollama': return config.OLLAMA_MODEL;
    default:       return 'unknown';
  }
}

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    gemini_configured:  !!process.env.GEMINI_API_KEY,
    matching_provider:  config.MATCHING_PROVIDER,
    matching_model:     getMatchingModelName(),
    models: {
      extraction: config.EXTRACTION_MODEL,
      matching:   `${config.MATCHING_PROVIDER}/${getMatchingModelName()}`,
    },
    timestamp: new Date().toISOString(),
  });
});

// ── POST /api/upload-tender ───────────────────────────────────────────────────
// Receives a Tender/RFP PDF → passes it NATIVELY to Gemini → returns criteria JSON.
// No separate text extraction: the PDF goes straight to the model as base64.
app.post('/api/upload-tender', upload.single('tender'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No tender PDF uploaded' });
    if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

    console.log(`[Tender] ${req.file.originalname}  ${(req.file.size / 1024).toFixed(0)} KB`);
    console.log('[Tender] Passing PDF natively to Gemini for criteria extraction…');

    const criteria = await extractCriteria(req.file.buffer);

    console.log(`[Tender] ✓ ${criteria.length} criteria extracted`);

    res.json({
      success:  true,
      filename: req.file.originalname,
      criteria,
    });
  } catch (err) {
    console.error('[Tender Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/verify-compliance ───────────────────────────────────────────────
// Receives a Bid PDF + criteria JSON → runs per-criterion matching with hallucination guard.
//
// Provider routing:
//   gemini → native PDF to Gemini API (geminiService.matchCriterion)
//   groq   → pdf-parse text to Groq API (openaiMatchingService.matchCriterionOpenAI)
//   ollama → pdf-parse text to local Ollama (openaiMatchingService.matchCriterionOpenAI)
//
// The hallucination guard runs after ALL providers — it only needs the raw text and the evidence string.
app.post('/api/verify-compliance', upload.single('bid'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No bid PDF uploaded' });

    let criteria;
    try {
      criteria = JSON.parse(req.body.criteria);
    } catch {
      return res.status(400).json({ error: 'Invalid criteria JSON' });
    }
    if (!Array.isArray(criteria) || criteria.length === 0) {
      return res.status(400).json({ error: 'No criteria provided' });
    }

    const provider = config.MATCHING_PROVIDER;
    console.log(`[Compliance] ${req.file.originalname}  ${(req.file.size / 1024).toFixed(0)} KB  provider=${provider}`);

    // Step 1: Extract raw text from bid PDF.
    // - For groq/ollama: this IS the bid content sent to the model (they don't accept native PDF).
    // - For gemini: used ONLY for the hallucination guard (Gemini gets the native PDF).
    const { text: bidRawText, numPages } = await extractTextFromPDF(req.file.buffer);
    if (bidRawText.length === 0) {
      if (provider === 'groq' || provider === 'ollama') {
        console.error('[Compliance] ❌ pdf-parse returned empty text — cannot use text-based provider without bid content.');
        return res.status(422).json({
          error: `PDF text extraction failed (empty output). The ${provider} provider requires readable text. Try a different PDF or switch to MATCHING_PROVIDER=gemini which can read native PDFs.`,
        });
      }
      console.warn('[Compliance] Raw text extraction returned empty — hallucination guard in degraded mode.');
    } else {
      console.log(`[Compliance] Raw text extracted: ${bidRawText.length} chars across ${numPages} pages`);
    }

    // Step 2: Sequential criterion matching — dispatch to active provider
    const results = [];
    for (const criterion of criteria) {
      console.log(`  → ${criterion.criterion}`);

      let result;
      if (provider === 'gemini') {
        result = await matchCriterion(criterion, req.file.buffer, bidRawText);
      } else {
        // groq or ollama — text-based matching via OpenAI SDK
        result = await matchCriterionOpenAI(criterion, bidRawText, provider);

        // Run hallucination guard on the result (same as Gemini path)
        const { runHallucinationGuard } = require('./services/geminiService');
        const guardResult = runHallucinationGuard(result.evidence || '', bidRawText);
        if (guardResult === 'failed') {
          console.warn(`  ⚠  Hallucination guard FAILED for "${criterion.criterion}" — downgrading.`);
          result.verdict             = 'Not Found';
          result.evidence            = '';
          result.reason             += ' (Evidence snippet could not be verified in the source document.)';
          result.confidence          = Math.min(result.confidence, 40);
        }
        result.hallucination_check = guardResult;
      }

      console.log(`     ${result.verdict}  confidence=${result.confidence}  guard=${result.hallucination_check}`);
      results.push(result);
    }

    // Step 3: Score
    const compliantCount    = results.filter(r => r.verdict === 'Compliant').length;
    const nonCompliantCount = results.filter(r => r.verdict === 'Non-Compliant').length;
    const notFoundCount     = results.filter(r => r.verdict === 'Not Found').length;
    const score             = Math.round((compliantCount / results.length) * 100);

    console.log(`[Compliance] ✓ Score: ${score}%  (${compliantCount} compliant / ${nonCompliantCount} non-compliant / ${notFoundCount} not found)`);

    res.json({
      success:             true,
      bid_filename:        req.file.originalname,
      bid_num_pages:       numPages,
      matching_provider:   provider,
      matching_model:      getMatchingModelName(),
      score,
      compliant_count:     compliantCount,
      non_compliant_count: nonCompliantCount,
      not_found_count:     notFoundCount,
      results,
    });
  } catch (err) {
    console.error('[Compliance Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/export-report ───────────────────────────────────────────────────
app.post('/api/export-report', async (req, res) => {
  try {
    const { tender_name, vendor_name, criteria, results, score } = req.body;
    if (!criteria || !results) return res.status(400).json({ error: 'Missing criteria or results' });

    console.log('[Export] Generating PDF report…');
    const pdfBuffer = await generateComplianceReport({ tender_name, vendor_name, criteria, results, score });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="GeM_Compliance_Report.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
    console.log('[Export] ✓ PDF sent');
  } catch (err) {
    console.error('[Export Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Unhandled]', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const providerLabel = {
  gemini: '☁️  Gemini API',
  groq:   '⚡ Groq Cloud',
  ollama: '🖥️  Ollama Local',
};

app.listen(PORT, () => {
  const p = config.MATCHING_PROVIDER;
  console.log(`
╔══════════════════════════════════════════════════════════╗
║   GeM AI Bid Compliance Verification Backend             ║
║   http://localhost:${PORT}                                  ║
║                                                          ║
║   Extraction : ${config.EXTRACTION_MODEL.padEnd(25)}     ║
║   Matching   : ${(providerLabel[p] || p).padEnd(25)}     ║
║                ${getMatchingModelName().padEnd(25)}     ║
║                                                          ║
║   Gemini Key : ${process.env.GEMINI_API_KEY ? '✓ Configured' : '✗ NOT SET'}                        ║
║   Groq Key   : ${process.env.GROQ_API_KEY ? '✓ Configured' : '— not set'}                        ║
║   Ollama URL : ${config.OLLAMA_BASE_URL.padEnd(25)}     ║
╚══════════════════════════════════════════════════════════════╝
  `);
});
