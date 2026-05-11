from django.urls import path
from . import views

urlpatterns = [
    path('generate/', views.GenerateRoadmapView.as_view(), name='generate-roadmap'),
    path('youtube/', views.YouTubeSuggestionsView.as_view(), name='youtube-suggestions'),
    path('history/', views.RoadmapHistoryListView.as_view(), name='roadmap-history'),
    path('history/<uuid:pk>/', views.RoadmapHistoryDetailView.as_view(), name='roadmap-detail'),
]
