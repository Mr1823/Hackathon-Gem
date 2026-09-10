const API_BASE = '/api';

export async function uploadTender(file) {
  const formData = new FormData();
  formData.append('tender', file);

  const response = await fetch(`${API_BASE}/upload-tender`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to upload tender');
  }

  return response.json();
}

export async function verifyCompliance(bidFile, criteria) {
  const formData = new FormData();
  formData.append('bid', bidFile);
  formData.append('criteria', JSON.stringify(criteria));

  const response = await fetch(`${API_BASE}/verify-compliance`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Compliance verification failed');
  }

  return response.json();
}

export async function exportReport(reportData) {
  const response = await fetch(`${API_BASE}/export-report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reportData),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Export failed');
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'GeM_Compliance_Report.pdf';
  a.click();
  URL.revokeObjectURL(url);
}

export async function checkHealth() {
  const response = await fetch(`${API_BASE}/health`);
  return response.json();
}
