// roadmap.js — Skill Roadmap page logic

let currentSkills = [];

// ── Read URL params (from Skill Analyzer page) ────────────────────────────
function getUrlParams() {
  const p = new URLSearchParams(window.location.search);
  return {
    role:    p.get('role')    || '',
    skills:  p.get('skills')  ? p.get('skills').split(',').filter(Boolean)  : [],
    missing: p.get('missing') ? p.get('missing').split(',').filter(Boolean) : [],
  };
}

// Auto-populate and trigger generation when URL params are present
window.addEventListener('DOMContentLoaded', () => {
  const { role, skills, missing } = getUrlParams();
  if (role) {
    // Pre-fill the role input
    document.getElementById('rd-role').value = role;

    // Pre-fill skills
    currentSkills = skills;
    renderSkillChips();

    // Show "back" banner
    if (missing.length > 0) {
      const banner = document.createElement('div');
      banner.style.cssText = 'background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.25);border-radius:12px;padding:12px 16px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;';
      banner.innerHTML = `
        <div>
          <span style="color:#818cf8;font-weight:600;font-size:13px;">📊 From Skill Analyzer</span>
          <span style="color:#94a3b8;font-size:12px;margin-left:10px;">${missing.length} missing skills detected for <strong style="color:#e2e8f0;">${role}</strong></span>
        </div>
        <a href="skill-analyzer.html" style="color:#6366f1;font-size:12px;font-weight:600;text-decoration:none;">← Back to Analyzer</a>`;
      const mainEl = document.querySelector('main');
      const firstChild = mainEl.firstElementChild;
      mainEl.insertBefore(banner, firstChild.nextSibling);
    }

    // Auto-trigger generation
    setTimeout(() => triggerGenerate(role, skills), 200);
  }

  loadHistory();
});

// ── Skill chip input ──────────────────────────────────────────────────────
const skillInput = document.getElementById('rd-skill-input');
skillInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    const val = skillInput.value.replace(',','').trim();
    if (val && !currentSkills.includes(val)) {
      currentSkills.push(val);
      skillInput.value = '';
      renderSkillChips();
    }
  }
});

function renderSkillChips() {
  document.getElementById('rd-skill-chips').innerHTML =
    currentSkills.map((s,i) => `
      <span class="chip chip-blue">
        ${escR(s)}
        <button onclick="removeSkillR(${i})" style="background:none;border:none;color:#818cf8;cursor:pointer;padding:0 0 0 4px;">&#10005;</button>
      </span>`).join('');
}

function removeSkillR(idx) {
  currentSkills.splice(idx, 1);
  renderSkillChips();
}

function escR(s) { return String(s||'').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ── Generate roadmap (shared — called by button AND URL params) ──────────
async function triggerGenerate(role, skills) {
  if (!role) { showToast('Please enter your target role.', 'error'); return; }

  const btn = document.getElementById('rd-generate-btn');
  setLoading(btn, true, 'Generating roadmap…');

  document.getElementById('roadmap-placeholder').classList.remove('hidden');
  document.getElementById('roadmap-placeholder').innerHTML = `
    <div class="spinner mx-auto mb-3"></div>
    <p class="text-white font-semibold">Building your roadmap…</p>
    <p class="text-sm mt-1" style="color:#94a3b8;">Analysing skill gaps and structuring your learning path</p>`;

  ['roadmap-summary','phase-beginner','phase-intermediate','phase-advanced','weekly-plan-card','youtube-card']
    .forEach(id => document.getElementById(id).classList.add('hidden'));

  try {
    const data = await RoadmapAPI.generate(role, skills);
    renderRoadmap(data.roadmap_data || data);
    loadHistory();
    showToast('Roadmap generated!', 'success');
  } catch (err) {
    document.getElementById('roadmap-placeholder').innerHTML = `
      <p class="font-semibold" style="color:#f87171;">Generation failed</p>
      <p class="text-sm mt-2" style="color:#94a3b8;">${escR(err.message)}</p>`;
    showToast('Failed: ' + err.message, 'error');
  } finally {
    setLoading(btn, false);
  }
}

document.getElementById('rd-generate-btn').addEventListener('click', () => {
  const role = document.getElementById('rd-role').value.trim();
  triggerGenerate(role, currentSkills);
});

function renderRoadmap(rm) {
  document.getElementById('roadmap-placeholder').classList.add('hidden');

  // Summary
  const summary = document.getElementById('roadmap-summary');
  summary.classList.remove('hidden');
  document.getElementById('rm-role-title').textContent = rm.role || 'Your Role';
  document.getElementById('rm-duration').textContent = `Estimated: ${rm.total_weeks || '?'} weeks`;
  document.getElementById('rm-missing-count').textContent = (rm.missing_skills || []).length;

  const phases = rm.phases || {};
  const phaseDefs = [
    { key:'beginner', elId:'phase-beginner', skillsEl:'beg-skills', durEl:'beg-duration', descEl:'beg-desc' },
    { key:'intermediate', elId:'phase-intermediate', skillsEl:'int-skills', durEl:'int-duration', descEl:'int-desc' },
    { key:'advanced', elId:'phase-advanced', skillsEl:'adv-skills', durEl:'adv-duration', descEl:'adv-desc' },
  ];

  const phaseColors = { beginner:'chip-green', intermediate:'chip-amber', advanced:'chip-blue' };

  phaseDefs.forEach(({ key, elId, skillsEl, durEl, descEl }) => {
    const phase = phases[key];
    if (!phase) return;
    document.getElementById(elId).classList.remove('hidden');
    document.getElementById(durEl).textContent = `${phase.duration_weeks || '?'} weeks`;
    document.getElementById(descEl).textContent = phase.description || '';
    document.getElementById(skillsEl).innerHTML =
      (phase.skills || []).map(s => `<span class="chip ${phaseColors[key]}">${escR(s)}</span>`).join('');
  });

  // Weekly plan
  const weeklyPlan = rm.weekly_plan || [];
  if (weeklyPlan.length) {
    document.getElementById('weekly-plan-card').classList.remove('hidden');
    document.getElementById('weekly-plan').innerHTML = weeklyPlan.slice(0,12).map(w => `
      <div class="glass p-3 text-center" style="border-radius:10px;">
        <div class="text-xs font-bold mb-1" style="color:#6366f1;">Week ${escR(String(w.week))}</div>
        <div class="text-xs" style="color:#e2e8f0;">${escR(w.focus)}</div>
      </div>`).join('');
  }

  // YouTube resources
  const resources = rm.resources || [];
  if (resources.length) {
    document.getElementById('youtube-card').classList.remove('hidden');
    document.getElementById('youtube-list').innerHTML = resources.map(r => `
      <div class="glass p-4" style="border-radius:12px;">
        <div class="font-semibold text-white text-sm mb-3">${escR(r.skill)}</div>
        <div class="flex flex-wrap gap-2">
          ${(r.links || []).map(link => `
            <a href="${escR(link.url)}" target="_blank" rel="noopener"
              class="flex items-center gap-2 text-xs px-3 py-2 rounded-lg transition-all"
              style="background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.3);color:#fca5a5;text-decoration:none;"
              onmouseover="this.style.background='rgba(239,68,68,0.2)'"
              onmouseout="this.style.background='rgba(239,68,68,0.12)'">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#fca5a5"><path d="M23 7s-.3-2-1.2-2.8c-1.1-1.2-2.4-1.2-3-1.3C16.3 2.8 12 2.8 12 2.8s-4.3 0-6.8.1c-.6.1-1.9.1-3 1.3C1.3 5 1 7 1 7S.7 9.1.7 11.2v2c0 2.1.3 4.2.3 4.2s.3 2 1.2 2.8c1.1 1.2 2.6 1.1 3.3 1.2 2.4.2 10.1.3 10.1.3s4.3 0 6.8-.2c.6-.1 1.9-.1 3-1.3.9-.8 1.2-2.8 1.2-2.8s.3-2.1.3-4.2v-2C23.3 9.1 23 7 23 7zm-13.5 8.5V8.2l8.1 3.7-8.1 3.6z"/></svg>
              ${escR(link.level)} — ${escR(link.title)}
            </a>`).join('')}
        </div>
      </div>`).join('');
  }
}

// ── History ───────────────────────────────────────────────────────────────
async function loadHistory() {
  try {
    const data = await RoadmapAPI.history();
    const items = data.results || data;
    const container = document.getElementById('roadmap-history');
    if (!items.length) { container.innerHTML = '<div class="text-xs" style="color:#555;">No history yet</div>'; return; }
    container.innerHTML = items.slice(0,5).map(h => `
      <div class="p-3 rounded-xl cursor-pointer transition-all hover:opacity-80"
        style="background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.15);"
        onclick="loadHistoryItem('${escR(h.id)}')">
        <div class="text-xs font-semibold text-white">${escR(h.role_name)}</div>
        <div class="text-xs mt-0.5" style="color:#94a3b8;">${(h.missing_skills||[]).length} skills to learn</div>
      </div>`).join('');
  } catch {}
}

async function loadHistoryItem(id) {
  try {
    const data = await RoadmapAPI.history();
    const items = data.results || data;
    const item = items.find(h => h.id === id);
    if (item) renderRoadmap(item.roadmap_data || {});
  } catch {}
}

loadHistory();
