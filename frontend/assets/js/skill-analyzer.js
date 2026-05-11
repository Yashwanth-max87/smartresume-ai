// skill-analyzer.js
// Rule-based skill gap engine — no API key required

// ── Role → Required Skills Map ──────────────────────────────────────────────
const ROLE_SKILLS = {
  'Frontend Developer': [
    'HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Vue.js',
    'Tailwind CSS', 'Webpack', 'Vite', 'Git', 'Next.js', 'Redux',
    'Testing', 'Accessibility', 'Figma',
  ],
  'Backend Developer': [
    'Python', 'Django', 'FastAPI', 'Node.js', 'Express', 'REST API',
    'PostgreSQL', 'Redis', 'Docker', 'JWT', 'Unit Testing', 'Git', 'AWS',
  ],
  'Full Stack Developer': [
    'HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Express',
    'PostgreSQL', 'MongoDB', 'REST API', 'Git', 'Docker', 'AWS',
    'CI/CD', 'JWT', 'Redis',
  ],
  'Java Developer': [
    'Java', 'Spring Boot', 'Maven', 'Hibernate', 'JPA', 'REST API',
    'PostgreSQL', 'Docker', 'Git', 'Microservices', 'JUnit', 'AWS', 'CI/CD',
  ],
  'Data Analyst': [
    'Python', 'Pandas', 'NumPy', 'SQL', 'Excel', 'Power BI',
    'Tableau', 'Statistics', 'Data Visualization', 'Machine Learning', 'Scikit-Learn', 'R',
  ],
  'Data Scientist': [
    'Python', 'Pandas', 'NumPy', 'Scikit-Learn', 'TensorFlow', 'PyTorch',
    'SQL', 'Statistics', 'Machine Learning', 'Deep Learning', 'NLP', 'MLOps',
  ],
  'DevOps Engineer': [
    'Linux', 'Bash', 'Docker', 'Kubernetes', 'Jenkins', 'GitLab CI',
    'Terraform', 'Ansible', 'AWS', 'Azure', 'Monitoring', 'Nginx',
  ],
  'Machine Learning Engineer': [
    'Python', 'TensorFlow', 'PyTorch', 'Scikit-Learn', 'MLOps', 'Docker',
    'Kubernetes', 'SQL', 'Feature Engineering', 'Model Deployment', 'AWS',
  ],
};

// ── State ────────────────────────────────────────────────────────────────────
let userSkills = [];
let selectedRole = null;

// ── Skill input ──────────────────────────────────────────────────────────────
const skillInput = document.getElementById('skill-input');
skillInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    const val = skillInput.value.replace(',', '').trim();
    if (val && !userSkills.some(s => s.toLowerCase() === val.toLowerCase())) {
      userSkills.push(val);
      skillInput.value = '';
      renderChips();
    }
  }
});

function renderChips() {
  document.getElementById('skill-chips').innerHTML = userSkills.map((s, i) => `
    <span class="chip chip-blue" style="cursor:pointer;" onclick="removeSkill(${i})">
      ${esc(s)} <span style="margin-left:4px;opacity:0.7;">×</span>
    </span>`).join('');
}

function removeSkill(idx) {
  userSkills.splice(idx, 1);
  renderChips();
}

// ── Role buttons ─────────────────────────────────────────────────────────────
document.querySelectorAll('.role-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedRole = btn.dataset.role;
  });
});

// ── Analyze ──────────────────────────────────────────────────────────────────
document.getElementById('analyze-btn').addEventListener('click', analyze);

function analyze() {
  if (!userSkills.length) {
    showToast('Please enter at least one skill.', 'error'); return;
  }
  if (!selectedRole) {
    showToast('Please select a target role.', 'error'); return;
  }

  const required = ROLE_SKILLS[selectedRole] || [];
  const userLower = userSkills.map(s => s.toLowerCase());
  const reqLower  = required.map(s => s.toLowerCase());

  // Case-insensitive matching
  const matching = required.filter(r => userLower.includes(r.toLowerCase()));
  const missing  = required.filter(r => !userLower.includes(r.toLowerCase()));

  const matchPct  = Math.round((matching.length / required.length) * 100);
  const coverage  = Math.min(100, Math.round((userSkills.length / required.length) * 100));

  renderResults({ matchPct, coverage, matching, missing, required });
}

function renderResults({ matchPct, coverage, matching, missing, required }) {
  document.getElementById('results-placeholder').classList.add('hidden');

  // Score ring
  const scoreCard = document.getElementById('score-card');
  scoreCard.classList.remove('hidden');

  const color = matchPct >= 70 ? '#4ade80' : matchPct >= 40 ? '#fbbf24' : '#f87171';
  const circumference = 2 * Math.PI * 15.9;
  document.getElementById('score-pct').textContent = `${matchPct}%`;
  document.getElementById('score-circle').style.stroke = color;
  setTimeout(() => {
    document.getElementById('score-circle').style.strokeDasharray =
      `${(matchPct / 100) * circumference} ${circumference}`;
  }, 80);

  const verdict = matchPct >= 70 ? '🟢 Strong match for this role!'
                : matchPct >= 40 ? '🟡 Moderate match — keep learning'
                : '🔴 Significant skill gaps found';
  document.getElementById('score-verdict').textContent = verdict;

  document.getElementById('bar-match').style.width = `${matchPct}%`;
  document.getElementById('lbl-match').textContent = `${matchPct}%`;
  document.getElementById('bar-cov').style.width = `${coverage}%`;
  document.getElementById('lbl-cov').textContent = `${coverage}%`;

  // Matching skills
  const matchingCard = document.getElementById('matching-card');
  if (matching.length) {
    matchingCard.classList.remove('hidden');
    document.getElementById('matching-list').innerHTML =
      matching.map(s => `<span class="chip chip-green">${esc(s)}</span>`).join('');
  } else {
    matchingCard.classList.add('hidden');
  }

  // Missing skills
  const missingCard = document.getElementById('missing-card');
  if (missing.length) {
    missingCard.classList.remove('hidden');
    document.getElementById('missing-count').textContent = `${missing.length} missing`;
    document.getElementById('missing-list').innerHTML =
      missing.map(s => `<span class="chip chip-red">${esc(s)}</span>`).join('');

    // Wire up the roadmap button
    document.getElementById('goto-roadmap-btn').onclick = () => {
      const params = new URLSearchParams({
        role: selectedRole,
        skills: userSkills.join(','),
        missing: missing.join(','),
      });
      window.location.href = `roadmap.html?${params.toString()}`;
    };
  } else {
    missingCard.classList.add('hidden');
    showToast('🎉 You already have all required skills for this role!', 'success', 5000);
  }
}

function esc(s) {
  return String(s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
