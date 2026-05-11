import uuid
from django.db import models
from apps.resumes.models import Resume


class AnalysisReport(models.Model):
    """Stores AI-generated ATS analysis results."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    resume = models.ForeignKey(
        Resume, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='analysis_reports'
    )
    role_name = models.CharField(max_length=200)
    job_description = models.TextField(blank=True)
    resume_text = models.TextField(blank=True)

    # AI-generated analysis results
    ats_score = models.IntegerField(default=0)
    skills_match_score = models.IntegerField(default=0)
    keyword_score = models.IntegerField(default=0)
    experience_score = models.IntegerField(default=0)
    readability_score = models.IntegerField(default=0)

    missing_skills = models.JSONField(default=list)
    suggested_keywords = models.JSONField(default=list)
    strengths = models.JSONField(default=list)
    weaknesses = models.JSONField(default=list)
    improvement_tips = models.JSONField(default=list)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.role_name} — ATS {self.ats_score}"
