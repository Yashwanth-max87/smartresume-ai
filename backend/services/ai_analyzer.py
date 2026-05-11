"""
ai_analyzer.py
==============
Calls the Google Gemini API to perform ATS resume analysis.
Falls back to a rule-based scorer if the API key is missing or the call fails.
"""
import os
import json
import re


def _extract_json(text: str) -> dict:
    """Extract the first JSON object found in a string."""
    # Strip markdown code fences if present
    text = re.sub(r'```(?:json)?', '', text).strip()
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        return json.loads(match.group())
    raise ValueError("No JSON found in AI response.")


def _rule_based_analysis(resume_text: str, job_description: str, role_name: str) -> dict:
    """
    Fallback rule-based ATS analysis when AI is unavailable.
    Tokenises both texts and computes simple keyword overlap scores.
    """
    import re as _re

    def tokenize(text):
        return set(_re.findall(r'\b[a-zA-Z][a-zA-Z0-9#+.]{1,}\b', text.lower()))

    resume_tokens = tokenize(resume_text)
    jd_tokens = tokenize(job_description)

    # Common tech stop-words to ignore
    stopwords = {'and', 'the', 'for', 'with', 'you', 'are', 'will', 'have',
                 'our', 'team', 'role', 'work', 'strong', 'experience', 'good'}
    jd_keywords = jd_tokens - stopwords
    resume_keywords = resume_tokens - stopwords

    matched = jd_keywords & resume_keywords
    missing = jd_keywords - resume_keywords

    match_pct = round((len(matched) / len(jd_keywords) * 100) if jd_keywords else 0)
    ats_score = min(100, match_pct + 10)  # small bonus for any match

    # Identify likely skill keywords (short, technical-looking tokens)
    tech_pattern = _re.compile(r'^[a-z][a-z0-9#.+]{1,20}$')
    missing_skills = sorted([w for w in missing if tech_pattern.match(w)])[:15]
    suggested_keywords = sorted([w for w in matched])[:10]

    return {
        "ats_score": ats_score,
        "skills_match_percentage": match_pct,
        "keyword_optimization": match_pct,
        "experience_relevance": 50,
        "resume_readability": 70,
        "missing_skills": missing_skills,
        "suggested_keywords": suggested_keywords,
        "strengths": ["Resume contains relevant keywords", "Education section present"],
        "weaknesses": ["Missing some role-specific keywords"],
        "improvement_tips": [
            "Add quantifiable achievements to experience entries",
            "Include keywords from the job description naturally",
            "Ensure skills section matches role requirements",
        ],
    }


def analyze_resume_with_ai(resume_text: str, job_description: str, role_name: str) -> dict:
    """
    Main entry point for ATS analysis.
    Uses Gemini if API key present, otherwise falls back to rule-based.
    """
    api_key = os.environ.get('GEMINI_API_KEY', '')
    if not api_key:
        return _rule_based_analysis(resume_text, job_description, role_name)

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')

        prompt = f"""You are an expert ATS (Applicant Tracking System) analyzer and career coach.

Analyze the resume below against the provided job description for the role: "{role_name}".

RESUME:
{resume_text[:4000]}

JOB DESCRIPTION:
{job_description[:3000]}

Return ONLY a valid JSON object (no markdown, no extra text) with this exact structure:
{{
  "ats_score": <integer 0-100>,
  "skills_match_percentage": <integer 0-100>,
  "keyword_optimization": <integer 0-100>,
  "experience_relevance": <integer 0-100>,
  "resume_readability": <integer 0-100>,
  "missing_skills": ["skill1", "skill2", ...],
  "suggested_keywords": ["kw1", "kw2", ...],
  "strengths": ["strength1", "strength2", ...],
  "weaknesses": ["weakness1", "weakness2", ...],
  "improvement_tips": ["tip1", "tip2", ...]
}}"""

        response = model.generate_content(prompt)
        return _extract_json(response.text)

    except Exception as e:
        print(f"[AI Analyzer] Gemini call failed ({e}), using rule-based fallback.")
        return _rule_based_analysis(resume_text, job_description, role_name)
