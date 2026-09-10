import { useState } from 'react';

const CATEGORY_CLASSES = {
  Financial: 'cat-financial',
  Technical: 'cat-technical',
  Legal: 'cat-legal',
  Certification: 'cat-certification',
  Experience: 'cat-experience',
  Other: 'cat-other',
};

function VerdictBadge({ verdict }) {
  if (verdict === 'Compliant')
    return <span className="verdict-compliant">✓ Compliant</span>;
  if (verdict === 'Non-Compliant')
    return <span className="verdict-non-compliant">✗ Non-Compliant</span>;
  return <span className="verdict-not-found">? Not Found</span>;
}

function ConfidenceBar({ confidence, verdict }) {
  const color =
    verdict === 'Compliant' ? '#10B981' : verdict === 'Non-Compliant' ? '#EF4444' : '#F59E0B';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div className="progress-bar" style={{ width: 60 }}>
        <div className="progress-fill" style={{ width: `${confidence}%`, background: color }} />
      </div>
      <span style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 600 }}>{confidence}%</span>
    </div>
  );
}

export function ComplianceTable({ criteria, results }) {
  const [expandedRow, setExpandedRow] = useState(null);
  const [filter, setFilter] = useState('All');

  const merged = results.map((r) => ({
    ...r,
    ...criteria.find((c) => c.id === r.criterion_id),
  }));

  const filtered =
    filter === 'All' ? merged : merged.filter((r) => r.verdict === filter);

  const counts = {
    All: merged.length,
    Compliant: merged.filter((r) => r.verdict === 'Compliant').length,
    'Non-Compliant': merged.filter((r) => r.verdict === 'Non-Compliant').length,
    'Not Found': merged.filter((r) => r.verdict === 'Not Found').length,
  };

  const filterBtnStyle = (f) => ({
    padding: '6px 14px',
    borderRadius: 8,
    fontSize: '0.78rem',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.15s',
    background: filter === f ? (
      f === 'All' ? 'rgba(79,70,229,0.3)' :
      f === 'Compliant' ? 'rgba(16,185,129,0.25)' :
      f === 'Non-Compliant' ? 'rgba(239,68,68,0.25)' :
      'rgba(245,158,11,0.25)'
    ) : 'rgba(30,41,59,0.5)',
    color: filter === f ? (
      f === 'All' ? '#a5b4fc' :
      f === 'Compliant' ? '#34d399' :
      f === 'Non-Compliant' ? '#f87171' :
      '#fbbf24'
    ) : '#94a3b8',
    border: `1px solid ${filter === f ? (
      f === 'All' ? 'rgba(79,70,229,0.4)' :
      f === 'Compliant' ? 'rgba(16,185,129,0.35)' :
      f === 'Non-Compliant' ? 'rgba(239,68,68,0.35)' :
      'rgba(245,158,11,0.35)'
    ) : 'rgba(51,65,85,0.5)'}`,
  });

  return (
    <div className="animate-slide-up">
      {/* Header + Filter */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="7" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <rect x="14" y="3" width="7" height="7" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <rect x="14" y="14" width="7" height="7" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <path d="M3 17l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h3 style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '1rem', margin: 0 }}>Compliance Checklist</h3>
            <p style={{ color: '#64748b', fontSize: '0.73rem', margin: 0 }}>
              Click any row to see evidence details
            </p>
          </div>
        </div>

        {/* Filter buttons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['All', 'Compliant', 'Non-Compliant', 'Not Found'].map((f) => (
            <button key={f} style={filterBtnStyle(f)} onClick={() => setFilter(f)}>
              {f} <span style={{ opacity: 0.7 }}>({counts[f]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-sm" style={{ overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '32px 1fr 100px 130px 90px',
          gap: 12,
          padding: '12px 16px',
          background: 'rgba(15,23,42,0.8)',
          borderBottom: '1px solid rgba(51,65,85,0.5)',
        }}>
          {['#', 'Criterion / Requirement', 'Category', 'Verdict', 'Confidence'].map((h, i) => (
            <div key={i} style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {h}
            </div>
          ))}
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#475569' }}>No results for this filter.</div>
        ) : (
          filtered.map((row, i) => (
            <div key={row.criterion_id || i}>
              {/* Main row */}
              <div
                className="compliance-row"
                onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '32px 1fr 100px 130px 90px',
                  gap: 12,
                  padding: '14px 16px',
                  borderBottom: '1px solid rgba(30,41,59,0.8)',
                  cursor: 'pointer',
                  background: i % 2 === 0 ? 'transparent' : 'rgba(15,23,42,0.3)',
                  alignItems: 'center',
                  borderLeft: `3px solid ${
                    row.verdict === 'Compliant' ? '#10B981' :
                    row.verdict === 'Non-Compliant' ? '#EF4444' : '#F59E0B'
                  }`,
                  transition: 'background 0.15s',
                }}
              >
                {/* Number */}
                <span style={{ color: '#475569', fontWeight: 700, fontSize: '0.78rem' }}>{i + 1}</span>

                {/* Criterion name */}
                <div>
                  <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.85rem', marginBottom: 3 }}>
                    {row.criterion}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.72rem', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {row.requirement_text}
                  </div>
                </div>

                {/* Category */}
                <span className={`category-pill ${CATEGORY_CLASSES[row.category] || 'cat-other'}`}>
                  {row.category}
                </span>

                {/* Verdict */}
                <VerdictBadge verdict={row.verdict} />

                {/* Confidence */}
                <ConfidenceBar confidence={row.confidence} verdict={row.verdict} />
              </div>

              {/* Evidence Panel */}
              {expandedRow === i && (
                <div className="evidence-panel" style={{
                  padding: '16px 20px 16px 36px',
                  background: 'rgba(79,70,229,0.04)',
                  borderBottom: '1px solid rgba(51,65,85,0.5)',
                  borderLeft: `3px solid ${
                    row.verdict === 'Compliant' ? '#10B981' :
                    row.verdict === 'Non-Compliant' ? '#EF4444' : '#F59E0B'
                  }`,
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    {/* Requirement */}
                    <div>
                      <p style={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                        REQUIREMENT
                      </p>
                      <div style={{
                        background: 'rgba(30,41,59,0.6)',
                        border: '1px solid rgba(51,65,85,0.5)',
                        borderRadius: 10,
                        padding: '10px 14px',
                        color: '#94a3b8',
                        fontSize: '0.8rem',
                        lineHeight: 1.6,
                      }}>
                        {row.requirement_text}
                      </div>
                    </div>

                    {/* Evidence */}
                    <div>
                      <p style={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                        EVIDENCE FOUND IN BID
                      </p>
                      <div style={{
                        background: row.evidence ? 'rgba(79,70,229,0.08)' : 'rgba(30,41,59,0.4)',
                        border: `1px solid ${row.evidence ? 'rgba(79,70,229,0.25)' : 'rgba(51,65,85,0.4)'}`,
                        borderRadius: 10,
                        padding: '10px 14px',
                        color: row.evidence ? '#c7d2fe' : '#475569',
                        fontSize: '0.8rem',
                        lineHeight: 1.6,
                        fontStyle: row.evidence ? 'italic' : 'normal',
                      }}>
                        {row.evidence ? `"${row.evidence}"` : 'No supporting evidence found in the bid document.'}
                      </div>
                    </div>
                  </div>

                  {/* AI Reason */}
                  {row.reason && (
                    <div style={{ marginTop: 12, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ fontSize: '0.7rem', color: '#6366f1', fontWeight: 700, background: 'rgba(79,70,229,0.1)', border: '1px solid rgba(79,70,229,0.25)', padding: '2px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}>
                        AI Analysis
                      </span>
                      <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: 0, lineHeight: 1.5 }}>
                        {row.reason}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
