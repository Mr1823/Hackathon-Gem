import { useState, useEffect } from 'react';
import { uploadTender, verifyCompliance, checkHealth } from './api';
import { UploadCard } from './components/UploadCard';
import { CriteriaPanel } from './components/CriteriaPanel';
import { ComplianceTable } from './components/ComplianceTable';
import { ScoreBadge } from './components/ScoreBadge';
import { ExportButton } from './components/ExportButton';

// ── Step Indicator ────────────────────────────────────────────────────────────
function StepIndicator({ step }) {
  const icons = {
    1: <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    2: <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><rect x="8" y="2" width="8" height="4" rx="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    3: <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  };
  const steps = [
    { n: 1, label: 'Upload Tender' },
    { n: 2, label: 'Upload Bid' },
    { n: 3, label: 'Results' },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 40 }}>
      {steps.map((s, i) => (
        <div key={s.n} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
              fontWeight: 800,
              background: step > s.n
                ? 'linear-gradient(135deg, #10B981, #059669)'
                : step === s.n
                  ? 'linear-gradient(135deg, #4F46E5, #7C3AED)'
                  : 'rgba(30,41,59,0.8)',
              border: step === s.n
                ? '2px solid rgba(99,102,241,0.5)'
                : step > s.n
                  ? '2px solid rgba(16,185,129,0.4)'
                  : '2px solid rgba(51,65,85,0.5)',
              color: step >= s.n ? 'white' : '#475569',
              transition: 'all 0.4s ease',
              boxShadow: step === s.n ? '0 0 20px rgba(79,70,229,0.4)' : step > s.n ? '0 0 16px rgba(16,185,129,0.3)' : 'none',
            }}>
              {step > s.n ? <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg> : icons[s.n]}
            </div>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: step === s.n ? 700 : 500,
              color: step === s.n ? '#a5b4fc' : step > s.n ? '#34d399' : '#475569',
              whiteSpace: 'nowrap',
            }}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{
              width: 80,
              height: 2,
              margin: '0 8px',
              marginBottom: 24,
              background: step > s.n
                ? 'linear-gradient(90deg, #10B981, rgba(16,185,129,0.3))'
                : 'rgba(51,65,85,0.5)',
              transition: 'background 0.4s ease',
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Processing Overlay ─────────────────────────────────────────────────────────
const TENDER_STAGES = [
  { label: 'Reading PDF', sub: 'Parsing document structure…' },
  { label: 'Identifying Criteria', sub: 'Locating eligibility clauses…' },
  { label: 'Structuring Checklist', sub: 'Building JSON criteria list…' },
];
const BID_STAGES = [
  { label: 'Sending Bid to AI', sub: 'Uploading document for analysis…' },
  { label: 'Matching Criteria', sub: 'Checking each clause against the bid…' },
  { label: 'Generating Report', sub: 'Computing scores and evidence…' },
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
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(2,6,23,0.88)',
      backdropFilter: 'blur(12px)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, gap: 28,
    }}>
      {/* Animated rings */}
      <div style={{ position: 'relative', width: 100, height: 100 }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: '3px solid rgba(79,70,229,0.3)',
          borderTopColor: '#6366F1',
          animation: 'spin 1s linear infinite',
        }} />
        <div style={{
          position: 'absolute', inset: 12, borderRadius: '50%',
          border: '3px solid rgba(124,58,237,0.2)',
          borderTopColor: '#8B5CF6',
          animation: 'spin 1.5s linear infinite reverse',
        }} />
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1.07A7 7 0 0 1 14 23h-4a7 7 0 0 1-6.93-4H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 12 2z" stroke="#818CF8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><circle cx="9" cy="14" r="1.5" fill="#818CF8" /><circle cx="15" cy="14" r="1.5" fill="#818CF8" /><path d="M9 18h6" stroke="#818CF8" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </div>
      </div>

      {/* Title */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '1.15rem', margin: '0 0 4px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{message}</p>
        <p style={{ color: '#475569', fontSize: '0.78rem', margin: 0 }}>This may take 15–60 seconds</p>
      </div>

      {/* Stage indicators */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 'min(360px, 90vw)' }}>
        {stageList.map((s, i) => {
          const done = i < activeStage;
          const active = i === activeStage;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderRadius: 10, background: active ? 'rgba(79,70,229,0.12)' : done ? 'rgba(16,185,129,0.07)' : 'rgba(30,41,59,0.4)', border: `1px solid ${active ? 'rgba(79,70,229,0.3)' : done ? 'rgba(16,185,129,0.2)' : 'rgba(51,65,85,0.4)'}`, transition: 'all 0.4s ease' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, background: done ? 'rgba(16,185,129,0.2)' : active ? 'rgba(79,70,229,0.2)' : 'rgba(51,65,85,0.5)', color: done ? '#34d399' : active ? '#a5b4fc' : '#475569', border: `1.5px solid ${done ? 'rgba(16,185,129,0.4)' : active ? 'rgba(79,70,229,0.4)' : 'rgba(51,65,85,0.4)'}` }}>
                {done ? '✓' : i + 1}
              </div>
              <div>
                <p style={{ color: done ? '#34d399' : active ? '#e2e8f0' : '#475569', fontWeight: 600, fontSize: '0.82rem', margin: 0, transition: 'color 0.3s' }}>{s.label}</p>
                {active && <p style={{ color: '#64748b', fontSize: '0.72rem', margin: 0 }}>{s.sub}</p>}
              </div>
              {active && <div style={{ marginLeft: 'auto', width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />}
            </div>
          );
        })}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Alert Banner ──────────────────────────────────────────────────────────────
function AlertBanner({ type, message, onDismiss }) {
  const styles = {
    error: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', color: '#f87171', icon: '✗' },
    success: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', color: '#34d399', icon: '✓' },
    warning: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', color: '#fbbf24', icon: '⚠' },
  };
  const s = styles[type] || styles.error;
  return (
    <div style={{
      background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12,
      padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: 16, animation: 'slideUp 0.3s ease',
    }}>
      <span style={{ color: s.color, fontWeight: 600, fontSize: '0.85rem' }}>
        {s.icon} {message}
      </span>
      {onDismiss && (
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: s.color, cursor: 'pointer', fontSize: '1.2rem' }}>
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
    setLoadingMsg('Analyzing Tender Document...');
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
    setLoadingMsg('Verifying Bid Compliance...');
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

  return (
    <div style={{ minHeight: '100vh', padding: '0 0 60px' }}>
      {loading && <ProcessingOverlay message={loadingMsg} stages={loadingStages} />}

      {/* ── Header ── */}
      <header style={{
        borderBottom: '1px solid rgba(51,65,85,0.4)',
        background: 'rgba(2,6,23,0.7)',
        backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 100,
        padding: '0 24px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={onHome}
            style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', cursor: onHome ? 'pointer' : 'default', padding: 0 }}
            title="Back to home"
          >
            <div style={{
              width: 38, height: 38,
              background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.2rem',
              boxShadow: '0 0 20px rgba(79,70,229,0.45)',
            }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M12 3v18M3 7l9-4 9 4M5 7v4a7 7 0 0 0 4.5 6.5M19 7v4a7 7 0 0 1-4.5 6.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#e2e8f0', fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.01em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  GeM BidVerify
                </span>
                <span style={{ background: 'rgba(79,70,229,0.2)', border: '1px solid rgba(79,70,229,0.35)', color: '#818cf8', fontSize: '0.6rem', padding: '1px 8px', borderRadius: 9999, fontWeight: 700, letterSpacing: '0.08em' }}>
                  AI-POWERED
                </span>
              </div>
              <p style={{ color: '#475569', fontSize: '0.68rem', margin: 0 }}>
                Government e-Marketplace · Bid Compliance Verification
              </p>
            </div>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {serverOk !== null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: serverOk ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${serverOk ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: 8, padding: '4px 10px' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: serverOk ? '#10B981' : '#EF4444', boxShadow: `0 0 6px ${serverOk ? '#10B981' : '#EF4444'}`, animation: 'pulse 2s infinite' }} />
                <span style={{ color: serverOk ? '#34d399' : '#f87171', fontSize: '0.7rem', fontWeight: 600 }}>
                  {serverOk ? 'AI Ready' : 'API Key Missing'}
                </span>
              </div>
            )}
            {serverHealth && serverHealth.matching_provider && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 8, padding: '4px 10px' }}>
                <span style={{ color: '#38bdf8', fontSize: '0.7rem', fontWeight: 600 }}>
                  {serverHealth.matching_provider === 'gemini' ? 'Gemini' :
                    serverHealth.matching_provider === 'groq' ? 'Groq' :
                      'Ollama'} · {serverHealth.matching_model}
                </span>
              </div>
            )}
            {step > 1 && (
              <button onClick={handleReset} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.78rem' }}>
                ↩ Start Over
              </button>
            )}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
        {/* Hero */}
        {step === 1 && (
          <div style={{ textAlign: 'center', marginBottom: 48 }} className="animate-fade-in">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(79,70,229,0.1)', border: '1px solid rgba(79,70,229,0.25)', borderRadius: 9999, padding: '6px 16px', marginBottom: 20, fontSize: '0.78rem', color: '#a5b4fc', fontWeight: 600 }}>
              Hackathon Demo · GeM Procurement AI
            </div>
            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, color: '#f1f5f9', marginBottom: 16, lineHeight: 1.1, letterSpacing: '-0.03em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              AI-Powered Bid{' '}
              <span className="gradient-text">Compliance Verification</span>
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '1rem', maxWidth: 560, margin: '0 auto 32px', lineHeight: 1.7 }}>
              Upload a tender RFP and vendor bid. Our AI extracts eligibility criteria and generates a
              clause-by-clause audit report in minutes — not days.
            </p>

            {/* Feature chips */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
              {[
                { icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>, label: '2-min analysis' },
                { icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" stroke="#94a3b8" strokeWidth="2" /><path d="M21 21l-4.35-4.35" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" /></svg>, label: 'Evidence-backed verdicts' },
                { icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>, label: 'Clause-by-clause audit' },
                { icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>, label: 'Exportable PDF report' },
              ].map((f) => (
                <div key={f.label} style={{ background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(51,65,85,0.5)', borderRadius: 9999, padding: '6px 14px', fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {f.icon} {f.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step Indicator */}
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
          <div className="animate-slide-up" style={{ maxWidth: 700, margin: '0 auto' }}>
            <div className="glass" style={{ padding: 32 }}>
              <h2 style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '1.1rem', marginBottom: 8, margin: '0 0 6px' }}>
                Step 1: Upload Tender / RFP Document
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: 24 }}>
                The AI will parse the PDF and extract all vendor eligibility criteria (financial thresholds, certifications, experience, legal registrations, etc.)
              </p>
              <UploadCard
                label="Drop your Tender / RFP PDF"
                description="GeM tender, RFP, or bid notice document"
                icon={<svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><polyline points="14 2 14 8 20 8" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                onFileSelect={setTenderFile}
                file={tenderFile}
              />
              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleTenderUpload}
                  disabled={!tenderFile || loading}
                  className="btn-primary"
                >
                  Extract Criteria →
                </button>
              </div>
            </div>

            {/* Info cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 24 }}>
              {[
                { icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" stroke="#818CF8" strokeWidth="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>, title: 'Secure', desc: 'Files processed in memory, never stored' },
                { icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1.07A7 7 0 0 1 14 23h-4a7 7 0 0 1-6.93-4H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 12 2z" stroke="#818CF8" strokeWidth="1.5" /><circle cx="9" cy="14" r="1.5" fill="#818CF8" /><circle cx="15" cy="14" r="1.5" fill="#818CF8" /></svg>, title: 'AI-Powered', desc: 'Multi-provider LLM compliance engine' },
                { icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>, title: 'Fast', desc: 'Full analysis in under 2 minutes' },
              ].map((card) => (
                <div key={card.title} className="glass-sm" style={{ padding: 16, textAlign: 'center' }}>
                  <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{card.icon}</div>
                  <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.85rem', marginBottom: 4 }}>{card.title}</div>
                  <div style={{ color: '#64748b', fontSize: '0.73rem' }}>{card.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 2: Criteria + Upload Bid ── */}
        {step === 2 && (
          <div className="animate-slide-up">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, alignItems: 'start' }}>
              {/* Left: Criteria */}
              <div className="glass" style={{ padding: 28 }}>
                <CriteriaPanel criteria={criteria} />
              </div>

              {/* Right: Upload bid + verify */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="glass" style={{ padding: 28 }}>
                  <h2 style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '1.1rem', margin: '0 0 6px' }}>
                    Step 2: Upload Vendor Bid
                  </h2>
                  <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: 24 }}>
                    Upload the vendor's bid/proposal. The AI will check each criterion against the bid content.
                  </p>
                  <UploadCard
                    label="Drop Vendor Bid PDF"
                    description="Vendor proposal, technical + financial bid"
                    icon={<svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><rect x="8" y="2" width="8" height="4" rx="1" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    onFileSelect={setBidFile}
                    file={bidFile}
                  />
                </div>

                {/* Summary of what will happen */}
                <div className="glass-sm" style={{ padding: 20 }}>
                  <p style={{ color: '#94a3b8', fontSize: '0.78rem', marginBottom: 12, fontWeight: 600 }}>
                    What the AI will check:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {criteria.slice(0, 4).map((c, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', color: '#64748b' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366F1', flexShrink: 0 }} />
                        Check: <span style={{ color: '#94a3b8' }}>{c.criterion}</span>
                      </div>
                    ))}
                    {criteria.length > 4 && (
                      <div style={{ fontSize: '0.73rem', color: '#475569' }}>
                        + {criteria.length - 4} more criteria...
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleVerify}
                  disabled={!bidFile || loading}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', fontSize: '1rem', padding: '14px 24px' }}
                >
                  Verify Compliance
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: Results Dashboard ── */}
        {step === 3 && complianceData && (
          <div className="animate-slide-up">
            {/* Results header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
              <div>
                <h2 style={{ color: '#e2e8f0', fontWeight: 800, fontSize: '1.4rem', margin: '0 0 4px' }}>
                  Compliance Report
                </h2>
                <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>
                  {tenderFilename} &nbsp;·&nbsp; {bidFile?.name}
                </p>
              </div>
              <ExportButton reportData={reportData} />
            </div>

            {/* Score + Table */}
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, alignItems: 'start' }}>
              {/* Left: Score badge */}
              <ScoreBadge
                score={complianceData.score}
                compliantCount={complianceData.compliant_count}
                nonCompliantCount={complianceData.non_compliant_count}
                notFoundCount={complianceData.not_found_count}
                total={criteria.length}
              />

              {/* Right: Compliance table */}
              <div className="glass" style={{ padding: 24 }}>
                <ComplianceTable criteria={criteria} results={complianceData.results} />
              </div>
            </div>

            {/* Provider info bar */}
            {complianceData.matching_provider && (
              <div className="glass-sm" style={{ marginTop: 20, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981' }} />
                    <span style={{ color: '#94a3b8', fontSize: '0.73rem', fontWeight: 600 }}>
                      Provider: <span style={{ color: '#e2e8f0' }}>{complianceData.matching_provider}</span>
                    </span>
                  </div>
                  <span style={{ color: '#334155' }}>|</span>
                  <span style={{ color: '#94a3b8', fontSize: '0.73rem', fontWeight: 600 }}>
                    Model: <span style={{ color: '#e2e8f0' }}>{complianceData.matching_model}</span>
                  </span>
                  <span style={{ color: '#334155' }}>|</span>
                  <span style={{ color: '#94a3b8', fontSize: '0.73rem', fontWeight: 600 }}>
                    Pages: <span style={{ color: '#e2e8f0' }}>{complianceData.bid_num_pages}</span>
                  </span>
                </div>
                <span style={{ color: '#475569', fontSize: '0.68rem', fontStyle: 'italic' }}>
                  AI analysis is indicative — review by a qualified procurement officer is recommended.
                </span>
              </div>
            )}

            {/* Footer note */}
            <div style={{ marginTop: 12, textAlign: 'center' }}>
              <p style={{ color: '#334155', fontSize: '0.72rem' }}>
                GeM BidVerify · Hackathon 2026
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
