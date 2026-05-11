from django.urls import path
from . import views

urlpatterns = [
    path('analyze/', views.AnalyzeResumeView.as_view(), name='analyze-resume'),
    path('reports/', views.AnalysisReportListView.as_view(), name='report-list'),
    path('reports/<uuid:pk>/', views.AnalysisReportDetailView.as_view(), name='report-detail'),
]
