import { useEffect, useRef, useState } from 'react';

const FEATURES = [
  {
    icon: <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" stroke="#818CF8" strokeWidth="2"/><path d="M21 21l-4.35-4.35" stroke="#818CF8" strokeWidth="2" strokeLinecap="round"/></svg>,
    title: 'Evidence-Backed Verdicts',
    desc: 'Every compliance decision is anchored to a verbatim quote from the bid — not a black-box score. Officers see exactly what the AI read.',
  },
  {
    icon: <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    title: 'Clause-by-Clause Audit Trail',
    desc: 'Each eligibility criterion is evaluated independently. The full checklist becomes your legally defensible audit log.',
  },
  {
    icon: <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    title: 'Exportable PDF Report',
    desc: 'One-click export to a formatted compliance report ready for tender files, dispute resolution, or vendor feedback.',
  },
  {
    icon: <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    title: '2-Minute Turnaround',
    desc: 'What takes a procurement officer 3–4 hours of reading is done in under 2 minutes — across all criteria, simultaneously.',
  },
];

const STEPS = [
  {
    n: 1,
    icon: <svg width="26" height="26" fill="none" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    title: 'Upload Tender / RFP',
    desc: 'Drop your GeM tender PDF. The AI parses all eligibility criteria — financial thresholds, certifications, experience requirements — into a structured checklist.',
  },
  {
    n: 2,
    icon: <svg width="26" height="26" fill="none" viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect x="8" y="2" width="8" height="4" rx="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    title: 'Upload Vendor Bid',
    desc: 'Add the vendor\'s bid document. The AI evaluates each criterion against the bid content, extracting verbatim evidence or flagging gaps.',
  },
  {
    n: 3,
    icon: <svg width="26" height="26" fill="none" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    title: 'Get Compliance Report',
    desc: 'Receive a colour-coded audit table with verdicts, confidence scores, and AI reasoning — ready to export as a PDF report.',
  },
];

const PAIN_POINTS = [
  { before: '3–4 hours of manual reading per bid', after: '2 minutes of automated, evidence-backed analysis' },
  { before: 'Inconsistent evaluation between officers', after: 'Deterministic, criterion-by-criterion AI verdicts' },
  { before: 'No paper trail — prone to disputes', after: 'Full audit log with verbatim bid citations' },
  { before: 'Non-compliant bids shortlisted by mistake', after: 'Hallucination guard flags unverified AI claims' },
];

function useScrollReveal(ref) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref]);
  return visible;
}

function RevealSection({ children, delay = 0 }) {
  const ref = useRef(null);
  const visible = useScrollReveal(ref);
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(28px)',
      transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

export default function LandingPage({ onStart }) {
  return (
    <div style={{ minHeight: '100vh', overflowX: 'hidden' }}>

      {/* NAV */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        borderBottom: '1px solid rgba(51,65,85,0.4)',
        background: 'rgba(2,6,23,0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
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
              boxShadow: '0 0 20px rgba(79,70,229,0.45)',
              flexShrink: 0,
            }}><svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M12 3v18M3 7l9-4 9 4M5 7v4a7 7 0 0 0 4.5 6.5M19 7v4a7 7 0 0 1-4.5 6.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.01em' }}>GeM BidVerify</span>
                <span style={{ background: 'rgba(79,70,229,0.2)', border: '1px solid rgba(79,70,229,0.4)', color: '#818cf8', fontSize: '0.58rem', padding: '1px 8px', borderRadius: 9999, fontWeight: 700, letterSpacing: '0.1em' }}>AI-POWERED</span>
              </div>
              <p style={{ color: '#475569', fontSize: '0.67rem', margin: 0 }}>Government e-Marketplace · Bid Compliance</p>
            </div>
          </div>
          <button onClick={onStart} className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
            Launch App →
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section role="banner" style={{
        position: 'relative',
        padding: 'clamp(80px, 12vw, 140px) 24px clamp(80px, 10vw, 120px)',
        textAlign: 'center',
        overflow: 'hidden',
      }}>
        <div aria-hidden style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: 'min(800px, 100%)', height: 600, background: 'radial-gradient(ellipse at center, rgba(79,70,229,0.22) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div aria-hidden style={{ position: 'absolute', top: '20%', left: '10%', width: 400, height: 400, background: 'radial-gradient(ellipse, rgba(124,58,237,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div aria-hidden style={{ position: 'absolute', top: '10%', right: '8%', width: 300, height: 300, background: 'radial-gradient(ellipse, rgba(99,102,241,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: 820, margin: '0 auto' }} className="animate-fade-in">
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(79,70,229,0.1)', border: '1px solid rgba(79,70,229,0.3)',
            borderRadius: 9999, padding: '6px 18px',
            fontSize: '0.78rem', color: '#a5b4fc', fontWeight: 600,
            marginBottom: 28, boxShadow: '0 0 20px rgba(79,70,229,0.15)',
          }}>
            AI-Powered · Built for GeM Procurement Officers
          </div>

          <h1 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 'clamp(2.4rem, 6vw, 3.8rem)',
            fontWeight: 800,
            color: '#f1f5f9',
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            marginBottom: 24,
          }}>
            Turn Hours of Manual{' '}
            <span className="gradient-text">Bid Review</span>
            {' '}into a{' '}
            <span className="gradient-text">2-Minute AI Audit</span>
          </h1>

          <p style={{ color: '#94a3b8', fontSize: 'clamp(1rem, 2vw, 1.15rem)', maxWidth: 620, margin: '0 auto 40px', lineHeight: 1.75 }}>
            Upload a tender RFP and a vendor bid. GeM BidVerify extracts every eligibility criterion
            and produces a clause-by-clause compliance report — with verbatim evidence, in under 2 minutes.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 52 }}>
            <button onClick={onStart} className="btn-primary" style={{ padding: '14px 32px', fontSize: '1rem', borderRadius: 14 }} id="hero-cta">
              Start Verification — It's Free
            </button>
            <a href="#how-it-works" className="btn-secondary" style={{ padding: '14px 28px', fontSize: '1rem', borderRadius: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
              See How It Works ↓
            </a>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>, label: '2-min analysis' },
              { icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" stroke="#94a3b8" strokeWidth="2"/><path d="M21 21l-4.35-4.35" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/></svg>, label: 'Evidence-backed verdicts' },
              { icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>, label: 'Clause-by-clause audit' },
              { icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>, label: 'Exportable PDF report' },
              { icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" stroke="#94a3b8" strokeWidth="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>, label: 'No data stored' },
            ].map((f) => (
              <div key={f.label} style={{ background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(51,65,85,0.6)', borderRadius: 9999, padding: '7px 16px', fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 7, backdropFilter: 'blur(8px)' }}>
                {f.icon} {f.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{ padding: 'clamp(60px, 8vw, 100px) 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <RevealSection>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <p style={{ color: '#6366f1', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>How It Works</p>
              <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.025em', marginBottom: 16 }}>Three steps. Under two minutes.</h2>
              <p style={{ color: '#64748b', fontSize: '1rem', maxWidth: 540, margin: '0 auto' }}>Our AI handles the reading so procurement officers can focus on decisions.</p>
            </div>
          </RevealSection>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {STEPS.map((step, idx) => (
              <RevealSection key={step.n} delay={idx * 100}>
                <div className="glass" style={{ padding: 32, position: 'relative', overflow: 'hidden', transition: 'transform 0.2s ease, box-shadow 0.2s ease', cursor: 'default', height: '100%' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 0 0 1px rgba(255,255,255,0.06) inset, 0 16px 48px rgba(0,0,0,0.5), 0 0 40px rgba(79,70,229,0.12)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                >
                  <div aria-hidden style={{ position: 'absolute', top: 16, right: 20, fontSize: '5rem', fontWeight: 900, color: 'rgba(79,70,229,0.07)', lineHeight: 1, fontFamily: "'Plus Jakarta Sans', sans-serif", userSelect: 'none' }}>{step.n}</div>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, rgba(79,70,229,0.2), rgba(124,58,237,0.15))', border: '1px solid rgba(79,70,229,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, boxShadow: '0 0 20px rgba(79,70,229,0.15)', color: '#a5b4fc' }}>{step.icon}</div>
                  <div style={{ marginBottom: 10 }}>
                    <span style={{ background: 'rgba(79,70,229,0.2)', border: '1px solid rgba(79,70,229,0.35)', color: '#818cf8', fontSize: '0.65rem', padding: '2px 8px', borderRadius: 6, fontWeight: 700, letterSpacing: '0.06em' }}>STEP {step.n}</span>
                  </div>
                  <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#f1f5f9', fontWeight: 700, fontSize: '1.15rem', marginBottom: 12, letterSpacing: '-0.01em' }}>{step.title}</h3>
                  <p style={{ color: '#64748b', fontSize: '0.88rem', lineHeight: 1.7, margin: 0 }}>{step.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: 'clamp(60px, 8vw, 100px) 24px', background: 'rgba(15,23,42,0.5)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <RevealSection>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <p style={{ color: '#6366f1', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Built Different</p>
              <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.025em', marginBottom: 16 }}>Not a black box. An auditable co-pilot.</h2>
              <p style={{ color: '#64748b', fontSize: '1rem', maxWidth: 520, margin: '0 auto' }}>Every verdict comes with the receipt — the exact sentence the AI used to decide.</p>
            </div>
          </RevealSection>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {FEATURES.map((f, idx) => (
              <RevealSection key={f.title} delay={idx * 80}>
                <div className="glass-sm" style={{ padding: '28px 24px', height: '100%', transition: 'transform 0.2s ease, box-shadow 0.2s ease', cursor: 'default' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4), 0 0 24px rgba(79,70,229,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                >
                  <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}>{f.icon}</div>
                  <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#e2e8f0', fontWeight: 700, fontSize: '1rem', marginBottom: 10 }}>{f.title}</h3>
                  <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* WHY IT MATTERS */}
      <section style={{ padding: 'clamp(60px, 8vw, 100px) 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <RevealSection>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 48, alignItems: 'center' }}>
              <div>
                <p style={{ color: '#6366f1', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Why It Matters</p>
                <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.025em', marginBottom: 20, lineHeight: 1.2 }}>
                  GeM handles lakhs of bids.<br />Manual review doesn't scale.
                </h2>
                <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.8 }}>
                  Procurement officers today read every bid document line-by-line against dozens of tender clauses.
                  Non-compliant bids get shortlisted. Disputes arise. Re-tendering delays projects by weeks.
                  GeM BidVerify eliminates the most error-prone step in the process.
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {PAIN_POINTS.map((p, i) => (
                  <div key={i} className="glass-sm" style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ color: '#ef4444', fontSize: '1rem', flexShrink: 0, marginTop: 1 }}>✗</span>
                      <span style={{ color: '#64748b', fontSize: '0.82rem', lineHeight: 1.5 }}>{p.before}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, borderLeft: '1px solid rgba(51,65,85,0.5)', paddingLeft: 16 }}>
                      <span style={{ color: '#10b981', fontSize: '1rem', flexShrink: 0, marginTop: 1 }}>✓</span>
                      <span style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.5 }}>{p.after}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section style={{ padding: 'clamp(60px, 8vw, 100px) 24px', background: 'rgba(15,23,42,0.6)', borderTop: '1px solid rgba(51,65,85,0.3)', borderBottom: '1px solid rgba(51,65,85,0.3)', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 600, height: 300, background: 'radial-gradient(ellipse, rgba(79,70,229,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <RevealSection>
          <div style={{ textAlign: 'center', position: 'relative' }}>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.025em', marginBottom: 16 }}>Ready to verify a bid?</h2>
            <p style={{ color: '#64748b', fontSize: '1rem', maxWidth: 460, margin: '0 auto 36px' }}>No account needed. Upload your PDFs and get a full compliance report in under 2 minutes.</p>
            <button onClick={onStart} className="btn-primary" style={{ padding: '16px 40px', fontSize: '1.05rem', borderRadius: 14 }} id="bottom-cta">
              Start Verification →
            </button>
          </div>
        </RevealSection>
      </section>

      {/* FOOTER */}
      <footer role="contentinfo" style={{ padding: '28px 24px', textAlign: 'center' }}>
        <p style={{ color: '#334155', fontSize: '0.75rem', margin: 0 }}>
          GeM BidVerify · AI-Powered · Built for Government e-Marketplace Procurement ·{' '}
          <span style={{ opacity: 0.7 }}>Hackathon Demo — AI analysis is indicative, not legally binding.</span>
        </p>
      </footer>

    </div>
  );
}
