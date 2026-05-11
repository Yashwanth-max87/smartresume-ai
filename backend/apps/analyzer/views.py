from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import AnalysisReport
from .serializers import AnalysisReportSerializer, AnalysisReportListSerializer
from services.resume_parser import extract_text_from_file
from services.ai_analyzer import analyze_resume_with_ai


class AnalyzeResumeView(APIView):
    """
    POST /api/analyzer/analyze/
    Accepts multipart: resume_file (PDF/DOCX) + role_name + job_description
    Returns full ATS analysis JSON.
    """
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        role_name = request.data.get('role_name', '').strip()
        job_description = request.data.get('job_description', '').strip()
        resume_file = request.FILES.get('resume_file')

        if not role_name:
            return Response({'error': 'role_name is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not job_description:
            return Response({'error': 'job_description is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not resume_file:
            return Response({'error': 'resume_file is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate file type
        allowed_types = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        if resume_file.content_type not in allowed_types and not resume_file.name.endswith(('.pdf', '.docx')):
            return Response({'error': 'Only PDF and DOCX files are accepted.'}, status=status.HTTP_400_BAD_REQUEST)

        # Extract text from uploaded file
        try:
            resume_text = extract_text_from_file(resume_file)
        except Exception as e:
            return Response({'error': f'Could not parse file: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        if not resume_text.strip():
            return Response({'error': 'Could not extract text from the uploaded file.'}, status=status.HTTP_400_BAD_REQUEST)

        # Run AI analysis
        try:
            analysis = analyze_resume_with_ai(resume_text, job_description, role_name)
        except Exception as e:
            return Response({'error': f'AI analysis failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Save report to DB
        report = AnalysisReport.objects.create(
            role_name=role_name,
            job_description=job_description,
            resume_text=resume_text,
            ats_score=analysis.get('ats_score', 0),
            skills_match_score=analysis.get('skills_match_percentage', 0),
            keyword_score=analysis.get('keyword_optimization', 0),
            experience_score=analysis.get('experience_relevance', 0),
            readability_score=analysis.get('resume_readability', 0),
            missing_skills=analysis.get('missing_skills', []),
            suggested_keywords=analysis.get('suggested_keywords', []),
            strengths=analysis.get('strengths', []),
            weaknesses=analysis.get('weaknesses', []),
            improvement_tips=analysis.get('improvement_tips', []),
        )

        return Response(AnalysisReportSerializer(report).data, status=status.HTTP_201_CREATED)


class AnalysisReportListView(generics.ListAPIView):
    """GET /api/analyzer/reports/ — list all analysis reports"""
    queryset = AnalysisReport.objects.all()
    serializer_class = AnalysisReportListSerializer


class AnalysisReportDetailView(generics.RetrieveAPIView):
    """GET /api/analyzer/reports/<id>/ — retrieve single report"""
    queryset = AnalysisReport.objects.all()
    serializer_class = AnalysisReportSerializer
    lookup_field = 'pk'
