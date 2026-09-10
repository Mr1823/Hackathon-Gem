import { useState } from 'react';
import { exportReport } from '../api';

export function ExportButton({ reportData, disabled }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      await exportReport(reportData);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const spinStyle = {
    animation: 'spin 1s linear infinite',
    display: 'inline-block',
  };

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <button
        onClick={handleExport}
        disabled={disabled || loading}
        className="btn-primary"
        style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 180 }}
      >
        {loading ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={spinStyle}>
              <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
            </svg>
            Generating PDF...
          </>
        ) : done ? (
          <>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Downloaded!
          </>
        ) : (
          <>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="7 10 12 15 17 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="12" y1="15" x2="12" y2="3" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Export Audit PDF
          </>
        )}
      </button>
    </>
  );
}
