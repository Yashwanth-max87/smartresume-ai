from django.urls import path
from . import views

urlpatterns = [
    path('', views.ResumeListCreateView.as_view(), name='resume-list-create'),
    path('stats/', views.ResumeStatsView.as_view(), name='resume-stats'),
    path('<uuid:pk>/', views.ResumeDetailView.as_view(), name='resume-detail'),
    path('<uuid:pk>/pdf/', views.ResumePDFView.as_view(), name='resume-pdf'),
]
