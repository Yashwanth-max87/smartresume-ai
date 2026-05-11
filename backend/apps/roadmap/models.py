import uuid
from django.db import models


class RoadmapHistory(models.Model):
    """Stores generated learning roadmaps for roles."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role_name = models.CharField(max_length=200)
    current_skills = models.JSONField(default=list)
    missing_skills = models.JSONField(default=list)

    # Full structured roadmap from AI
    roadmap_data = models.JSONField(default=dict)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Roadmap Histories'

    def __str__(self):
        return f"Roadmap: {self.role_name} ({self.created_at.date()})"
