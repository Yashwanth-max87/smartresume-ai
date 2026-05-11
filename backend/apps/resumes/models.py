import uuid
from django.db import models


class Resume(models.Model):
    """Stores all resume data as JSON fields for flexibility."""

    TEMPLATE_CHOICES = [
        ('modern', 'Modern'),
        ('minimal', 'Minimal'),
        ('ats_professional', 'ATS Professional'),
        ('two_column', 'Two Column Technical'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Personal Info
    name = models.CharField(max_length=200)
    title = models.CharField(max_length=200, blank=True)
    email = models.EmailField()
    phone = models.CharField(max_length=50, blank=True)
    location = models.CharField(max_length=200, blank=True)
    summary = models.TextField(blank=True)
    portfolio = models.CharField(max_length=500, blank=True)
    github = models.CharField(max_length=500, blank=True)
    linkedin = models.CharField(max_length=500, blank=True)

    # Sections stored as JSON arrays
    skills = models.JSONField(default=list, blank=True)
    experience = models.JSONField(default=list, blank=True)
    education = models.JSONField(default=list, blank=True)
    projects = models.JSONField(default=list, blank=True)
    certifications = models.JSONField(default=list, blank=True)
    languages = models.JSONField(default=list, blank=True)
    achievements = models.JSONField(default=list, blank=True)

    # Design
    template_name = models.CharField(max_length=100, choices=TEMPLATE_CHOICES, default='modern')
    accent_color = models.CharField(max_length=7, default='#6366f1')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} — {self.title}"
