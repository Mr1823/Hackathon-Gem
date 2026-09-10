'use strict';

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const multer  = require('multer');

const { extractCriteria, matchCriterion }  = require('./services/geminiService');
const { extractTextFromPDF }               = require('./services/pdfService');   // used ONLY for hallucination guard
const { generateComplianceReport }         = require('./services/reportService');

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

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  const { EXTRACTION_MODEL, MATCHING_MODEL } = require('./config/models');
  res.json({
    status: 'ok',
    gemini_configured: !!process.env.GEMINI_API_KEY,
    models: { extraction: EXTRACTION_MODEL, matching: MATCHING_MODEL },
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
// Pipeline:
//   1. Extract bid raw text (pdf-parse) — used ONLY for the hallucination guard.
//   2. For each criterion: pass the bid PDF natively to Gemini and get verdict+evidence.
//   3. Gemini service internally verifies evidence against raw text; downgrades if not found.
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

    console.log(`[Compliance] ${req.file.originalname}  ${(req.file.size / 1024).toFixed(0)} KB`);

    // Step 1: Extract raw text once — ONLY for the hallucination guard inside matchCriterion.
    // If extraction fails, pdfService returns empty string; guard degrades conservatively (safe).
    const { text: bidRawText, numPages } = await extractTextFromPDF(req.file.buffer);
    if (bidRawText.length === 0) {
      console.warn('[Compliance] Raw text extraction returned empty — hallucination guard in degraded mode (all evidence unverifiable).');
    } else {
      console.log(`[Compliance] Raw text extracted: ${bidRawText.length} chars across ${numPages} pages`);
    }

    // Step 2: Sequential criterion matching (sequential = more reliable JSON output)
    const results = [];
    for (const criterion of criteria) {
      console.log(`  → ${criterion.criterion}`);
      const result = await matchCriterion(criterion, req.file.buffer, bidRawText);
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
      success:           true,
      bid_filename:      req.file.originalname,
      bid_num_pages:     numPages,
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
const { EXTRACTION_MODEL, MATCHING_MODEL } = require('./config/models');
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════╗
║   GeM AI Bid Compliance Verification Backend         ║
║   http://localhost:${PORT}                              ║
║   Gemini API : ${process.env.GEMINI_API_KEY ? '✓ Configured' : '✗ NOT SET — add to .env'}                  ║
║   Extraction : ${EXTRACTION_MODEL.padEnd(22)}      ║
║   Matching   : ${MATCHING_MODEL.padEnd(22)}      ║
╚══════════════════════════════════════════════════════╝
  `);
});
