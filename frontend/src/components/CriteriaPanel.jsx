const CATEGORY_CLASSES = {
  Financial: 'cat-financial',
  Technical: 'cat-technical',
  Legal: 'cat-legal',
  Certification: 'cat-certification',
  Experience: 'cat-experience',
  Other: 'cat-other',
};

const CATEGORY_ICONS = {
  Financial: '₹',
  Technical: '⚙',
  Legal: '⚖',
  Certification: '★',
  Experience: '○',
  Other: '●',
};

export function CriteriaPanel({ criteria }) {
  if (!criteria || criteria.length === 0) return null;

  return (
    <div className="animate-slide-up">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
            <path d="M9 11l3 3L22 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <h3 style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '1rem', margin: 0 }}>
            Extracted Eligibility Criteria
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.75rem', margin: 0 }}>
            {criteria.length} criteria identified by AI from the tender document
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        {criteria.map((c, i) => (
          <div
            key={c.id || i}
            className="glass-sm animate-fade-in"
            style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 12, animationDelay: `${i * 0.05}s` }}
          >
            {/* Number */}
            <div style={{
              minWidth: 28, height: 28,
              background: 'rgba(79,70,229,0.15)',
              border: '1px solid rgba(79,70,229,0.3)',
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#818cf8', fontWeight: 700, fontSize: '0.75rem'
            }}>
              {i + 1}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.875rem' }}>
                  {CATEGORY_ICONS[c.category] || '●'} {c.criterion}
                </span>
                <span className={`category-pill ${CATEGORY_CLASSES[c.category] || 'cat-other'}`}>
                  {c.category}
                </span>
                {c.is_mandatory && (
                  <span style={{ fontSize: '0.65rem', color: '#f87171', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 4, padding: '1px 6px', fontWeight: 600 }}>
                    MANDATORY
                  </span>
                )}
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: 0, lineHeight: 1.5 }}>
                {c.requirement_text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
