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


class TeacherContractsTests(APITestCase):
    def setUp(self):
        self.teacher_user, self.teacher_profile = create_teacher()
        login = self.client.post(reverse("auth_login"), {"username": self.teacher_user.username, "password": "password123"}, format="json")
        self.access = login.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access}")

        self.year = create_academic_year()
        self.class_offering = create_class_offering(self.year)
        self.subject = create_subject()
        self.assignment = create_assignment(self.teacher_profile, self.year, self.class_offering, self.subject)

    def test_teacher_dashboard(self):
        response = self.client.get(reverse("teacher-dashboard"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("assignments", response.data)

    def test_list_exams_and_create_exam(self):
        list_res = self.client.get(reverse("teacher-exams"))
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)

        create_payload = {
            "assignment_id": self.assignment.id,
            "title": "Unit Test Exam",
            "date": timezone.localdate(),
            "max_marks": 100,
        }
        create_res = self.client.post(reverse("teacher-exams"), create_payload, format="json")
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(create_res.data["title"], "Unit Test Exam")

    def test_exam_detail_and_marks_entry(self):
        exam = create_exam(self.assignment, created_by=self.teacher_profile, title="Detail Exam")
        student_user, student_profile = create_student(username="student_mark", email="student_mark@example.com")
        enrollment = enroll_student(student_profile, self.year, self.class_offering)

        detail_res = self.client.get(reverse("teacher-exam-detail", args=[exam.id]))
        self.assertEqual(detail_res.status_code, status.HTTP_200_OK)
        self.assertIn("roster", detail_res.data)

        marks_payload = {"marks": [{"student_enrollment_id": enrollment.id, "marks_obtained": 80}]}
        marks_res = self.client.post(reverse("teacher-exam-marks", args=[exam.id]), marks_payload, format="json")
        self.assertEqual(marks_res.status_code, status.HTTP_200_OK)
        self.assertEqual(marks_res.data["saved"], 1)
