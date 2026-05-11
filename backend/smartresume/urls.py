from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/resumes/', include('apps.resumes.urls')),
    path('api/analyzer/', include('apps.analyzer.urls')),
    path('api/roadmap/', include('apps.roadmap.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
