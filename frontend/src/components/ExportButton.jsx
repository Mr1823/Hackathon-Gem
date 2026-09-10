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

  return (
    <button
      onClick={handleExport}
      disabled={disabled || loading}
      className="btn-secondary"
      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
    >
      {loading ? (
        <>
          <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
          Generating PDF…
        </>
      ) : done ? (
        <>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Downloaded
        </>
      ) : (
        <>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="7 10 12 15 17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Export PDF
        </>
      )}
    </button>
  );
}
