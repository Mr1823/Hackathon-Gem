import { useState, useCallback } from 'react';

export function UploadCard({ label, accept = '.pdf', onFileSelect, file, disabled }) {
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

  const inputId = `upload-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div
      className={`dropzone ${isDragging ? 'dropzone-active' : ''} ${disabled ? 'opacity-50' : ''}`}
      style={disabled ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => { if (!disabled) document.getElementById(inputId).click(); }}
    >
      <input
        id={inputId}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />

      {file ? (
        <div>
          <p style={{ fontWeight: 500, color: 'var(--slate-800)', marginBottom: 4 }}>
            {file.name}
          </p>
          <p style={{ color: 'var(--slate-500)', fontSize: 12 }}>
            {(file.size / 1024 / 1024).toFixed(2)} MB — click to replace
          </p>
        </div>
      ) : (
        <div>
          <p style={{ fontWeight: 500, color: 'var(--slate-800)', marginBottom: 4 }}>
            {label}
          </p>
          <p style={{ color: 'var(--slate-500)', fontSize: 12 }}>
            Drop a PDF here, or click to browse. Max 25 MB.
          </p>
        </div>
      )}
    </div>
  );
}
