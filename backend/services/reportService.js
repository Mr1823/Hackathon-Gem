const PDFDocument = require('pdfkit');

/**
 * Generate a compliance audit report PDF
 * @param {object} reportData - { tender_name, vendor_name, criteria, results, score }
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generateComplianceReport(reportData) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const colors = {
      primary: '#4F46E5',
      dark: '#1E1B4B',
      compliant: '#059669',
      nonCompliant: '#DC2626',
      notFound: '#D97706',
      light: '#F5F3FF',
      gray: '#6B7280',
      border: '#E5E7EB',
    };

    // ── Header ──────────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 120).fill(colors.dark);

    doc.fontSize(22).fillColor('#FFFFFF').font('Helvetica-Bold').text('GeM Bid Compliance Report', 50, 35);
    doc.fontSize(10).fillColor('#A5B4FC').font('Helvetica').text('AI-Powered Bid Compliance Verification Platform', 50, 63);
    doc.fontSize(9).fillColor('#C7D2FE').text(`Generated: ${new Date().toLocaleString('en-IN')}`, 50, 80);

    // Score badge (top right)
    const scoreColor =
      reportData.score >= 80 ? colors.compliant : reportData.score >= 50 ? colors.notFound : colors.nonCompliant;
    doc.rect(doc.page.width - 150, 20, 100, 80).fill(scoreColor);
    doc.fontSize(32).fillColor('#FFFFFF').font('Helvetica-Bold').text(`${reportData.score}%`, doc.page.width - 140, 35);
    doc.fontSize(9).fillColor('#FFFFFF').font('Helvetica').text('Compliance', doc.page.width - 135, 75);

    doc.moveDown(4);

    // ── Meta Info ────────────────────────────────────────────────────────────
    doc.rect(50, 135, doc.page.width - 100, 60).fillAndStroke(colors.light, colors.border);
    doc.fontSize(11).fillColor(colors.dark).font('Helvetica-Bold').text('Tender:', 65, 150);
    doc.font('Helvetica').fillColor('#374151').text(reportData.tender_name || 'GeM Tender Document', 130, 150);
    doc.font('Helvetica-Bold').fillColor(colors.dark).text('Vendor:', 65, 168);
    doc.font('Helvetica').fillColor('#374151').text(reportData.vendor_name || 'Vendor Bid Document', 130, 168);

    const compliantCount = reportData.results.filter((r) => r.verdict === 'Compliant').length;
    const nonCompliantCount = reportData.results.filter((r) => r.verdict === 'Non-Compliant').length;
    const notFoundCount = reportData.results.filter((r) => r.verdict === 'Not Found').length;

    doc.font('Helvetica-Bold').fillColor(colors.compliant).text(`✓ ${compliantCount} Compliant`, 380, 150);
    doc.font('Helvetica-Bold').fillColor(colors.nonCompliant).text(`✗ ${nonCompliantCount} Non-Compliant`, 380, 168);
    doc.font('Helvetica-Bold').fillColor(colors.notFound).text(`? ${notFoundCount} Not Found`, 490, 150);

    doc.moveDown(5);

    // ── Compliance Results Table ─────────────────────────────────────────────
    const tableTop = 215;
    doc.fontSize(13).fillColor(colors.dark).font('Helvetica-Bold').text('Compliance Checklist', 50, tableTop);

    // Table header
    const headerY = tableTop + 22;
    doc.rect(50, headerY, doc.page.width - 100, 22).fill(colors.primary);
    doc.fontSize(9).fillColor('#FFFFFF').font('Helvetica-Bold');
    doc.text('#', 56, headerY + 7);
    doc.text('Criterion', 72, headerY + 7);
    doc.text('Category', 250, headerY + 7);
    doc.text('Verdict', 350, headerY + 7);
    doc.text('Confidence', 430, headerY + 7);

    // Table rows
    let rowY = headerY + 22;
    reportData.results.forEach((result, i) => {
      const criterion = reportData.criteria.find((c) => c.id === result.criterion_id) || {};
      const isEven = i % 2 === 0;
      const rowHeight = 52;

      // Row background
      doc.rect(50, rowY, doc.page.width - 100, rowHeight).fill(isEven ? '#FAFAFA' : '#FFFFFF');

      // Verdict color strip
      const verdictColor =
        result.verdict === 'Compliant'
          ? colors.compliant
          : result.verdict === 'Non-Compliant'
          ? colors.nonCompliant
          : colors.notFound;
      doc.rect(50, rowY, 4, rowHeight).fill(verdictColor);

      doc.fontSize(9).fillColor('#374151').font('Helvetica');
      doc.text(String(i + 1), 60, rowY + 8);
      doc.font('Helvetica-Bold').text(criterion.criterion || 'N/A', 72, rowY + 8, { width: 170 });
      doc.font('Helvetica').fillColor(colors.gray).text(criterion.category || 'N/A', 250, rowY + 8);

      // Verdict badge
      doc.rect(345, rowY + 5, 75, 14).fill(verdictColor);
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(7).text(result.verdict, 348, rowY + 9, { width: 70 });

      // Confidence bar
      const confWidth = Math.round((result.confidence / 100) * 70);
      doc.rect(430, rowY + 8, 70, 8).fill('#E5E7EB');
      doc.rect(430, rowY + 8, confWidth, 8).fill(verdictColor);
      doc.fillColor(colors.gray).font('Helvetica').fontSize(8).text(`${result.confidence}%`, 505, rowY + 8);

      // Evidence snippet
      if (result.evidence) {
        doc
          .fontSize(7)
          .fillColor(colors.gray)
          .font('Helvetica')
          .text(`Evidence: "${result.evidence.substring(0, 100)}..."`, 72, rowY + 28, { width: 460 });
      } else {
        doc
          .fontSize(7)
          .fillColor(colors.notFound)
          .text('No supporting evidence found in bid document.', 72, rowY + 28);
      }

      // Row border
      doc.rect(50, rowY, doc.page.width - 100, rowHeight).stroke(colors.border);

      rowY += rowHeight;
      if (rowY > doc.page.height - 120) {
        doc.addPage();
        rowY = 50;
      }
    });

    // ── Footer ───────────────────────────────────────────────────────────────
    doc.rect(0, doc.page.height - 60, doc.page.width, 60).fill(colors.dark);
    doc
      .fontSize(8)
      .fillColor('#A5B4FC')
      .text(
        'This report was generated by the GeM AI Bid Compliance Verification Platform. For official use only.',
        50,
        doc.page.height - 40,
        { align: 'center', width: doc.page.width - 100 }
      );

    doc.end();
  });
}

module.exports = { generateComplianceReport };
