import { useState, useEffect } from 'react';
import { uploadTender, verifyCompliance, checkHealth } from './api';
import { UploadCard } from './components/UploadCard';
import { CriteriaPanel } from './components/CriteriaPanel';
import { ComplianceTable } from './components/ComplianceTable';
import { ScoreBadge } from './components/ScoreBadge';
import { ExportButton } from './components/ExportButton';

// ── Step Indicator ────────────────────────────────────────────────────────────
function StepIndicator({ step }) {
  const steps = [
    { n: 1, label: 'Upload tender' },
    { n: 2, label: 'Upload bid' },
    { n: 3, label: 'Review' },
  ];

  return (
    <div className="step-bar">
      {steps.map((s, i) => {
        const done = step > s.n;
        const active = step === s.n;
        const dotClass = done ? 'step-dot step-dot-done' : active ? 'step-dot step-dot-active' : 'step-dot step-dot-pending';
        const labelClass = done ? 'step-label step-label-done' : active ? 'step-label step-label-active' : 'step-label step-label-pending';

        return (
          <div key={s.n} style={{ display: 'flex', alignItems: 'center' }}>
            <span className={dotClass}>
              {done ? (
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : s.n}
            </span>
            <span className={labelClass}>{s.label}</span>
            {i < steps.length - 1 && (
              <span className={`step-line ${done ? 'step-line-done' : 'step-line-pending'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Processing Overlay (the ONE meaningful animation) ──────────────────────────
const TENDER_STAGES = [
  { label: 'Reading PDF', sub: 'Parsing document structure' },
  { label: 'Identifying criteria', sub: 'Locating eligibility clauses' },
  { label: 'Building checklist', sub: 'Structuring criteria as JSON' },
];
const BID_STAGES = [
  { label: 'Sending bid to AI', sub: 'Uploading document for analysis' },
  { label: 'Matching criteria', sub: 'Checking each clause against the bid' },
  { label: 'Generating report', sub: 'Computing scores and evidence' },
];

function ProcessingOverlay({ message, stages }) {
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    setActiveStage(0);
    const t1 = setTimeout(() => setActiveStage(1), 5000);
    const t2 = setTimeout(() => setActiveStage(2), 14000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [message]);

  const stageList = stages || TENDER_STAGES;

  return (
    <div className="processing-overlay">
      {/* Simple spinner — no concentric rings, no glow */}
      <div className="spinner" />

      <div style={{ textAlign: 'center' }}>
        <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{message}</p>
        <p style={{ color: 'var(--slate-500)', fontSize: 13 }}>This may take 15–60 seconds</p>
      </div>

      {/* Staged progress — the orchestrated moment */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 'min(360px, 90vw)' }}>
        {stageList.map((s, i) => {
          const done = i < activeStage;
          const active = i === activeStage;
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                borderRadius: 3,
                background: active ? 'var(--blue-50)' : done ? 'var(--green-50)' : 'var(--slate-50)',
                border: `1px solid ${active ? '#BFDBFE' : done ? 'var(--green-200)' : 'var(--slate-200)'}`,
                transition: 'background-color 0.3s ease, border-color 0.3s ease',
              }}
            >
              <div
                style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 600,
                  background: done ? 'var(--green-800)' : active ? 'var(--blue-600)' : 'var(--slate-200)',
                  color: done || active ? 'white' : 'var(--slate-500)',
                }}
              >
                {done ? (
                  <svg width="10" height="10" fill="none" viewBox="0 0 24 24">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : i + 1}
              </div>
              <div>
                <p style={{
                  fontWeight: 500,
                  fontSize: 13,
                  color: done ? 'var(--green-800)' : active ? 'var(--slate-800)' : 'var(--slate-500)',
                  margin: 0,
                  transition: 'color 0.3s ease',
                }}>
                  {s.label}
                </p>
                {active && (
                  <p style={{ color: 'var(--slate-500)', fontSize: 12, margin: 0 }}>
                    {s.sub}
                  </p>
                )}
              </div>
              {active && (
                <span className="spinner" style={{ marginLeft: 'auto', width: 14, height: 14, borderWidth: 2, flexShrink: 0 }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Alert Banner ──────────────────────────────────────────────────────────────
function AlertBanner({ type, message, onDismiss }) {
  const cls = `alert alert-${type}`;
  return (
    <div className={cls}>
      <span>{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 4px' }}>
          ×
        </button>
      )}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App({ onHome }) {
  const [step, setStep] = useState(1);
  const [tenderFile, setTenderFile] = useState(null);
  const [bidFile, setBidFile] = useState(null);
  const [criteria, setCriteria] = useState([]);
  const [tenderText, setTenderText] = useState('');
  const [tenderFilename, setTenderFilename] = useState('');
  const [complianceData, setComplianceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [loadingStages, setLoadingStages] = useState(null);
  const [error, setError] = useState('');
  const [serverOk, setServerOk] = useState(null);
  const [serverHealth, setServerHealth] = useState(null);

  // Health check on mount
  useEffect(() => {
    checkHealth()
      .then((h) => {
        setServerOk(h.gemini_configured);
        setServerHealth(h);
      })
      .catch(() => {
        setServerOk(false);
        setServerHealth(null);
      });
  }, []);

  const handleTenderUpload = async () => {
    if (!tenderFile) return;
    setError('');
    setLoading(true);
    setLoadingMsg('Analyzing tender document');
    setLoadingStages(TENDER_STAGES);
    try {
      const data = await uploadTender(tenderFile);
      setCriteria(data.criteria);
      setTenderText(data.tender_text);
      setTenderFilename(data.filename);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!bidFile) return;
    setError('');
    setLoading(true);
    setLoadingMsg('Checking bid compliance');
    setLoadingStages(BID_STAGES);
    try {
      const data = await verifyCompliance(bidFile, criteria);
      setComplianceData(data);
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setTenderFile(null);
    setBidFile(null);
    setCriteria([]);
    setTenderText('');
    setComplianceData(null);
    setError('');
  };

  const reportData = complianceData
    ? {
        tender_name: tenderFilename,
        vendor_name: bidFile?.name || 'Vendor Bid',
        criteria,
        results: complianceData.results,
        score: complianceData.score,
      }
    : null;

  // Provider label for header
  const providerLabel = serverHealth?.matching_provider
    ? `${serverHealth.matching_provider === 'gemini' ? 'Gemini' : serverHealth.matching_provider === 'groq' ? 'Groq' : 'Ollama'}`
    : null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {loading && <ProcessingOverlay message={loadingMsg} stages={loadingStages} />}

      {/* ── Header ── */}
      <header style={{
        background: 'var(--slate-900)',
        padding: '0 24px',
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={onHome}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: onHome ? 'pointer' : 'default', padding: 0 }}
            title="Back to home"
          >
            <span style={{ color: 'white', fontWeight: 600, fontSize: 15 }}>
              GeM BidVerify
            </span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Server status — minimal, no glow */}
            {serverOk !== null && (
              <span style={{ fontSize: 12, color: serverOk ? '#86EFAC' : '#FCA5A5', fontWeight: 500 }}>
                {serverOk ? 'Backend connected' : 'API key missing'}
              </span>
            )}

            {/* Provider — plain text, no pill */}
            {providerLabel && (
              <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>
                {providerLabel}
              </span>
            )}

            {step > 1 && (
              <button onClick={handleReset} className="btn-secondary" style={{ background: 'transparent', borderColor: 'rgba(255,255,255,0.2)', color: 'white', fontSize: 12, padding: '5px 12px' }}>
                Start over
              </button>
            )}
          </div>
        </div>
      </header>

      <main style={{ flex: 1, maxWidth: 960, width: '100%', margin: '0 auto', padding: '0 24px 48px' }}>
        <StepIndicator step={step} />

        {/* Alerts */}
        {error && <AlertBanner type="error" message={error} onDismiss={() => setError('')} />}
        {serverOk === false && (
          <AlertBanner
            type="warning"
            message="GEMINI_API_KEY is not configured on the backend. Add it to backend/.env and restart the server."
          />
        )}

        {/* ── STEP 1: Upload Tender ── */}
        {step === 1 && (
          <div style={{ maxWidth: 560 }}>
            <h1 style={{ marginBottom: 8 }}>Upload tender document</h1>
            <p style={{ color: 'var(--slate-500)', fontSize: 14, lineHeight: 1.6, marginBottom: 24, maxWidth: 480 }}>
              The AI will read this document and extract all vendor eligibility
              criteria — financial thresholds, certifications, experience
              requirements, legal registrations.
            </p>

            <UploadCard
              label="Drop your tender PDF here"
              onFileSelect={setTenderFile}
              file={tenderFile}
            />

            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-start' }}>
              <button
                onClick={handleTenderUpload}
                disabled={!tenderFile || loading}
                className="btn-primary"
              >
                Extract criteria
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Criteria + Upload Bid ── */}
        {step === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>
            {/* Left: Extracted criteria */}
            <div style={{
              border: '1px solid var(--slate-200)',
              borderRadius: 4,
              padding: 24,
            }}>
              <CriteriaPanel criteria={criteria} />
            </div>

            {/* Right: Upload bid */}
            <div>
              <h2 style={{ marginBottom: 8 }}>Upload vendor bid</h2>
              <p style={{ color: 'var(--slate-500)', fontSize: 14, lineHeight: 1.6, marginBottom: 20, maxWidth: 400 }}>
                Upload the vendor's bid or proposal. Each criterion from the
                tender will be checked against this document.
              </p>

              <UploadCard
                label="Drop the vendor bid PDF here"
                onFileSelect={setBidFile}
                file={bidFile}
              />

              {/* Preview of what will be checked */}
              <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--slate-50)', border: '1px solid var(--slate-200)', borderRadius: 3 }}>
                <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--slate-500)', marginBottom: 8 }}>
                  {criteria.length} criteria will be checked:
                </p>
                <ul style={{ paddingLeft: 16, margin: 0, fontSize: 13, color: 'var(--slate-700)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {criteria.slice(0, 4).map((c, i) => (
                    <li key={i}>{c.criterion}</li>
                  ))}
                  {criteria.length > 4 && (
                    <li style={{ color: 'var(--slate-500)' }}>
                      and {criteria.length - 4} more
                    </li>
                  )}
                </ul>
              </div>

              <button
                onClick={handleVerify}
                disabled={!bidFile || loading}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: 20, padding: '12px 24px' }}
              >
                Check compliance
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Results ── */}
        {step === 3 && complianceData && (
          <div>
            {/* Report header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
              <div>
                <h1 style={{ marginBottom: 6 }}>Compliance report</h1>
                <div style={{ fontSize: 13, color: 'var(--slate-500)', lineHeight: 1.5 }}>
                  <div>Tender: {tenderFilename}</div>
                  <div>Bid: {bidFile?.name}</div>
                </div>
              </div>
              <ExportButton reportData={reportData} />
            </div>

            {/* Score summary bar */}
            <ScoreBadge
              score={complianceData.score}
              compliantCount={complianceData.compliant_count}
              nonCompliantCount={complianceData.non_compliant_count}
              notFoundCount={complianceData.not_found_count}
              total={criteria.length}
            />

            {/* Compliance table */}
            <ComplianceTable criteria={criteria} results={complianceData.results} />

            {/* Provider metadata — structured key-value, not dot-separated */}
            {complianceData.matching_provider && (
              <div style={{
                marginTop: 20,
                padding: '10px 16px',
                background: 'var(--slate-50)',
                border: '1px solid var(--slate-200)',
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
              }}>
                <div style={{ display: 'flex', gap: 20, fontSize: 12, color: 'var(--slate-500)' }}>
                  <span>Provider: <strong style={{ color: 'var(--slate-700)' }}>{complianceData.matching_provider}</strong></span>
                  <span>Model: <strong style={{ color: 'var(--slate-700)' }}>{complianceData.matching_model}</strong></span>
                  <span>Pages analyzed: <strong style={{ color: 'var(--slate-700)' }}>{complianceData.bid_num_pages}</strong></span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--slate-500)' }}>
                  AI analysis is indicative — verify before official use.
                </span>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
