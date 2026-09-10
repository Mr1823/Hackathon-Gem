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
    { n: 1, label: 'Upload Tender', icon: '📄' },
    { n: 2, label: 'Upload Bid', icon: '📋' },
    { n: 3, label: 'Results', icon: '✅' },
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
              fontSize: step > s.n ? '0.9rem' : '1.1rem',
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
              {step > s.n ? '✓' : s.icon}
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

// ── Processing Overlay ────────────────────────────────────────────────────────
function ProcessingOverlay({ message, subMessage }) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(2,6,23,0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
      gap: 20,
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
          fontSize: '1.8rem',
        }}>
          🤖
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '1.1rem', margin: 0, marginBottom: 6 }}>
          {message}
        </p>
        <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>
          {subMessage}
        </p>
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
export default function App() {
  const [step, setStep] = useState(1);
  const [tenderFile, setTenderFile] = useState(null);
  const [bidFile, setBidFile] = useState(null);
  const [criteria, setCriteria] = useState([]);
  const [tenderText, setTenderText] = useState('');
  const [tenderFilename, setTenderFilename] = useState('');
  const [complianceData, setComplianceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [loadingSubMsg, setLoadingSubMsg] = useState('');
  const [error, setError] = useState('');
  const [serverOk, setServerOk] = useState(null);

  // Health check on mount
  useEffect(() => {
    checkHealth()
      .then((h) => setServerOk(h.gemini_configured))
      .catch(() => setServerOk(false));
  }, []);

  const handleTenderUpload = async () => {
    if (!tenderFile) return;
    setError('');
    setLoading(true);
    setLoadingMsg('Analyzing Tender Document...');
    setLoadingSubMsg('AI is extracting eligibility criteria from the RFP. This takes ~15–30 seconds.');
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
    setLoadingSubMsg(`Checking ${criteria.length} criteria against bid document. Each criterion is individually analyzed...`);
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
      {loading && <ProcessingOverlay message={loadingMsg} subMessage={loadingSubMsg} />}

      {/* ── Header ── */}
      <header style={{
        borderBottom: '1px solid rgba(51,65,85,0.4)',
        background: 'rgba(2,6,23,0.7)',
        backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 100,
        padding: '0 24px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38,
              background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.2rem',
              boxShadow: '0 0 16px rgba(79,70,229,0.4)',
            }}>
              ⚖️
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#e2e8f0', fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.01em' }}>
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
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {serverOk !== null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: serverOk ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${serverOk ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: 8, padding: '4px 10px' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: serverOk ? '#10B981' : '#EF4444', boxShadow: `0 0 6px ${serverOk ? '#10B981' : '#EF4444'}`, animation: 'pulse 2s infinite' }} />
                <span style={{ color: serverOk ? '#34d399' : '#f87171', fontSize: '0.7rem', fontWeight: 600 }}>
                  {serverOk ? 'AI Ready' : 'API Key Missing'}
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
              🚀 Hackathon Demo · GeM Procurement AI
            </div>
            <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, color: '#f1f5f9', marginBottom: 16, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
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
                { icon: '⚡', label: '2-min analysis' },
                { icon: '🔍', label: 'Evidence-backed verdicts' },
                { icon: '📊', label: 'Clause-by-clause audit' },
                { icon: '📥', label: 'Exportable PDF report' },
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
            message="⚠️ GEMINI_API_KEY is not configured on the backend. Add it to backend/.env and restart the server."
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
                icon="📄"
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
                { icon: '🔒', title: 'Secure', desc: 'Files processed in memory, never stored' },
                { icon: '🤖', title: 'Gemini AI', desc: 'Powered by Google Gemini 2.0 Flash' },
                { icon: '⚡', title: 'Fast', desc: 'Full analysis in under 2 minutes' },
              ].map((card) => (
                <div key={card.title} className="glass-sm" style={{ padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem', marginBottom: 8 }}>{card.icon}</div>
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
                    icon="📋"
                    onFileSelect={setBidFile}
                    file={bidFile}
                  />
                </div>

                {/* Summary of what will happen */}
                <div className="glass-sm" style={{ padding: 20 }}>
                  <p style={{ color: '#94a3b8', fontSize: '0.78rem', marginBottom: 12, fontWeight: 600 }}>
                    🤖 What the AI will do:
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
                  🔍 Verify Compliance
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
                  📄 {tenderFilename} &nbsp;·&nbsp; 📋 {bidFile?.name}
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

            {/* Footer note */}
            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <p style={{ color: '#334155', fontSize: '0.72rem' }}>
                This report was generated by AI and should be reviewed by a qualified procurement officer. AI analysis is indicative, not legally binding.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
