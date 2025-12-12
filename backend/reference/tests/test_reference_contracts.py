from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from authentication.tests.fixtures import create_student
from academics.tests.fixtures import create_academic_year, create_assignment, create_class_offering, create_subject
from academics.tests.fixtures import create_teacher as create_teacher_profile


class ReferenceContractsTests(APITestCase):
    def setUp(self):
        self.user, self.student = create_student(username="refstudent", email="refstudent@example.com")
        login = self.client.post("/api/auth/login/", {"username": self.user.username, "password": "password123"}, format="json")
        self.access = login.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access}")

    def test_current_academic_year(self):
        year = create_academic_year()
        response = self.client.get(reverse("current-academic-year"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["year"], year.year)

    def test_current_assignments(self):
        year = create_academic_year()
        subject = create_subject()
        class_offering = create_class_offering(year)
        teacher_user, teacher_profile = create_teacher_profile(username="refteacher", email="refteacher@example.com")
        create_assignment(teacher_profile, year, class_offering, subject)

        response = self.client.get(reverse("current-assignments"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
