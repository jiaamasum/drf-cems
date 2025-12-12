from rest_framework import status, serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import OpenApiResponse, extend_schema

from academics.models import Assignment
from academics.services import get_current_academic_year
from reference.api.serializers import AcademicYearSerializer, AssignmentSerializer


class CurrentAcademicYearView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses=AcademicYearSerializer)
    def get(self, request):
        current_year = get_current_academic_year()
        if not current_year:
            return Response({"error": "No current academic year configured"}, status=status.HTTP_404_NOT_FOUND)
        serializer = AcademicYearSerializer(
            {
                "id": current_year.id,
                "year": current_year.year,
                "start_date": current_year.start_date,
                "end_date": current_year.end_date,
            }
        )
        data = serializer.data
        data["message"] = "Current academic year retrieved"
        return Response(data, status=status.HTTP_200_OK)


class CurrentAssignmentsView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses=AssignmentSerializer(many=True))
    def get(self, request):
        current_year = get_current_academic_year()
        if not current_year:
            return Response({"error": "No current academic year configured"}, status=status.HTTP_404_NOT_FOUND)

        assignments = (
            Assignment.objects.filter(academic_year=current_year)
            .select_related("class_offering", "subject", "academic_year")
            .order_by("class_offering__name")
        )
        payload = [
            {
                "id": assignment.id,
                "academic_year": assignment.academic_year.year,
                "class_offering": {
                    "id": assignment.class_offering.id,
                    "name": assignment.class_offering.name,
                    "level": assignment.class_offering.level,
                },
                "subject": {
                    "id": assignment.subject.id,
                    "name": assignment.subject.name,
                    "code": assignment.subject.code,
                },
            }
            for assignment in assignments
        ]
        serializer = AssignmentSerializer(payload, many=True)
        return Response({"results": serializer.data, "message": "Current assignments retrieved"}, status=status.HTTP_200_OK)
