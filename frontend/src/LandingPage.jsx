export default function LandingPage({ onStart }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Header bar */}
      <header style={{
        background: 'var(--slate-900)',
        padding: '0 24px',
        borderBottom: '1px solid var(--slate-200)',
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: 'white', fontWeight: 600, fontSize: 15 }}>GeM BidVerify</span>
          <button onClick={onStart} className="btn-primary" style={{ padding: '7px 16px', fontSize: 13 }}>
            Open verification tool
          </button>
        </div>
      </header>

      {/* Main content */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ maxWidth: 560, width: '100%' }}>

          <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 12, lineHeight: 1.2 }}>
            Bid compliance verification
          </h1>
          <p style={{ color: 'var(--slate-500)', fontSize: 15, lineHeight: 1.6, marginBottom: 32, maxWidth: 480 }}>
            Upload a tender document and a vendor bid. The system extracts eligibility
            criteria from the tender and checks the bid against each one, producing a
            clause-by-clause compliance report you can export as a PDF.
          </p>

          {/* How it works — numbered list, not cards */}
          <div style={{
            border: '1px solid var(--slate-200)',
            borderRadius: 4,
            padding: '20px 24px',
            marginBottom: 32,
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>How it works</h3>
            <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10, color: 'var(--slate-700)', fontSize: 14, lineHeight: 1.5 }}>
              <li>
                <strong>Upload the tender PDF.</strong> The AI reads the document and extracts
                all eligibility criteria — turnover thresholds, certifications, registrations,
                experience requirements.
              </li>
              <li>
                <strong>Upload the vendor bid.</strong> Each criterion is checked against the
                bid content. The AI quotes the specific evidence it found (or flags what's missing).
              </li>
              <li>
                <strong>Review the compliance report.</strong> A checklist shows every criterion
                as Compliant, Non-Compliant, or Not Found, with confidence scores and the AI's reasoning.
                Export as PDF for your audit file.
              </li>
            </ol>
          </div>

          <button onClick={onStart} className="btn-primary" style={{ fontSize: 15, padding: '12px 24px' }}>
            Start verification
          </button>

          {/* Disclaimer — plain text, not a styled card */}
          <p style={{ color: 'var(--slate-500)', fontSize: 12, marginTop: 24, lineHeight: 1.5 }}>
            Files are processed in memory and not stored on any server.
            AI analysis is indicative — results should be verified by a qualified
            procurement officer before any official use.
          </p>
        </div>
      </main>
    </div>
  );
}
