from rest_framework import serializers
from .models import AnalysisReport


class AnalysisReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnalysisReport
        fields = '__all__'
        read_only_fields = ['id', 'created_at']


class AnalysisReportListSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnalysisReport
        fields = ['id', 'role_name', 'ats_score', 'created_at']
        read_only_fields = ['id', 'created_at']
