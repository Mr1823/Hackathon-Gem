export function CriteriaPanel({ criteria }) {
  if (!criteria || criteria.length === 0) return null;

  return (
    <div>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
        Extracted criteria
      </h3>
      <p style={{ color: 'var(--slate-500)', fontSize: 13, marginBottom: 16 }}>
        {criteria.length} eligibility requirements identified from the tender
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {criteria.map((c, i) => (
          <div
            key={c.id || i}
            style={{
              padding: '10px 0',
              borderBottom: i < criteria.length - 1 ? '1px solid var(--slate-200)' : 'none',
              display: 'flex',
              gap: 10,
              alignItems: 'baseline',
            }}
          >
            {/* Number — criteria are a real sequence, so numbering is warranted */}
            <span style={{
              color: 'var(--slate-500)',
              fontSize: 12,
              fontFamily: "'IBM Plex Mono', monospace",
              fontWeight: 500,
              minWidth: 20,
              flexShrink: 0,
            }}>
              {i + 1}.
            </span>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
                <span style={{ fontWeight: 500, fontSize: 13, color: 'var(--slate-800)' }}>
                  {c.criterion}
                </span>
                <span className="category-pill">{c.category}</span>
                {c.is_mandatory && (
                  <span className="tag-mandatory">Mandatory</span>
                )}
              </div>
              <p style={{ color: 'var(--slate-500)', fontSize: 12, lineHeight: 1.4, margin: 0 }}>
                {c.requirement_text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
