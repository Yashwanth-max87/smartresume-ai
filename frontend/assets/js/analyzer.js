// analyzer.js — AI Resume Analyzer page logic

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('resume-file');
let selectedFile = null;

// ── Drag-and-drop ─────────────────────────────────────────────────────────
dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file) setFile(file);
});
fileInput.addEventListener('change', e => {
  if (e.target.files[0]) setFile(e.target.files[0]);
});

function setFile(file) {
  const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|docx)$/i)) {
    showToast('Only PDF and DOCX files are accepted.', 'error'); return;
  }
  selectedFile = file;
  document.getElementById('drop-label').innerHTML = `
    <svg width="32" height="32" fill="none" stroke="#4ade80" stroke-width="2" viewBox="0 0 24 24" style="margin:0 auto 8px;"><polyline points="20 6 9 17 4 12"/></svg>
    <p class="text-white font-semibold">${escA(file.name)}</p>
    <p class="text-xs mt-1" style="color:#4ade80;">${(file.size/1024).toFixed(1)} KB · Ready to analyze</p>`;
}

function escA(s) { return String(s).replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ── Analyze ───────────────────────────────────────────────────────────────
document.getElementById('analyze-btn').addEventListener('click', async () => {
  const roleName = document.getElementById('role-name').value.trim();
  const jobDesc = document.getElementById('job-description').value.trim();

  if (!selectedFile) { showToast('Please upload a resume file.', 'error'); return; }
  if (!roleName) { showToast('Please enter the target role.', 'error'); return; }
  if (!jobDesc) { showToast('Please paste the job description.', 'error'); return; }

  const btn = document.getElementById('analyze-btn');
  setLoading(btn, true, 'Analyzing with AI…');
  document.getElementById('results-placeholder').classList.remove('hidden');
  document.getElementById('results-placeholder').innerHTML = `
    <div class="spinner mx-auto mb-3"></div>
    <p class="text-white font-semibold">AI is analyzing your resume…</p>
    <p class="text-sm mt-1" style="color:#94a3b8;">This may take a few seconds</p>`;

  // Hide previous results
  ['score-card','missing-skills-card','sw-card','tips-card','keywords-card'].forEach(id => {
    document.getElementById(id).classList.add('hidden');
  });

  try {
    const formData = new FormData();
    formData.append('resume_file', selectedFile);
    formData.append('role_name', roleName);
    formData.append('job_description', jobDesc);

    const report = await AnalyzerAPI.analyze(formData);
    showResults(report);
    showToast('Analysis complete!', 'success');
  } catch (err) {
    document.getElementById('results-placeholder').innerHTML = `
      <svg width="48" height="48" fill="none" stroke="#f87171" stroke-width="1.5" viewBox="0 0 24 24" style="margin:0 auto 12px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <p class="font-semibold" style="color:#f87171;">Analysis failed</p>
      <p class="text-sm mt-2" style="color:#94a3b8;">${escA(err.message)}</p>`;
    showToast('Analysis failed: ' + err.message, 'error');
  } finally {
    setLoading(btn, false);
  }
});

function showResults(r) {
  document.getElementById('results-placeholder').classList.add('hidden');

  // ATS Score Ring
  const scoreCard = document.getElementById('score-card');
  scoreCard.classList.remove('hidden');
  const score = r.ats_score || 0;
  document.getElementById('score-number').textContent = score;
  const circle = document.getElementById('score-circle');
  const circumference = 2 * Math.PI * 15.9;
  setTimeout(() => {
    circle.style.strokeDasharray = `${(score / 100) * circumference} ${circumference}`;
    circle.style.stroke = score >= 70 ? '#4ade80' : score >= 40 ? '#fbbf24' : '#f87171';
  }, 100);

  const label = score >= 70 ? '🟢 Strong match' : score >= 40 ? '🟡 Moderate match' : '🔴 Needs improvement';
  document.getElementById('score-label').textContent = label;

  // Sub-scores
  const subScores = document.getElementById('sub-scores');
  const categories = [
    { label: 'Skills Match', value: r.skills_match_score, color: '#6366f1' },
    { label: 'Keywords', value: r.keyword_score, color: '#a78bfa' },
    { label: 'Experience', value: r.experience_score, color: '#38bdf8' },
    { label: 'Readability', value: r.readability_score, color: '#4ade80' },
  ];
  subScores.innerHTML = categories.map(c => `
    <div style="display:flex;align-items:center;gap:8px;font-size:12px;">
      <span style="color:#94a3b8;width:80px;">${c.label}</span>
      <div class="progress-bar" style="flex:1;height:5px;">
        <div class="progress-fill" style="width:${c.value||0}%;background:${c.color};"></div>
      </div>
      <span style="color:${c.color};width:30px;text-align:right;">${c.value||0}%</span>
    </div>`).join('');

  // Missing Skills
  const missingSkills = r.missing_skills || [];
  if (missingSkills.length) {
    const msCard = document.getElementById('missing-skills-card');
    msCard.classList.remove('hidden');
    document.getElementById('missing-skills-list').innerHTML =
      missingSkills.map(s => `<span class="chip chip-red">&#8722; ${escA(s)}</span>`).join('');
  }

  // Strengths & Weaknesses
  const sw = document.getElementById('sw-card');
  const strengths = r.strengths || [];
  const weaknesses = r.weaknesses || [];
  if (strengths.length || weaknesses.length) {
    sw.classList.remove('hidden');
    document.getElementById('strengths-list').innerHTML =
      strengths.map(s => `<li style="font-size:12px;color:#e2e8f0;display:flex;gap:6px;"><span style="color:#4ade80;">&#10003;</span>${escA(s)}</li>`).join('');
    document.getElementById('weaknesses-list').innerHTML =
      weaknesses.map(w => `<li style="font-size:12px;color:#e2e8f0;display:flex;gap:6px;"><span style="color:#f87171;">&#8722;</span>${escA(w)}</li>`).join('');
  }

  // Tips
  const tips = r.improvement_tips || [];
  if (tips.length) {
    document.getElementById('tips-card').classList.remove('hidden');
    document.getElementById('tips-list').innerHTML =
      tips.map((t,i) => `<li style="font-size:12px;color:#e2e8f0;display:flex;gap:8px;align-items:flex-start;"><span style="color:#fbbf24;font-weight:700;flex-shrink:0;">${i+1}.</span>${escA(t)}</li>`).join('');
  }

  // Keywords
  const keywords = r.suggested_keywords || [];
  if (keywords.length) {
    document.getElementById('keywords-card').classList.remove('hidden');
    document.getElementById('keywords-list').innerHTML =
      keywords.map(k => `<span class="chip chip-blue">+ ${escA(k)}</span>`).join('');
  }
}
