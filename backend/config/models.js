/**
 * Model & provider configuration.
 *
 * MATCHING_PROVIDER controls which LLM backend is used for compliance matching:
 *   'gemini'  — Google Gemini API (native PDF input, requires GEMINI_API_KEY)
 *   'groq'    — Groq cloud API   (text input via pdf-parse, requires GROQ_API_KEY)
 *   'ollama'  — Local Ollama      (text input via pdf-parse, no API key needed)
 *
 * Extraction (tender parsing) always uses Gemini — it's the only provider
 * that accepts native PDF as inline data.
 */

const MATCHING_PROVIDER = (process.env.MATCHING_PROVIDER || 'gemini').toLowerCase().trim();

const VALID_PROVIDERS = ['gemini', 'groq', 'ollama'];
if (!VALID_PROVIDERS.includes(MATCHING_PROVIDER)) {
  console.error(`[Config] Invalid MATCHING_PROVIDER="${MATCHING_PROVIDER}". Must be one of: ${VALID_PROVIDERS.join(', ')}`);
  process.exit(1);
}

module.exports = {
  // ── Extraction (always Gemini) ──────────────────────────────────────────────
  EXTRACTION_MODEL: 'gemini-3.5-flash-lite',

  // ── Matching (provider-dependent) ───────────────────────────────────────────
  MATCHING_PROVIDER,

  // Gemini matching
  GEMINI_MATCHING_MODEL: 'gemini-3.6-flash',

  // Groq matching
  GROQ_API_BASE: 'https://api.groq.com/openai/v1',
  GROQ_MODEL:    process.env.GROQ_MODEL || 'openai/gpt-oss-120b',

  // Ollama matching (local)
  OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
  OLLAMA_MODEL:    process.env.OLLAMA_MODEL    || 'qwen2.5:14b-instruct',
};
