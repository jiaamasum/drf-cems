import logging
from drf_spectacular.utils import OpenApiParameter, OpenApiResponse, extend_schema, inline_serializer

from django.core.exceptions import PermissionDenied
from django.db import models
from django.shortcuts import get_object_or_404
from rest_framework import status, serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination

from authentication.api.permissions import IsStudent, IsTeacherOrAdmin
from authentication.models import TeacherProfile
from academics.api.serializers import (
    ExamCreateSerializer,
    ExamDetailSerializer,
    MarksEntrySerializer,
    StudentDashboardSerializer,
    StudentDashboardMarkSerializer,
    StudentHistoryEntrySerializer,
    StudentMarkSerializer,
    TeacherDashboardSerializer,
    TeacherExamListSerializer,
    TeacherPastClassSerializer,
    TeacherClassExamSerializer,
    UpcomingExamSerializer,
)
from academics.models import Assignment, Exam, Mark
from academics.services import (
    ServiceError,
    _get_enrollment,
    can_edit_marks,
    create_exam,
    get_exam_roster,
    get_student_dashboard,
    get_teacher_dashboard,
    get_teacher_past_classes,
    list_teacher_exams,
    list_teacher_exams_for_class,
    save_marks,
)


logger = logging.getLogger(__name__)


class StudentMarksPagination(PageNumberPagination):
    page_size_query_param = "page_size"


class StudentUpcomingPagination(PageNumberPagination):
    page_query_param = "upcoming_page"
    page_size_query_param = "upcoming_page_size"


class StudentHistoryPagination(PageNumberPagination):
    page_query_param = "history_page"
    page_size_query_param = "history_page_size"


class StudentDashboardMarksPagination(PageNumberPagination):
    page_query_param = "marks_page"
    page_size_query_param = "marks_page_size"


class TeacherPagination(PageNumberPagination):
    page_size_query_param = "page_size"


def _get_teacher_for_request(request):
    user = request.user
    teacher_profile = getattr(user, "teacher_profile", None)
    if teacher_profile:
        return teacher_profile
    if user.is_staff or user.is_superuser:
        teacher_id = request.query_params.get("teacher_id") or request.data.get("teacher_id")
        if teacher_id:
            return get_object_or_404(TeacherProfile, id=teacher_id)
    return None


class StudentDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsStudent]

    @extend_schema(
        parameters=[OpenApiParameter(name="year", type=str, required=False, description="Academic year filter (YYYY)")],
        responses=StudentDashboardSerializer,
    )
    def get(self, request):
        year = request.query_params.get("year")
        dashboard = get_student_dashboard(request.user.student_profile, year)

        def paginate_list(items, serializer_cls, paginator_cls):
            paginator = paginator_cls()
            page = paginator.paginate_queryset(items, request, view=self)
            serialized = serializer_cls(page if page is not None else items, many=True)
            if page is not None:
                return {
                    "count": paginator.page.paginator.count,
                    "next": paginator.get_next_link(),
                    "previous": paginator.get_previous_link(),
                    "results": serialized.data,
                }
            return {"count": len(serialized.data), "next": None, "previous": None, "results": serialized.data}

        dashboard["upcoming_exams"] = paginate_list(
            dashboard.get("upcoming_exams", []), UpcomingExamSerializer, StudentUpcomingPagination
        )
        dashboard["marks"] = paginate_list(
            dashboard.get("marks", []), StudentDashboardMarkSerializer, StudentDashboardMarksPagination
        )
        dashboard["history"] = paginate_list(
            dashboard.get("history", []), StudentHistoryEntrySerializer, StudentHistoryPagination
        )

        serializer = StudentDashboardSerializer(dashboard)
        payload = serializer.data
        payload["message"] = "Student dashboard retrieved"
        return Response(payload, status=status.HTTP_200_OK)


class UpcomingExamsView(APIView):
    permission_classes = [IsAuthenticated, IsStudent]

    @extend_schema(
        parameters=[OpenApiParameter(name="year", type=str, required=False, description="Academic year filter (YYYY)")],
        responses=UpcomingExamSerializer(many=True),
    )
    def get(self, request):
        year = request.query_params.get("year")
        dashboard = get_student_dashboard(request.user.student_profile, year)
        upcoming = dashboard.get("upcoming_exams", [])
        paginator = StudentUpcomingPagination()
        page = paginator.paginate_queryset(upcoming, request, view=self)
        serializer = UpcomingExamSerializer(page if page is not None else upcoming, many=True)
        if page is not None:
            paginated = paginator.get_paginated_response(serializer.data)
            paginated.data["message"] = "Upcoming exams retrieved"
            return paginated
        return Response({"results": serializer.data, "message": "Upcoming exams retrieved"}, status=status.HTTP_200_OK)


class StudentMarksView(APIView):
    permission_classes = [IsAuthenticated, IsStudent]
    pagination_class = StudentMarksPagination

    @extend_schema(
        parameters=[OpenApiParameter(name="page_size", type=int, required=False, description="Items per page")],
        responses=StudentMarkSerializer(many=True),
    )
    def get(self, request):
        enrollment = _get_enrollment(request.user.student_profile, request.query_params.get("year"))
        marks_qs = (
            Mark.objects.filter(enrollment=enrollment)
            .select_related("exam__assignment__subject")
            .order_by("-exam__date")
            if enrollment
            else Mark.objects.none()
        )

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(marks_qs, request)
        exam_stats_map = {}
        if page:
            exam_stats = (
                Mark.objects.filter(exam_id__in=[mark.exam_id for mark in page])
                .values("exam_id")
                .annotate(highest=models.Max("marks_obtained"), lowest=models.Min("marks_obtained"))
            )
            exam_stats_map = {row["exam_id"]: {"highest": row["highest"], "lowest": row["lowest"]} for row in exam_stats}
        results = [
            {
                "exam": {"id": mark.exam.id, "title": mark.exam.title},
                "subject": mark.exam.assignment.subject.name,
                "date": mark.exam.date,
                "marks_obtained": mark.marks_obtained,
                "max_marks": mark.exam.max_marks,
                "highest_mark": exam_stats_map.get(mark.exam_id, {}).get("highest"),
                "lowest_mark": exam_stats_map.get(mark.exam_id, {}).get("lowest"),
            }
            for mark in page
        ]
        serializer = StudentMarkSerializer(results, many=True)
        paginated = paginator.get_paginated_response(serializer.data)
        paginated.data["message"] = "Marks retrieved"
        return paginated


class TeacherDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    @extend_schema(responses=TeacherDashboardSerializer)
    def get(self, request):
        teacher_profile = _get_teacher_for_request(request)
        if not teacher_profile:
            return Response({"error": "Teacher profile not found"}, status=status.HTTP_400_BAD_REQUEST)

        dashboard = get_teacher_dashboard(teacher_profile)
        serializer = TeacherDashboardSerializer(dashboard)
        payload = serializer.data
        payload["message"] = "Teacher dashboard retrieved"
        return Response(payload, status=status.HTTP_200_OK)


class TeacherExamsView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]
    pagination_class = TeacherPagination

    @extend_schema(
        parameters=[OpenApiParameter(name="year", type=str, required=False, description="Filter by 'current', 'past', or YYYY")],
        responses=TeacherExamListSerializer(many=True),
    )
    def get(self, request):
        teacher_profile = _get_teacher_for_request(request)
        if not teacher_profile:
            return Response({"error": "Teacher profile not found"}, status=status.HTTP_400_BAD_REQUEST)

        year_filter = request.query_params.get("year")
        exams = list_teacher_exams(teacher_profile, year_filter)
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(exams, request, view=self)
        serializer = TeacherExamListSerializer(page if page is not None else exams, many=True)
        if page is not None:
            paginated = paginator.get_paginated_response(serializer.data)
            paginated.data["message"] = "Exams retrieved"
            return paginated
        return Response({"results": serializer.data, "message": "Exams retrieved"}, status=status.HTTP_200_OK)

    @extend_schema(request=ExamCreateSerializer, responses=inline_serializer(name="ExamCreateResponse", fields={
        "id": serializers.IntegerField(),
        "assignment_id": serializers.IntegerField(),
        "title": serializers.CharField(),
        "date": serializers.DateField(),
        "max_marks": serializers.IntegerField(),
        "status": serializers.CharField(),
        "created_by": serializers.IntegerField(),
        "academic_year": serializers.CharField(),
    }))
    def post(self, request):
        teacher_profile = _get_teacher_for_request(request)
        is_admin = request.user.is_staff or request.user.is_superuser
        if not teacher_profile and not is_admin:
            return Response({"error": "Teacher profile not found"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = ExamCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        assignment = get_object_or_404(Assignment, id=serializer.validated_data["assignment_id"])

        try:
            exam = create_exam(
                assignment=assignment,
                teacher=teacher_profile,
                title=serializer.validated_data["title"],
                exam_date=serializer.validated_data["date"],
                max_marks=serializer.validated_data.get("max_marks", 100),
                status=serializer.validated_data.get("status"),
                is_admin=is_admin,
            )
        except ServiceError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        logger.info("exam_created", extra={"assignment_id": assignment.id, "title": exam.title})

        return Response(
            {
                "id": exam.id,
                "assignment_id": assignment.id,
                "title": exam.title,
                "date": exam.date,
                "max_marks": exam.max_marks,
                "status": exam.status,
                "created_by": exam.created_by_id,
                "academic_year": exam.academic_year.year,
                "message": "Exam created successfully",
            },
            status=status.HTTP_201_CREATED,
        )


class TeacherPastClassesView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]
    pagination_class = TeacherPagination

    @extend_schema(responses=TeacherPastClassSerializer(many=True))
    def get(self, request):
        teacher_profile = _get_teacher_for_request(request)
        if not teacher_profile:
            return Response({"error": "Teacher profile not found"}, status=status.HTTP_400_BAD_REQUEST)

        paginator = self.pagination_class()
        classes = get_teacher_past_classes(teacher_profile)
        page = paginator.paginate_queryset(classes, request, view=self)
        serializer = TeacherPastClassSerializer(page if page is not None else classes, many=True)
        if page is not None:
            paginated = paginator.get_paginated_response(serializer.data)
            paginated.data["message"] = "Classes retrieved"
            return paginated
        return Response({"results": serializer.data, "message": "Classes retrieved"}, status=status.HTTP_200_OK)


class TeacherClassExamsView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]
    pagination_class = TeacherPagination

    @extend_schema(responses=TeacherClassExamSerializer(many=True))
    def get(self, request, class_offering_id: int):
        teacher_profile = _get_teacher_for_request(request)
        if not teacher_profile:
            return Response({"error": "Teacher profile not found"}, status=status.HTTP_400_BAD_REQUEST)

        paginator = self.pagination_class()
        exams = list_teacher_exams_for_class(teacher_profile, class_offering_id)
        page = paginator.paginate_queryset(exams, request, view=self)
        serialized = [
            {
                "id": exam.id,
                "title": exam.title,
                "date": exam.date,
                "status": exam.status,
                "subject": exam.assignment.subject.name,
                "max_marks": exam.max_marks,
                "academic_year": exam.academic_year.year,
            }
            for exam in (page if page is not None else exams)
        ]
        serializer = TeacherClassExamSerializer(serialized, many=True)
        if page is not None:
            paginated = paginator.get_paginated_response(serializer.data)
            paginated.data["message"] = "Exams retrieved"
            return paginated
        return Response({"results": serializer.data, "message": "Exams retrieved"}, status=status.HTTP_200_OK)


class TeacherExamDetailView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    @extend_schema(responses=ExamDetailSerializer)
    def get(self, request, exam_id):
        exam = get_object_or_404(
            Exam.objects.select_related("assignment__class_offering", "assignment__subject", "academic_year"),
            id=exam_id,
        )
        teacher_profile = _get_teacher_for_request(request)
        is_admin = request.user.is_staff or request.user.is_superuser
        if not is_admin and (not teacher_profile or exam.assignment.teacher_id != teacher_profile.id):
            raise PermissionDenied("Not assigned to this class+subject")

        roster = get_exam_roster(exam)
        allow_edit = can_edit_marks(exam)
        payload = {
            "exam": {
                "id": exam.id,
                "title": exam.title,
                "date": exam.date,
                "max_marks": exam.max_marks,
                "status": exam.status,
                "assignment": {
                    "id": exam.assignment.id,
                    "class_offering": exam.assignment.class_offering.name,
                    "subject": exam.assignment.subject.name,
                },
            },
            "allow_edit": allow_edit,
            "read_only": not allow_edit,
            "roster": roster,
        }
        payload["message"] = "Exam detail retrieved"
        serializer = ExamDetailSerializer(payload)
        return Response(serializer.data, status=status.HTTP_200_OK)


class TeacherMarksEntryView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    @extend_schema(
        request=MarksEntrySerializer,
        responses=inline_serializer(name="MarksEntryResponse", fields={"saved": serializers.IntegerField()}),
    )
    def post(self, request, exam_id):
        exam = get_object_or_404(
            Exam.objects.select_related("assignment__class_offering", "assignment__subject", "academic_year"),
            id=exam_id,
        )
        teacher_profile = _get_teacher_for_request(request)
        is_admin = request.user.is_staff or request.user.is_superuser
        if not is_admin and (not teacher_profile or exam.assignment.teacher_id != teacher_profile.id):
            raise PermissionDenied("Not assigned to this class+subject")

        serializer = MarksEntrySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            saved_count = save_marks(exam, serializer.validated_data["marks"], actor=teacher_profile, is_admin=is_admin)
        except ServiceError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        logger.info("marks_saved", extra={"exam_id": exam.id, "count": saved_count})
        return Response({"saved": saved_count, "message": "Marks saved"}, status=status.HTTP_200_OK)
