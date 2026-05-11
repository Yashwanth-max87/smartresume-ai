from rest_framework import serializers
from .models import RoadmapHistory


class RoadmapHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = RoadmapHistory
        fields = '__all__'
        read_only_fields = ['id', 'created_at']


class RoadmapHistoryListSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoadmapHistory
        fields = ['id', 'role_name', 'missing_skills', 'created_at']
        read_only_fields = ['id', 'created_at']
