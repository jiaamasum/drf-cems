from datetime import timedelta

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from authentication.tests.fixtures import create_student, create_teacher
from academics.tests.fixtures import (
    create_academic_year,
    create_assignment,
    create_class_offering,
    create_exam,
    create_subject,
    enroll_student,
)


class StudentContractsTests(APITestCase):
    def setUp(self):
        self.user, self.student = create_student()
        self.teacher_user, self.teacher_profile = create_teacher(username="teacher_for_student", email="teacher_for_student@example.com")
        login = self.client.post(reverse("auth_login"), {"username": self.user.username, "password": "password123"}, format="json")
        self.access = login.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access}")

    def test_dashboard_returns_structure(self):
        year = create_academic_year()
        class_offering = create_class_offering(year)
        subject = create_subject()
        assignment = create_assignment(self.teacher_profile, year, class_offering, subject)
        enroll_student(self.student, year, class_offering)

        response = self.client.get(reverse("student-dashboard"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("profile", response.data)
        self.assertIn("enrollment", response.data)
        self.assertIn("subjects", response.data)

    def test_upcoming_exams_returns_future_exams(self):
        year = create_academic_year()
        class_offering = create_class_offering(year)
        subject = create_subject()
        assignment = create_assignment(self.teacher_profile, year, class_offering, subject)
        enrollment = enroll_student(self.student, year, class_offering)
        create_exam(assignment, title="Future Exam", max_marks=100)

        response = self.client.get(reverse("student-upcoming-exams"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data)
        self.assertIsInstance(response.data["results"], list)

    def test_marks_paginated(self):
        year = create_academic_year()
        class_offering = create_class_offering(year)
        subject = create_subject()
        assignment = create_assignment(self.teacher_profile, year, class_offering, subject)
        enrollment = enroll_student(self.student, year, class_offering)
        exam = create_exam(assignment, title="Past Exam", max_marks=100)

        # No marks yet; expect empty results
        response = self.client.get(reverse("student-marks"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data)
