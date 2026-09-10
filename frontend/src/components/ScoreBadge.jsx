export function ScoreBadge({ score, compliantCount, nonCompliantCount, notFoundCount, total }) {
  return (
    <div className="summary-bar" style={{ marginBottom: 24 }}>
      {/* Overall score */}
      <div className="summary-cell" style={{ background: 'var(--slate-50)' }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 28, fontWeight: 500, color: 'var(--slate-800)', lineHeight: 1 }}>
          {score}%
        </div>
        <div style={{ color: 'var(--slate-500)', fontSize: 12, marginTop: 4 }}>
          overall compliance
        </div>
      </div>

      {/* Compliant count */}
      <div className="summary-cell">
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 22, fontWeight: 500, color: 'var(--green-800)', lineHeight: 1 }}>
          {compliantCount}
        </div>
        <div style={{ color: 'var(--slate-500)', fontSize: 12, marginTop: 4 }}>
          compliant
        </div>
      </div>

      {/* Non-compliant count */}
      <div className="summary-cell">
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 22, fontWeight: 500, color: 'var(--red-800)', lineHeight: 1 }}>
          {nonCompliantCount}
        </div>
        <div style={{ color: 'var(--slate-500)', fontSize: 12, marginTop: 4 }}>
          non-compliant
        </div>
      </div>

      {/* Not found count */}
      <div className="summary-cell">
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 22, fontWeight: 500, color: 'var(--amber-800)', lineHeight: 1 }}>
          {notFoundCount}
        </div>
        <div style={{ color: 'var(--slate-500)', fontSize: 12, marginTop: 4 }}>
          not found
        </div>
      </div>
    </div>
  );
}
