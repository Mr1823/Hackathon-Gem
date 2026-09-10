'use strict';

/**
 * Extract plain text from a PDF buffer.
 * 
 * Uses pdfjs-dist (modern Mozilla PDF.js) directly instead of the pdf-parse
 * wrapper, which bundles an ancient version that crashes on many real-world PDFs.
 *
 * Used for:
 *   - Hallucination guard (all providers)
 *   - Bid content input for text-based providers (Groq, Ollama)
 *
 * @param  {Buffer} buffer
 * @returns {Promise<{text: string, numPages: number}>}
 *          On failure returns empty text (guard will treat all evidence as unverifiable)
 */
async function extractTextFromPDF(buffer) {
  try {
    // Dynamic import — pdfjs-dist is ESM-only in v4+
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

    const uint8 = new Uint8Array(buffer);
    const doc = await pdfjsLib.getDocument({ data: uint8 }).promise;

    const textParts = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map(item => item.str).join(' ');
      textParts.push(pageText);
    }

    const fullText = textParts.join('\n\n');
    console.log(`[pdfService] Extracted ${fullText.length} chars from ${doc.numPages} pages`);

    return {
      text:     fullText,
      numPages: doc.numPages,
    };
  } catch (error) {
    console.warn(`[pdfService] Text extraction warning (guard degraded): ${error.message}`);
    return { text: '', numPages: 0 };
  }
}

module.exports = { extractTextFromPDF };
