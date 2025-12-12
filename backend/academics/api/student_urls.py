from django.urls import path

from academics.api.views import StudentDashboardView, StudentMarksView, UpcomingExamsView

urlpatterns = [
    path("dashboard/", StudentDashboardView.as_view(), name="student-dashboard"),
    path("upcoming-exams/", UpcomingExamsView.as_view(), name="student-upcoming-exams"),
    path("marks/", StudentMarksView.as_view(), name="student-marks"),
]
