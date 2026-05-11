import io
from django.http import FileResponse
from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Resume
from .serializers import ResumeSerializer, ResumeListSerializer
from services.pdf_generator import generate_pdf


class ResumeListCreateView(generics.ListCreateAPIView):
    """GET /api/resumes/ — list | POST /api/resumes/ — create"""
    queryset = Resume.objects.all()

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return ResumeListSerializer
        return ResumeSerializer


class ResumeDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PUT/PATCH/DELETE /api/resumes/<id>/"""
    queryset = Resume.objects.all()
    serializer_class = ResumeSerializer
    lookup_field = 'pk'


class ResumePDFView(APIView):
    """GET /api/resumes/<id>/pdf/ — download PDF"""

    def get(self, request, pk):
        try:
            resume = Resume.objects.get(pk=pk)
        except Resume.DoesNotExist:
            return Response({'error': 'Resume not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Serialize full data dict
        data = ResumeSerializer(resume).data
        pdf_buffer = generate_pdf(data)

        filename = f"{resume.name.replace(' ', '_')}_resume.pdf"
        response = FileResponse(
            io.BytesIO(pdf_buffer),
            content_type='application/pdf',
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        response['Access-Control-Expose-Headers'] = 'Content-Disposition'
        return response


class ResumeStatsView(APIView):
    """GET /api/resumes/stats/ — dashboard statistics"""

    def get(self, request):
        from apps.analyzer.models import AnalysisReport
        total = Resume.objects.count()
        reports = AnalysisReport.objects.all()
        avg_score = 0
        if reports.exists():
            avg_score = round(sum(r.ats_score for r in reports) / reports.count())
        recent = Resume.objects.order_by('-created_at')[:5]
        return Response({
            'total_resumes': total,
            'total_analyses': reports.count(),
            'average_ats_score': avg_score,
            'recent_resumes': ResumeListSerializer(recent, many=True).data,
        })
