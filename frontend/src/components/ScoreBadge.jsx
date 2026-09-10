import { useEffect, useRef } from 'react';

function getScoreColor(score) {
  if (score >= 80) return { stroke: '#10B981', text: '#34d399', glow: 'glow-green', label: 'Excellent' };
  if (score >= 60) return { stroke: '#F59E0B', text: '#fbbf24', glow: 'glow-amber', label: 'Partial' };
  return { stroke: '#EF4444', text: '#f87171', glow: 'glow-red', label: 'Non-Compliant' };
}

export function ScoreBadge({ score, compliantCount, nonCompliantCount, notFoundCount, total }) {
  const { stroke, text, glow, label } = getScoreColor(score);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className={`glass ${glow} animate-fade-in`} style={{ padding: 32, textAlign: 'center' }}>
      {/* Score Ring */}
      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <svg width="140" height="140" viewBox="0 0 140 140">
          {/* Background ring */}
          <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(30,41,59,0.8)" strokeWidth="10" />
          {/* Score ring */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 70 70)"
            style={{ transition: 'stroke-dashoffset 1.5s ease-out', filter: `drop-shadow(0 0 8px ${stroke}80)` }}
          />
        </svg>
        {/* Score text */}
        <div style={{ position: 'absolute', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: text, lineHeight: 1 }}>
            {score}%
          </div>
          <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Compliant
          </div>
        </div>
      </div>

      {/* Label */}
      <div style={{
        display: 'inline-block',
        padding: '4px 16px',
        borderRadius: 9999,
        background: `${stroke}18`,
        border: `1px solid ${stroke}40`,
        color: text,
        fontWeight: 700,
        fontSize: '0.8rem',
        marginBottom: 20,
        letterSpacing: '0.025em',
      }}>
        {label}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <StatBox value={compliantCount} label="Compliant" color="#34d399" bg="rgba(16,185,129,0.1)" />
        <StatBox value={nonCompliantCount} label="Failed" color="#f87171" bg="rgba(239,68,68,0.1)" />
        <StatBox value={notFoundCount} label="Not Found" color="#fbbf24" bg="rgba(245,158,11,0.1)" />
      </div>

      <p style={{ color: '#475569', fontSize: '0.72rem', marginTop: 16 }}>
        {compliantCount} of {total} criteria satisfied
      </p>
    </div>
  );
}

function StatBox({ value, label, color, bg }) {
  return (
    <div style={{ background: bg, borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
      <div style={{ fontSize: '1.4rem', fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>{label}</div>
    </div>
  );
}
