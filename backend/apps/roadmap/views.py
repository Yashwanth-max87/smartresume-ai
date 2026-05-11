from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import RoadmapHistory
from .serializers import RoadmapHistorySerializer, RoadmapHistoryListSerializer
from services.roadmap_generator import generate_roadmap_with_ai, generate_youtube_links


class GenerateRoadmapView(APIView):
    """
    POST /api/roadmap/generate/
    Body: { "role_name": str, "current_skills": [str] }
    Returns structured learning roadmap.
    """

    def post(self, request):
        role_name = request.data.get('role_name', '').strip()
        current_skills = request.data.get('current_skills', [])

        if not role_name:
            return Response({'error': 'role_name is required.'}, status=status.HTTP_400_BAD_REQUEST)

        if isinstance(current_skills, str):
            current_skills = [s.strip() for s in current_skills.split(',') if s.strip()]

        try:
            roadmap_data = generate_roadmap_with_ai(role_name, current_skills)
        except Exception as e:
            return Response({'error': f'Roadmap generation failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        missing_skills = roadmap_data.get('missing_skills', [])

        record = RoadmapHistory.objects.create(
            role_name=role_name,
            current_skills=current_skills,
            missing_skills=missing_skills,
            roadmap_data=roadmap_data,
        )

        return Response(RoadmapHistorySerializer(record).data, status=status.HTTP_201_CREATED)


class YouTubeSuggestionsView(APIView):
    """
    POST /api/roadmap/youtube/
    Body: { "skills": [str] }
    Returns YouTube search links for each skill.
    """

    def post(self, request):
        skills = request.data.get('skills', [])
        if not skills:
            return Response({'error': 'skills list is required.'}, status=status.HTTP_400_BAD_REQUEST)

        suggestions = generate_youtube_links(skills)
        return Response({'suggestions': suggestions})


class RoadmapHistoryListView(generics.ListAPIView):
    """GET /api/roadmap/history/ — list roadmap history"""
    queryset = RoadmapHistory.objects.all()
    serializer_class = RoadmapHistoryListSerializer


class RoadmapHistoryDetailView(generics.RetrieveAPIView):
    """GET /api/roadmap/history/<id>/"""
    queryset = RoadmapHistory.objects.all()
    serializer_class = RoadmapHistorySerializer
    lookup_field = 'pk'
