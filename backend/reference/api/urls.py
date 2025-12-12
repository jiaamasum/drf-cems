from django.urls import path

from reference.api.views import CurrentAcademicYearView, CurrentAssignmentsView

urlpatterns = [
    path("academic-years/current/", CurrentAcademicYearView.as_view(), name="current-academic-year"),
    path("assignments/current/", CurrentAssignmentsView.as_view(), name="current-assignments"),
]
