from rest_framework import serializers
from .models import Resume


class ResumeListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing resumes (dashboard)."""
    class Meta:
        model = Resume
        fields = ['id', 'name', 'title', 'email', 'template_name',
                  'accent_color', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ResumeSerializer(serializers.ModelSerializer):
    """Full serializer for create/retrieve/update operations."""
    class Meta:
        model = Resume
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_skills(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Skills must be a list.")
        return value

    def validate_experience(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Experience must be a list.")
        return value
