/**
 * api.js — Centralised API client for SmartResume AI
 * All fetch calls go through this module.
 */

const BASE_URL = 'http://localhost:8000/api';

// --------------------------------------------------------------------------
// Utility helpers
// --------------------------------------------------------------------------

async function _handleResponse(res) {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.detail || JSON.stringify(data));
    return data;
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res; // Return raw response for binary (PDF)
}

function _headers(extra = {}) {
  return { 'Content-Type': 'application/json', ...extra };
}

// --------------------------------------------------------------------------
// Resume APIs
// --------------------------------------------------------------------------

const ResumeAPI = {
  list: () =>
    fetch(`${BASE_URL}/resumes/`).then(_handleResponse),

  get: (id) =>
    fetch(`${BASE_URL}/resumes/${id}/`).then(_handleResponse),

  create: (data) =>
    fetch(`${BASE_URL}/resumes/`, {
      method: 'POST',
      headers: _headers(),
      body: JSON.stringify(data),
    }).then(_handleResponse),

  update: (id, data) =>
    fetch(`${BASE_URL}/resumes/${id}/`, {
      method: 'PUT',
      headers: _headers(),
      body: JSON.stringify(data),
    }).then(_handleResponse),

  delete: (id) =>
    fetch(`${BASE_URL}/resumes/${id}/`, { method: 'DELETE' }).then(res => {
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
      return true;
    }),

  downloadPDF: async (id, name = 'resume') => {
    const res = await fetch(`${BASE_URL}/resumes/${id}/pdf/`);
    if (!res.ok) throw new Error('PDF generation failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}_resume.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  },

  stats: () =>
    fetch(`${BASE_URL}/resumes/stats/`).then(_handleResponse),
};

// --------------------------------------------------------------------------
// Analyzer APIs
// --------------------------------------------------------------------------

const AnalyzerAPI = {
  analyze: (formData) =>
    fetch(`${BASE_URL}/analyzer/analyze/`, {
      method: 'POST',
      body: formData, // multipart
    }).then(_handleResponse),

  listReports: () =>
    fetch(`${BASE_URL}/analyzer/reports/`).then(_handleResponse),

  getReport: (id) =>
    fetch(`${BASE_URL}/analyzer/reports/${id}/`).then(_handleResponse),
};

// --------------------------------------------------------------------------
// Roadmap APIs
// --------------------------------------------------------------------------

const RoadmapAPI = {
  generate: (role_name, current_skills) =>
    fetch(`${BASE_URL}/roadmap/generate/`, {
      method: 'POST',
      headers: _headers(),
      body: JSON.stringify({ role_name, current_skills }),
    }).then(_handleResponse),

  youtube: (skills) =>
    fetch(`${BASE_URL}/roadmap/youtube/`, {
      method: 'POST',
      headers: _headers(),
      body: JSON.stringify({ skills }),
    }).then(_handleResponse),

  history: () =>
    fetch(`${BASE_URL}/roadmap/history/`).then(_handleResponse),
};

// --------------------------------------------------------------------------
// Toast notification utility
// --------------------------------------------------------------------------

function showToast(message, type = 'info', duration = 3500) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;">
      <span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
      <span>${message}</span>
    </div>`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

// --------------------------------------------------------------------------
// Loading state helper
// --------------------------------------------------------------------------

function setLoading(btn, loading, text = '') {
  if (loading) {
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = `<span class="spinner" style="display:inline-block;width:16px;height:16px;margin-right:8px;vertical-align:middle;"></span>${text || 'Processing...'}`;
    btn.disabled = true;
  } else {
    btn.innerHTML = btn.dataset.originalText || text;
    btn.disabled = false;
  }
}
