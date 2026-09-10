import { useState } from 'react';

function VerdictBadge({ verdict }) {
  if (verdict === 'Compliant')
    return <span className="verdict-compliant">Compliant</span>;
  if (verdict === 'Non-Compliant')
    return <span className="verdict-non-compliant">Non-Compliant</span>;
  return <span className="verdict-not-found">Not Found</span>;
}

function verdictRowClass(verdict) {
  if (verdict === 'Compliant') return 'row-compliant';
  if (verdict === 'Non-Compliant') return 'row-non-compliant';
  return 'row-not-found';
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

  const filters = ['All', 'Compliant', 'Non-Compliant', 'Not Found'];

  return (
    <div>
      {/* Filter tabs — button group, not pills */}
      <div style={{ marginBottom: 16, display: 'flex' }}>
        {filters.map((f) => (
          <button
            key={f}
            className={`filter-tab ${filter === f ? 'filter-tab-active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f} ({counts[f]})
          </button>
        ))}
      </div>

      {/* Table — real <table> for semantics, accessibility, and print */}
      <table className="compliance-table">
        <thead>
          <tr>
            <th style={{ width: 36 }}>#</th>
            <th>Criterion</th>
            <th style={{ width: 90 }}>Category</th>
            <th style={{ width: 110 }}>Verdict</th>
            <th style={{ width: 64 }}>Conf.</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ padding: 32, textAlign: 'center', color: 'var(--slate-500)' }}>
                No results match this filter.
              </td>
            </tr>
          ) : (
            filtered.map((row, i) => {
              const isExpanded = expandedRow === i;
              return (
                <>
                  {/* Main data row */}
                  <tr
                    key={row.criterion_id || i}
                    className={verdictRowClass(row.verdict)}
                    onClick={() => setExpandedRow(isExpanded ? null : i)}
                    style={isExpanded ? { background: 'var(--slate-50)' } : undefined}
                  >
                    <td style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: 'var(--slate-500)' }}>
                      {i + 1}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--slate-800)', marginBottom: 2 }}>
                        {row.criterion}
                      </div>
                      <div style={{
                        color: 'var(--slate-500)',
                        fontSize: 12,
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {row.requirement_text}
                      </div>
                    </td>
                    <td>
                      <span className="category-pill">{row.category}</span>
                    </td>
                    <td>
                      <VerdictBadge verdict={row.verdict} />
                    </td>
                    <td style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: 'var(--slate-700)' }}>
                      {row.confidence}%
                    </td>
                  </tr>

                  {/* Evidence detail row */}
                  {isExpanded && (
                    <tr key={`detail-${row.criterion_id || i}`} className="evidence-panel">
                      <td colSpan={5}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

                          {/* Requirement */}
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                              Requirement
                            </div>
                            <div style={{
                              background: 'var(--white)',
                              border: '1px solid var(--slate-200)',
                              borderRadius: 3,
                              padding: '10px 12px',
                              fontSize: 13,
                              color: 'var(--slate-700)',
                              lineHeight: 1.5,
                            }}>
                              {row.requirement_text}
                            </div>
                          </div>

                          {/* Evidence */}
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                              Evidence from bid
                            </div>
                            <div style={{
                              background: row.evidence ? 'var(--blue-50)' : 'var(--slate-50)',
                              border: `1px solid ${row.evidence ? '#BFDBFE' : 'var(--slate-200)'}`,
                              borderRadius: 3,
                              padding: '10px 12px',
                              fontSize: 13,
                              color: row.evidence ? 'var(--slate-800)' : 'var(--slate-500)',
                              lineHeight: 1.5,
                              fontStyle: row.evidence ? 'italic' : 'normal',
                            }}>
                              {row.evidence ? `"${row.evidence}"` : 'No supporting evidence found in the bid document.'}
                            </div>
                          </div>
                        </div>

                        {/* AI reasoning */}
                        {row.reason && (
                          <div style={{ marginTop: 12 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                              AI analysis
                            </div>
                            <p style={{ color: 'var(--slate-700)', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                              {row.reason}
                            </p>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
