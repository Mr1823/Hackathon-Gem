const pdfParse = require('pdf-parse');

/**
 * Extract plain text from a PDF buffer.
 * Used ONLY for the hallucination guard in geminiService — the LLM itself
 * receives the PDF natively and does not depend on this output.
 *
 * @param  {Buffer} buffer
 * @returns {Promise<{text: string, numPages: number}>}
 *          On failure returns empty text (guard will treat all evidence as unverifiable)
 */
async function extractTextFromPDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    return {
      text:     data.text     || '',
      numPages: data.numpages || 0,
    };
  } catch (error) {
    // Graceful degradation: if text extraction fails (e.g. encrypted / unusual encoding),
    // return empty text. The hallucination guard in geminiService will then treat every
    // evidence snippet as "unverifiable" and downgrade to "Not Found" — a safe conservative stance.
    console.warn(`[pdfService] Text extraction warning (guard degraded): ${error.message}`);
    return { text: '', numPages: 0 };
  }
}

module.exports = { extractTextFromPDF };
