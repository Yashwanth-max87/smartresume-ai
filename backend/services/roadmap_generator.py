"""
roadmap_generator.py
====================
Generates structured learning roadmaps using Gemini AI.
Falls back to a curated rule-based roadmap when AI is unavailable.
"""
import os
import json
import re
from urllib.parse import quote_plus


# ---------------------------------------------------------------------------
# YouTube link generation (no API key needed — search links only)
# ---------------------------------------------------------------------------

def generate_youtube_links(skills: list) -> list:
    """
    For each skill, generate multiple YouTube search links covering
    beginner → advanced progression.
    """
    results = []
    for skill in skills:
        q = quote_plus(skill)
        results.append({
            "skill": skill,
            "links": [
                {
                    "title": f"{skill} Full Course for Beginners",
                    "url": f"https://www.youtube.com/results?search_query={q}+full+course+beginners",
                    "level": "Beginner",
                },
                {
                    "title": f"{skill} Tutorial — Hands-On Project",
                    "url": f"https://www.youtube.com/results?search_query={q}+tutorial+project",
                    "level": "Intermediate",
                },
                {
                    "title": f"{skill} Advanced Concepts",
                    "url": f"https://www.youtube.com/results?search_query={q}+advanced+concepts+2024",
                    "level": "Advanced",
                },
            ],
        })
    return results


# ---------------------------------------------------------------------------
# Rule-based fallback roadmaps (curated per role)
# ---------------------------------------------------------------------------

ROLE_SKILLS = {
    "full stack developer": [
        "HTML", "CSS", "JavaScript", "React", "Node.js", "Express",
        "PostgreSQL", "MongoDB", "REST API", "Git", "Docker", "AWS",
        "CI/CD", "JWT", "TypeScript",
    ],
    "data scientist": [
        "Python", "Pandas", "NumPy", "Scikit-Learn", "TensorFlow",
        "PyTorch", "SQL", "Data Visualization", "Statistics",
        "Machine Learning", "Deep Learning", "NLP", "MLOps",
    ],
    "devops engineer": [
        "Linux", "Bash", "Docker", "Kubernetes", "Jenkins", "GitLab CI",
        "Terraform", "Ansible", "AWS", "Azure", "Monitoring", "Nginx",
    ],
    "frontend developer": [
        "HTML", "CSS", "JavaScript", "TypeScript", "React", "Vue.js",
        "Tailwind CSS", "Webpack", "Vite", "Testing", "Accessibility",
    ],
    "backend developer": [
        "Python", "Django", "FastAPI", "Node.js", "REST API",
        "PostgreSQL", "Redis", "Docker", "JWT", "Unit Testing",
    ],
    "machine learning engineer": [
        "Python", "TensorFlow", "PyTorch", "Scikit-Learn", "MLOps",
        "Docker", "Kubernetes", "SQL", "Feature Engineering",
        "Model Deployment", "AWS SageMaker",
    ],
}


def _rule_based_roadmap(role_name: str, current_skills: list) -> dict:
    """Generate a structured roadmap without AI."""
    role_lower = role_name.lower()
    required = []
    for key, skills in ROLE_SKILLS.items():
        if any(word in role_lower for word in key.split()):
            required = skills
            break
    if not required:
        required = ["Python", "JavaScript", "SQL", "Git", "Docker", "REST API",
                    "Testing", "CI/CD", "Cloud Computing", "System Design"]

    current_lower = {s.lower() for s in current_skills}
    missing = [s for s in required if s.lower() not in current_lower]

    # Divide into phases
    third = max(1, len(missing) // 3)
    beginner = missing[:third]
    intermediate = missing[third:third*2]
    advanced = missing[third*2:]

    return {
        "role": role_name,
        "total_weeks": len(missing) * 2,
        "missing_skills": missing,
        "phases": {
            "beginner": {
                "title": "Foundation",
                "duration_weeks": max(2, len(beginner) * 2),
                "skills": beginner,
                "description": "Build the core foundations needed for the role.",
            },
            "intermediate": {
                "title": "Building Skills",
                "duration_weeks": max(2, len(intermediate) * 2),
                "skills": intermediate,
                "description": "Deepen your knowledge with practical projects.",
            },
            "advanced": {
                "title": "Expert Level",
                "duration_weeks": max(2, len(advanced) * 2),
                "skills": advanced,
                "description": "Master advanced concepts and production patterns.",
            },
        },
        "weekly_plan": [
            {"week": i + 1, "focus": missing[i] if i < len(missing) else "Practice & Review"}
            for i in range(min(len(missing), 12))
        ],
        "resources": generate_youtube_links(missing[:8]),
    }


# ---------------------------------------------------------------------------
# AI-based roadmap generation
# ---------------------------------------------------------------------------

def _extract_json(text: str) -> dict:
    text = re.sub(r'```(?:json)?', '', text).strip()
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        return json.loads(match.group())
    raise ValueError("No JSON in AI response.")


def generate_roadmap_with_ai(role_name: str, current_skills: list) -> dict:
    """
    Generate a structured roadmap using Gemini. Falls back to rule-based.
    """
    api_key = os.environ.get('GEMINI_API_KEY', '')
    if not api_key:
        return _rule_based_roadmap(role_name, current_skills)

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')

        skills_str = ', '.join(current_skills) if current_skills else 'none specified'

        prompt = f"""You are an expert career coach and curriculum designer.

Create a detailed structured learning roadmap for someone who wants to become a "{role_name}".

Their current skills: {skills_str}

Return ONLY valid JSON (no markdown) with this exact structure:
{{
  "role": "{role_name}",
  "total_weeks": <integer>,
  "missing_skills": ["skill1", "skill2", ...],
  "phases": {{
    "beginner": {{
      "title": "Foundation",
      "duration_weeks": <integer>,
      "skills": ["skill1", ...],
      "description": "..."
    }},
    "intermediate": {{
      "title": "Building Skills",
      "duration_weeks": <integer>,
      "skills": ["skill1", ...],
      "description": "..."
    }},
    "advanced": {{
      "title": "Expert Level",
      "duration_weeks": <integer>,
      "skills": ["skill1", ...],
      "description": "..."
    }}
  }},
  "weekly_plan": [
    {{"week": 1, "focus": "Topic name"}},
    ...
  ]
}}

Include at least 8-15 missing skills spread across all phases. Weekly plan should cover 12 weeks."""

        response = model.generate_content(prompt)
        roadmap = _extract_json(response.text)

        # Always add YouTube links for missing skills
        missing = roadmap.get('missing_skills', [])
        roadmap['resources'] = generate_youtube_links(missing[:10])
        return roadmap

    except Exception as e:
        print(f"[Roadmap] Gemini failed ({e}), using rule-based fallback.")
        return _rule_based_roadmap(role_name, current_skills)
