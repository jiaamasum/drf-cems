from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from authentication.tests.fixtures import create_student


class AuthContractsTests(APITestCase):
    def test_student_registration_returns_tokens_and_profile(self):
        payload = {
            "username": "newstudent",
            "email": "newstudent@example.com",
            "password1": "strongpass123",
            "password2": "strongpass123",
        }
        url = reverse("auth_register_student")
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertIn("student_profile", response.data)

    def test_login_returns_tokens_and_role(self):
        user, student = create_student()
        url = reverse("auth_login")
        response = self.client.post(url, {"username": user.username, "password": "password123"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["user"]["role"], "student")
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_token_refresh(self):
        user, student = create_student(username="student_refresh", email="srefresh@example.com")
        login = self.client.post(reverse("auth_login"), {"username": user.username, "password": "password123"}, format="json")
        refresh = login.data["refresh"]
        response = self.client.post(reverse("token_refresh"), {"refresh": refresh}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)

    def test_me_requires_auth_and_returns_roles(self):
        user, student = create_student(username="student_me", email="student_me@example.com")
        login = self.client.post(reverse("auth_login"), {"username": user.username, "password": "password123"}, format="json")
        access = login.data["access"]
        response = self.client.get(reverse("auth_me"), HTTP_AUTHORIZATION=f"Bearer {access}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["roles"]["student"])

    def test_password_reset_unknown_email_returns_error(self):
        response = self.client.post(reverse("password_reset"), {"email": "missing@example.com"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_password_reset_confirm_invalid_token(self):
        payload = {
            "uid": "invalid",
            "token": "badtoken",
            "new_password1": "password123",
            "new_password2": "password123",
        }
        response = self.client.post(reverse("password_reset_confirm"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
