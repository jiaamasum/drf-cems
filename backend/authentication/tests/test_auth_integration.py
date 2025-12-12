from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class AuthIntegrationTests(APITestCase):
    def test_full_registration_login_me_refresh_flow(self):
        reg_payload = {
            "username": "flowstudent",
            "email": "flowstudent@example.com",
            "password1": "strongpass123",
            "password2": "strongpass123",
        }
        reg_res = self.client.post(reverse("auth_register_student"), reg_payload, format="json")
        self.assertEqual(reg_res.status_code, status.HTTP_201_CREATED)
        access = reg_res.data["access"]
        refresh = reg_res.data["refresh"]

        # login
        login_res = self.client.post(
            reverse("auth_login"),
            {"username": reg_payload["username"], "password": reg_payload["password1"]},
            format="json",
        )
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)

        # me
        me_res = self.client.get(reverse("auth_me"), HTTP_AUTHORIZATION=f"Bearer {access}")
        self.assertEqual(me_res.status_code, status.HTTP_200_OK)
        self.assertTrue(me_res.data["roles"]["student"])

        # refresh
        refresh_res = self.client.post(reverse("token_refresh"), {"refresh": refresh}, format="json")
        self.assertEqual(refresh_res.status_code, status.HTTP_200_OK)
        self.assertIn("access", refresh_res.data)
