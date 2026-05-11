// builder.js — Resume Builder page logic

// ── State ────────────────────────────────────────────────────────────────────
let state = {
  id: null,
  name: '', title: '', email: '', phone: '', location: '',
  summary: '', portfolio: '', github: '', linkedin: '',
  skills: [], experience: [], education: [],
  projects: [], certifications: [], languages: [], achievements: [],
  template_name: 'modern',
  accent_color: '#6366f1',
};

// ── Init ─────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active-tab'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
      btn.classList.add('active-tab');
      document.getElementById(`tab-${btn.dataset.tab}`).classList.remove('hidden');
    });
  });

  // Zoom
  const zoomSlider = document.getElementById('zoom-slider');
  const zoomLabel = document.getElementById('zoom-label');
  zoomSlider.addEventListener('input', () => {
    const v = zoomSlider.value;
    zoomLabel.textContent = `${v}%`;
    document.getElementById('preview-wrapper').style.transform = `scale(${v / 100})`;
  });

  // Template & color
  document.getElementById('template-select').addEventListener('change', e => {
    state.template_name = e.target.value;
    renderPreview();
  });
  document.getElementById('accent-color').addEventListener('input', e => {
    state.accent_color = e.target.value;
    renderPreview();
  });

  // If selected from templates page
  const savedTemplate = localStorage.getItem('selectedTemplate');
  if (savedTemplate) {
    state.template_name = savedTemplate;
    document.getElementById('template-select').value = savedTemplate;
    localStorage.removeItem('selectedTemplate');
  }

  // Personal field listeners
  ['name','title','email','phone','location','summary','linkedin','github','portfolio'].forEach(f => {
    document.getElementById(`f-${f}`).addEventListener('input', e => {
      state[f] = e.target.value;
      renderPreview();
    });
  });

  // Skills input
  const skillInput = document.getElementById('skill-input');
  skillInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = skillInput.value.replace(',', '').trim();
      if (val && !state.skills.includes(val)) {
        state.skills.push(val);
        skillInput.value = '';
        renderSkillChips();
        renderPreview();
      }
    }
  });

  // Dynamic sections
  document.getElementById('add-experience').addEventListener('click', () => addExperience());
  document.getElementById('add-education').addEventListener('click', () => addEducation());
  document.getElementById('add-project').addEventListener('click', () => addProject());
  document.getElementById('add-cert').addEventListener('click', () => addCert());

  // Languages
  document.getElementById('f-languages').addEventListener('input', e => {
    state.languages = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
    renderPreview();
  });

  // Achievements
  document.getElementById('f-achievements').addEventListener('input', e => {
    state.achievements = e.target.value.split('\n').map(s => s.trim()).filter(Boolean);
    renderPreview();
  });

  // Save & Download
  document.getElementById('btn-save').addEventListener('click', saveResume);
  document.getElementById('btn-download').addEventListener('click', downloadPDF);

  // Load existing resume if editing
  const editId = localStorage.getItem('editResumeId');
  if (editId) {
    await loadResume(editId);
    localStorage.removeItem('editResumeId');
  }

  renderPreview();
});

// ── Dynamic Section Builders ─────────────────────────────────────────────────
function addExperience(data = {}) {
  const idx = state.experience.length;
  state.experience.push({ title:'', company:'', start_date:'', end_date:'', description:'' });
  const container = document.getElementById('experience-list');
  const card = document.createElement('div');
  card.className = 'glass p-4';
  card.style.borderRadius = '12px';
  card.dataset.idx = idx;
  card.innerHTML = `
    <div class="flex justify-between mb-3">
      <span class="text-sm font-bold text-white">Experience #${idx+1}</span>
      <button onclick="removeSection('experience',${idx})" style="color:#f87171;font-size:18px;background:none;border:none;cursor:pointer;">&#10005;</button>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div><label class="section-label">Job Title</label><input class="input-field" placeholder="Software Engineer" oninput="updateSection('experience',${idx},'title',this.value)"/></div>
      <div><label class="section-label">Company</label><input class="input-field" placeholder="TechCorp" oninput="updateSection('experience',${idx},'company',this.value)"/></div>
      <div><label class="section-label">Start Date</label><input class="input-field" placeholder="Jan 2022" oninput="updateSection('experience',${idx},'start_date',this.value)"/></div>
      <div><label class="section-label">End Date</label><input class="input-field" placeholder="Present" oninput="updateSection('experience',${idx},'end_date',this.value)"/></div>
    </div>
    <div class="mt-3"><label class="section-label">Description</label>
      <textarea class="input-field" rows="3" placeholder="Describe your responsibilities and achievements…" oninput="updateSection('experience',${idx},'description',this.value)"></textarea>
    </div>`;
  if (data.title) {
    card.querySelectorAll('input')[0].value = data.title;
    card.querySelectorAll('input')[1].value = data.company || '';
    card.querySelectorAll('input')[2].value = data.start_date || '';
    card.querySelectorAll('input')[3].value = data.end_date || '';
    card.querySelector('textarea').value = data.description || '';
  }
  container.appendChild(card);
}

function addEducation(data = {}) {
  const idx = state.education.length;
  state.education.push({ degree:'', institution:'', year:'', gpa:'' });
  const container = document.getElementById('education-list');
  const card = document.createElement('div');
  card.className = 'glass p-4';
  card.style.borderRadius = '12px';
  card.innerHTML = `
    <div class="flex justify-between mb-3">
      <span class="text-sm font-bold text-white">Education #${idx+1}</span>
      <button onclick="removeSection('education',${idx})" style="color:#f87171;font-size:18px;background:none;border:none;cursor:pointer;">&#10005;</button>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div><label class="section-label">Degree</label><input class="input-field" placeholder="B.Sc Computer Science" oninput="updateSection('education',${idx},'degree',this.value)" value="${data.degree||''}"/></div>
      <div><label class="section-label">Institution</label><input class="input-field" placeholder="MIT" oninput="updateSection('education',${idx},'institution',this.value)" value="${data.institution||''}"/></div>
      <div><label class="section-label">Year</label><input class="input-field" placeholder="2020" oninput="updateSection('education',${idx},'year',this.value)" value="${data.year||''}"/></div>
      <div><label class="section-label">GPA (optional)</label><input class="input-field" placeholder="3.8/4.0" oninput="updateSection('education',${idx},'gpa',this.value)" value="${data.gpa||''}"/></div>
    </div>`;
  container.appendChild(card);
}

function addProject(data = {}) {
  const idx = state.projects.length;
  state.projects.push({ name:'', description:'', link:'' });
  const container = document.getElementById('project-list');
  const card = document.createElement('div');
  card.className = 'glass p-4';
  card.style.borderRadius = '12px';
  card.innerHTML = `
    <div class="flex justify-between mb-3">
      <span class="text-sm font-bold text-white">Project #${idx+1}</span>
      <button onclick="removeSection('projects',${idx})" style="color:#f87171;font-size:18px;background:none;border:none;cursor:pointer;">&#10005;</button>
    </div>
    <div><label class="section-label">Project Name</label><input class="input-field mb-2" placeholder="SmartResume AI" oninput="updateSection('projects',${idx},'name',this.value)" value="${data.name||''}"/></div>
    <div><label class="section-label">Link (optional)</label><input class="input-field mb-2" placeholder="github.com/..." oninput="updateSection('projects',${idx},'link',this.value)" value="${data.link||''}"/></div>
    <div><label class="section-label">Description</label>
      <textarea class="input-field" rows="2" oninput="updateSection('projects',${idx},'description',this.value)">${data.description||''}</textarea>
    </div>`;
  container.appendChild(card);
}

function addCert(data = {}) {
  const idx = state.certifications.length;
  state.certifications.push({ name:'', issuer:'', year:'' });
  const container = document.getElementById('cert-list');
  const card = document.createElement('div');
  card.className = 'glass p-3';
  card.style.borderRadius = '10px';
  card.innerHTML = `
    <div class="grid grid-cols-3 gap-2">
      <input class="input-field" placeholder="Cert name" oninput="updateSection('certifications',${idx},'name',this.value)" value="${data.name||''}"/>
      <input class="input-field" placeholder="Issuer" oninput="updateSection('certifications',${idx},'issuer',this.value)" value="${data.issuer||''}"/>
      <input class="input-field" placeholder="Year" oninput="updateSection('certifications',${idx},'year',this.value)" value="${data.year||''}"/>
    </div>`;
  container.appendChild(card);
}

function updateSection(section, idx, field, value) {
  if (state[section][idx]) {
    state[section][idx][field] = value;
    renderPreview();
  }
}

function removeSection(section, idx) {
  state[section].splice(idx, 1);
  // Re-render the appropriate list from scratch
  const listMap = {
    experience: { containerId: 'experience-list', addFn: addExperience },
    education:  { containerId: 'education-list',  addFn: addEducation },
    projects:   { containerId: 'project-list',    addFn: addProject },
    certifications: { containerId: 'cert-list',   addFn: addCert },
  };
  const mapping = listMap[section];
  if (mapping) {
    const saved = [...state[section]];
    state[section] = [];
    document.getElementById(mapping.containerId).innerHTML = '';
    saved.forEach(item => mapping.addFn(item));
  }
  renderPreview();
}

function renderSkillChips() {
  const container = document.getElementById('skill-chips');
  container.innerHTML = state.skills.map((s,i) => `
    <span class="chip chip-blue" style="cursor:default;">
      ${s}
      <button onclick="removeSkill(${i})" style="background:none;border:none;color:#818cf8;cursor:pointer;padding:0 0 0 4px;font-size:13px;">&#10005;</button>
    </span>`).join('');
}

function removeSkill(idx) {
  state.skills.splice(idx, 1);
  renderSkillChips();
  renderPreview();
}

// ── Save / Load / Download ────────────────────────────────────────────────────
async function saveResume() {
  if (!state.name || !state.email) {
    showToast('Name and Email are required.', 'error'); return;
  }
  const btn = document.getElementById('btn-save');
  setLoading(btn, true, 'Saving…');
  try {
    if (state.id) {
      await ResumeAPI.update(state.id, state);
      showToast('Resume updated!', 'success');
    } else {
      const created = await ResumeAPI.create(state);
      state.id = created.id;
      showToast('Resume saved!', 'success');
    }
  } catch (err) {
    showToast('Save failed: ' + err.message, 'error');
  } finally {
    setLoading(btn, false);
  }
}

async function downloadPDF() {
  if (!state.id) {
    // Save first
    if (!state.name || !state.email) { showToast('Please fill Name and Email first.', 'error'); return; }
    await saveResume();
  }
  if (!state.id) return;
  const btn = document.getElementById('btn-download');
  setLoading(btn, true, 'Generating…');
  try {
    await ResumeAPI.downloadPDF(state.id, state.name);
    showToast('PDF downloaded!', 'success');
  } catch (err) {
    showToast('PDF failed: ' + err.message, 'error');
  } finally {
    setLoading(btn, false);
  }
}

async function loadResume(id) {
  try {
    const data = await ResumeAPI.get(id);
    Object.assign(state, data);
    // Populate personal fields
    ['name','title','email','phone','location','summary','linkedin','github','portfolio'].forEach(f => {
      const el = document.getElementById(`f-${f}`);
      if (el) el.value = state[f] || '';
    });
    document.getElementById('template-select').value = state.template_name || 'modern';
    document.getElementById('accent-color').value = state.accent_color || '#6366f1';
    // Dynamic sections
    state.experience.forEach(e => addExperience(e));
    state.education.forEach(e => addEducation(e));
    state.projects.forEach(p => addProject(p));
    state.certifications.forEach(c => addCert(c));
    document.getElementById('f-languages').value = (state.languages || []).join(', ');
    document.getElementById('f-achievements').value = (state.achievements || []).join('\n');
    renderSkillChips();
    renderPreview();
    showToast('Resume loaded!', 'info');
  } catch (err) {
    showToast('Could not load resume.', 'error');
  }
}

// ── Live Preview Renderer ────────────────────────────────────────────────────
function renderPreview() {
  const el = document.getElementById('resume-preview');
  const t = state.template_name;
  if (t === 'modern') el.innerHTML = modernTemplate(state);
  else if (t === 'minimal') el.innerHTML = minimalTemplate(state);
  else if (t === 'ats_professional') el.innerHTML = atsProfTemplate(state);
  else if (t === 'two_column') el.innerHTML = twoColTemplate(state);
  else el.innerHTML = modernTemplate(state);
}

// ── Template Renderers (Client-side HTML for live preview) ───────────────────
function esc(v) { return String(v||'').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function modernTemplate(s) {
  const acc = s.accent_color || '#6366f1';
  return `<div style="font-family:Arial,sans-serif;font-size:11px;color:#111;line-height:1.5;background:white;">
  <div style="background:${acc};padding:24px 28px;color:white;">
    <div style="font-size:24px;font-weight:700;">${esc(s.name||'Your Name')}</div>
    <div style="font-size:13px;opacity:0.85;margin-top:2px;">${esc(s.title||'')}</div>
    <div style="font-size:10px;opacity:0.7;margin-top:6px;">${[s.email,s.phone,s.location,s.linkedin,s.github].filter(Boolean).map(esc).join(' | ')}</div>
  </div>
  <div style="padding:20px 28px;">
    ${s.summary ? `<div style="border-bottom:2px solid ${acc};padding-bottom:4px;font-weight:700;font-size:11px;color:${acc};text-transform:uppercase;margin-bottom:6px;">Summary</div><p style="margin:0 0 14px;">${esc(s.summary)}</p>` : ''}
    ${s.skills?.length ? `<div style="border-bottom:2px solid ${acc};padding-bottom:4px;font-weight:700;font-size:11px;color:${acc};text-transform:uppercase;margin-bottom:6px;">Skills</div><p style="margin:0 0 14px;">${s.skills.map(esc).join(' • ')}</p>` : ''}
    ${s.experience?.length ? `<div style="border-bottom:2px solid ${acc};padding-bottom:4px;font-weight:700;font-size:11px;color:${acc};text-transform:uppercase;margin-bottom:8px;">Experience</div>${s.experience.map(e=>`<div style="margin-bottom:10px;"><div style="font-weight:700;">${esc(e.title)} — ${esc(e.company)}</div><div style="color:#888;font-size:10px;">${esc(e.start_date)} – ${esc(e.end_date||'Present')}</div><div style="margin-top:3px;">${esc(e.description)}</div></div>`).join('')}` : ''}
    ${s.education?.length ? `<div style="border-bottom:2px solid ${acc};padding-bottom:4px;font-weight:700;font-size:11px;color:${acc};text-transform:uppercase;margin:14px 0 8px;">Education</div>${s.education.map(e=>`<div style="margin-bottom:8px;"><div style="font-weight:700;">${esc(e.degree)} — ${esc(e.institution)}</div><div style="color:#888;font-size:10px;">${esc(e.year)} ${e.gpa?'| GPA: '+esc(e.gpa):''}</div></div>`).join('')}` : ''}
    ${s.projects?.length ? `<div style="border-bottom:2px solid ${acc};padding-bottom:4px;font-weight:700;font-size:11px;color:${acc};text-transform:uppercase;margin:14px 0 8px;">Projects</div>${s.projects.map(p=>`<div style="margin-bottom:8px;"><div style="font-weight:700;">${esc(p.name)}</div><div>${esc(p.description)}</div></div>`).join('')}` : ''}
    ${s.certifications?.length ? `<div style="border-bottom:2px solid ${acc};padding-bottom:4px;font-weight:700;font-size:11px;color:${acc};text-transform:uppercase;margin:14px 0 8px;">Certifications</div>${s.certifications.map(c=>`<div>• <b>${esc(c.name)}</b> ${esc(c.issuer||'')} ${esc(c.year||'')}</div>`).join('')}` : ''}
    ${s.achievements?.length ? `<div style="border-bottom:2px solid ${acc};padding-bottom:4px;font-weight:700;font-size:11px;color:${acc};text-transform:uppercase;margin:14px 0 8px;">Achievements</div>${s.achievements.map(a=>`<div>• ${esc(a)}</div>`).join('')}` : ''}
  </div></div>`;
}

function minimalTemplate(s) {
  const acc = s.accent_color || '#6366f1';
  return `<div style="font-family:'Georgia',serif;font-size:11px;color:#222;line-height:1.6;background:white;padding:32px 36px;">
  <div style="font-size:26px;font-weight:700;color:#111;letter-spacing:-0.5px;">${esc(s.name||'Your Name')}</div>
  ${s.title?`<div style="font-size:13px;color:#555;margin-top:2px;">${esc(s.title)}</div>`:''}
  <div style="font-size:10px;color:#888;margin-top:6px;border-bottom:1px solid #ddd;padding-bottom:12px;margin-bottom:16px;">${[s.email,s.phone,s.location].filter(Boolean).map(esc).join(' · ')}</div>
  ${s.summary?`<p style="margin:0 0 16px;color:#333;">${esc(s.summary)}</p>`:''}
  ${s.skills?.length?`<div style="font-weight:700;font-size:10px;color:${acc};text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Skills</div><p style="margin:0 0 16px;">${s.skills.map(esc).join(' · ')}</p>`:''}
  ${s.experience?.length?`<div style="font-weight:700;font-size:10px;color:${acc};text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Experience</div>${s.experience.map(e=>`<div style="margin-bottom:12px;"><div style="font-weight:700;font-size:11.5px;">${esc(e.title)} · ${esc(e.company)}</div><div style="color:#888;font-size:10px;">${esc(e.start_date)} – ${esc(e.end_date||'Present')}</div><div style="margin-top:3px;">${esc(e.description)}</div></div>`).join('')}`:''}
  ${s.education?.length?`<div style="font-weight:700;font-size:10px;color:${acc};text-transform:uppercase;letter-spacing:0.08em;margin:16px 0 8px;">Education</div>${s.education.map(e=>`<div style="margin-bottom:8px;"><b>${esc(e.degree)}</b> · ${esc(e.institution)} <span style="color:#888;font-size:10px;">${esc(e.year)}</span></div>`).join('')}`:''}
  </div>`;
}

function atsProfTemplate(s) {
  const acc = s.accent_color || '#16a34a';
  return `<div style="font-family:Arial,sans-serif;font-size:11px;color:#111;line-height:1.5;background:white;padding:24px 28px;">
  <div style="text-align:center;border-bottom:2px solid ${acc};padding-bottom:12px;margin-bottom:14px;">
    <div style="font-size:22px;font-weight:700;color:${acc};">${esc(s.name||'Your Name')}</div>
    ${s.title?`<div style="font-size:12px;color:#555;">${esc(s.title)}</div>`:''}
    <div style="font-size:10px;color:#777;margin-top:4px;">${[s.email,s.phone,s.location,s.linkedin,s.github].filter(Boolean).map(esc).join(' | ')}</div>
  </div>
  ${s.summary?`<div style="font-weight:700;font-size:11px;color:${acc};text-transform:uppercase;border-bottom:1px solid #ccc;margin-bottom:6px;padding-bottom:3px;">Professional Summary</div><p style="margin:0 0 12px;">${esc(s.summary)}</p>`:''}
  ${s.skills?.length?`<div style="font-weight:700;font-size:11px;color:${acc};text-transform:uppercase;border-bottom:1px solid #ccc;margin-bottom:6px;padding-bottom:3px;">Core Skills</div><p style="margin:0 0 12px;">${s.skills.map(esc).join(' • ')}</p>`:''}
  ${s.experience?.length?`<div style="font-weight:700;font-size:11px;color:${acc};text-transform:uppercase;border-bottom:1px solid #ccc;margin-bottom:8px;padding-bottom:3px;">Work Experience</div>${s.experience.map(e=>`<div style="margin-bottom:10px;"><div style="font-weight:700;">${esc(e.title)} | ${esc(e.company)}</div><div style="color:#777;font-size:10px;">${esc(e.start_date)} – ${esc(e.end_date||'Present')}</div><div>${esc(e.description)}</div></div>`).join('')}`:''}
  ${s.education?.length?`<div style="font-weight:700;font-size:11px;color:${acc};text-transform:uppercase;border-bottom:1px solid #ccc;margin:14px 0 8px;padding-bottom:3px;">Education</div>${s.education.map(e=>`<div><b>${esc(e.degree)}</b> — ${esc(e.institution)} (${esc(e.year)})</div>`).join('')}`:''}
  </div>`;
}

function twoColTemplate(s) {
  const acc = s.accent_color || '#0ea5e9';
  return `<div style="font-family:Arial,sans-serif;font-size:11px;color:#111;line-height:1.5;background:white;display:flex;min-height:400px;">
  <div style="width:35%;background:${acc};color:white;padding:24px 16px;">
    <div style="font-size:18px;font-weight:700;margin-bottom:4px;">${esc(s.name||'Your Name')}</div>
    ${s.title?`<div style="font-size:10px;opacity:0.85;margin-bottom:16px;">${esc(s.title)}</div>`:''}
    <div style="font-size:9px;opacity:0.7;margin-bottom:16px;">${[s.email,s.phone,s.location].filter(Boolean).map(esc).join('\n')}</div>
    ${s.skills?.length?`<div style="font-weight:700;font-size:10px;text-transform:uppercase;border-bottom:1px solid rgba(255,255,255,0.3);padding-bottom:4px;margin-bottom:8px;">Skills</div>${s.skills.map(sk=>`<div style="margin-bottom:3px;">• ${esc(sk)}</div>`).join('')}`:''}
    ${s.languages?.length?`<div style="font-weight:700;font-size:10px;text-transform:uppercase;border-bottom:1px solid rgba(255,255,255,0.3);padding-bottom:4px;margin:12px 0 8px;">Languages</div>${s.languages.map(l=>`<div>• ${esc(l)}</div>`).join('')}`:''}
  </div>
  <div style="flex:1;padding:24px 20px;">
    ${s.summary?`<div style="font-weight:700;font-size:11px;color:${acc};text-transform:uppercase;border-bottom:2px solid ${acc};margin-bottom:6px;padding-bottom:3px;">Summary</div><p style="margin:0 0 14px;">${esc(s.summary)}</p>`:''}
    ${s.experience?.length?`<div style="font-weight:700;font-size:11px;color:${acc};text-transform:uppercase;border-bottom:2px solid ${acc};margin-bottom:8px;padding-bottom:3px;">Experience</div>${s.experience.map(e=>`<div style="margin-bottom:10px;"><div style="font-weight:700;">${esc(e.title)}</div><div style="color:#666;font-size:10px;">${esc(e.company)} · ${esc(e.start_date)} – ${esc(e.end_date||'Present')}</div><div>${esc(e.description)}</div></div>`).join('')}`:''}
    ${s.education?.length?`<div style="font-weight:700;font-size:11px;color:${acc};text-transform:uppercase;border-bottom:2px solid ${acc};margin:14px 0 8px;padding-bottom:3px;">Education</div>${s.education.map(e=>`<div><b>${esc(e.degree)}</b> · ${esc(e.institution)} (${esc(e.year)})</div>`).join('')}`:''}
    ${s.projects?.length?`<div style="font-weight:700;font-size:11px;color:${acc};text-transform:uppercase;border-bottom:2px solid ${acc};margin:14px 0 8px;padding-bottom:3px;">Projects</div>${s.projects.map(p=>`<div style="margin-bottom:6px;"><b>${esc(p.name)}</b>: ${esc(p.description)}</div>`).join('')}`:''}
  </div></div>`;
}
