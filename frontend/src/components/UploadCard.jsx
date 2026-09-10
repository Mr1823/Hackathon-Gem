import { useState, useCallback } from 'react';

export function UploadCard({ label, description, icon, accept = '.pdf', onFileSelect, file, disabled }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const dropped = e.dataTransfer.files[0];
      if (dropped && dropped.type === 'application/pdf') {
        onFileSelect(dropped);
      }
    },
    [onFileSelect, disabled]
  );

  const handleChange = (e) => {
    const selected = e.target.files[0];
    if (selected) onFileSelect(selected);
  };

  return (
    <div
      className={`dropzone p-8 text-center select-none ${isDragging ? 'dropzone-active' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => { if (!disabled) document.getElementById(`upload-${label}`).click(); }}
    >
      <input
        id={`upload-${label}`}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />

      {file ? (
        /* File selected state */
        <div className="animate-fade-in">
          <div style={{ width: 56, height: 56, margin: '0 auto 12px', background: 'rgba(79,70,229,0.15)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="14 2 14 8 20 8" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="16" y1="13" x2="8" y2="13" stroke="#818CF8" strokeWidth="2" strokeLinecap="round"/>
              <line x1="16" y1="17" x2="8" y2="17" stroke="#818CF8" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <p style={{ color: '#a5b4fc', fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>
            {file.name}
          </p>
          <p style={{ color: '#64748b', fontSize: '0.75rem' }}>
            {(file.size / 1024 / 1024).toFixed(2)} MB · Click to replace
          </p>
        </div>
      ) : (
        /* Empty state */
        <div>
          <div style={{ width: 56, height: 56, margin: '0 auto 12px', background: 'rgba(30,41,59,0.8)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
          </div>
          <p style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.95rem', marginBottom: 4 }}>
            {label}
          </p>
          <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: 12 }}>
            {description}
          </p>
          <span style={{ display: 'inline-block', padding: '6px 16px', background: 'rgba(79,70,229,0.15)', border: '1px solid rgba(79,70,229,0.3)', borderRadius: 8, color: '#818cf8', fontSize: '0.8rem', fontWeight: 600 }}>
            Browse PDF
          </span>
          <p style={{ color: '#475569', fontSize: '0.7rem', marginTop: 8 }}>
            Drag & drop or click · PDF only · Max 25MB
          </p>
        </div>
      )}
    </div>
  );
}
