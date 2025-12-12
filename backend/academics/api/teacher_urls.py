from django.urls import path

from academics.api.views import (
    TeacherDashboardView,
    TeacherExamDetailView,
    TeacherExamsView,
    TeacherMarksEntryView,
    TeacherPastClassesView,
    TeacherClassExamsView,
)

urlpatterns = [
    path("dashboard/", TeacherDashboardView.as_view(), name="teacher-dashboard"),
    path("exams/", TeacherExamsView.as_view(), name="teacher-exams"),
    path("classes/", TeacherPastClassesView.as_view(), name="teacher-classes"),
    path("classes/<int:class_offering_id>/exams/", TeacherClassExamsView.as_view(), name="teacher-class-exams"),
    path("exams/<int:exam_id>/", TeacherExamDetailView.as_view(), name="teacher-exam-detail"),
    path("exams/<int:exam_id>/marks/", TeacherMarksEntryView.as_view(), name="teacher-exam-marks"),
]
