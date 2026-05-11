// dashboard.js — Dashboard page logic

async function loadDashboard() {
  try {
    const stats = await ResumeAPI.stats();
    document.getElementById('stat-total').textContent = stats.total_resumes;

    renderRecentResumes(stats.recent_resumes);
  } catch (err) {
    document.getElementById('recent-resumes').innerHTML =
      `<div class="text-center py-8" style="color:#f87171;">
         <p>Could not connect to the backend.</p>
         <p class="text-xs mt-1" style="color:#94a3b8;">Make sure Django is running on http://localhost:8000</p>
       </div>`;
    ['stat-total', 'stat-ats', 'stat-analyses'].forEach(id => {
      document.getElementById(id).textContent = '—';
    });
  }
}

function renderRecentResumes(resumes) {
  const container = document.getElementById('recent-resumes');
  if (!resumes || resumes.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12" style="color:#94a3b8;">
        <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 24 24" style="margin:0 auto 12px;opacity:0.4;"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <p class="font-medium mb-2">No resumes yet</p>
        <a href="builder.html" class="btn-primary" style="display:inline-block;text-decoration:none;padding:10px 20px;">Create Your First Resume</a>
      </div>`;
    return;
  }

  const templateColors = {
    modern: '#6366f1', minimal: '#a78bfa',
    ats_professional: '#4ade80', two_column: '#38bdf8',
  };

  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      ${resumes.map(r => `
        <div class="glass p-5 fade-in" style="border-radius:12px;border-left:3px solid ${templateColors[r.template_name] || '#6366f1'};">
          <div class="flex items-start justify-between mb-3">
            <div>
              <div class="font-bold text-white text-base">${escHtml(r.name)}</div>
              <div class="text-xs mt-0.5" style="color:#94a3b8;">${escHtml(r.title || 'No title')}</div>
            </div>
            <span class="chip chip-blue" style="font-size:10px;">${r.template_name.replace('_', ' ')}</span>
          </div>
          <div class="text-xs mb-4" style="color:#94a3b8;">${escHtml(r.email)}</div>
          <div class="text-xs mb-4" style="color:#555;">${formatDate(r.created_at)}</div>
          <div class="flex gap-2">
            <button class="btn-secondary flex-1" style="font-size:12px;padding:7px 10px;"
              onclick="editResume('${r.id}')">Edit</button>
            <button class="btn-primary flex-1" style="font-size:12px;padding:7px 10px;"
              onclick="downloadResume('${r.id}', '${escHtml(r.name)}')">PDF</button>
            <button onclick="deleteResume('${r.id}')" style="width:34px;height:34px;background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.3);border-radius:8px;cursor:pointer;color:#f87171;font-size:16px;display:flex;align-items:center;justify-content:center;">&#10005;</button>
          </div>
        </div>`).join('')}
    </div>`;
}

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });
}

async function editResume(id) {
  localStorage.setItem('editResumeId', id);
  window.location.href = 'builder.html';
}

async function downloadResume(id, name) {
  try {
    showToast('Generating PDF…', 'info');
    await ResumeAPI.downloadPDF(id, name);
    showToast('PDF downloaded!', 'success');
  } catch (err) {
    showToast('PDF download failed: ' + err.message, 'error');
  }
}

async function deleteResume(id) {
  if (!confirm('Delete this resume?')) return;
  try {
    await ResumeAPI.delete(id);
    showToast('Resume deleted.', 'success');
    loadDashboard();
  } catch (err) {
    showToast('Delete failed: ' + err.message, 'error');
  }
}

loadDashboard();
