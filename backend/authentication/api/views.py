import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.forms import PasswordResetForm
from rest_framework import status, serializers
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from drf_spectacular.utils import OpenApiResponse, extend_schema, inline_serializer

from academics.services import get_current_academic_year
from authentication.api.serializers import (
    LoginSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetSerializer,
    StudentRegistrationSerializer,
    UserSerializer,
)


logger = logging.getLogger(__name__)
User = get_user_model()


def _generate_tokens(user: User) -> dict:
    refresh = RefreshToken.for_user(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


def _get_role(user: User) -> str:
    if user.is_staff or user.is_superuser:
        return "admin"
    if hasattr(user, "teacher_profile"):
        return "teacher"
    if hasattr(user, "student_profile"):
        return "student"
    return "user"


class LoginView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        request=LoginSerializer,
        responses=inline_serializer(
            name="LoginResponse",
            fields={
                "access": serializers.CharField(),
                "refresh": serializers.CharField(),
                "user": inline_serializer(
                    name="LoginUser",
                    fields={
                        "id": serializers.IntegerField(),
                        "username": serializers.CharField(),
                        "role": serializers.CharField(),
                        "student_profile_id": serializers.IntegerField(allow_null=True, required=False),
                        "teacher_profile_id": serializers.IntegerField(allow_null=True, required=False),
                        "teacher_employee_code": serializers.CharField(allow_null=True, required=False),
                    },
                ),
            },
        ),
        auth=[],
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        tokens = _generate_tokens(user)

        logger.info("auth_login", extra={"username": user.username, "result": "success"})

        return Response(
            {
                **tokens,
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "role": _get_role(user),
                    "student_profile_id": getattr(user, "student_profile", None).id if hasattr(user, "student_profile") else None,
                    "teacher_profile_id": getattr(user, "teacher_profile", None).id if hasattr(user, "teacher_profile") else None,
                    "teacher_employee_code": getattr(user, "teacher_profile", None).employee_code if hasattr(user, "teacher_profile") else None,
                },
                "message": "Login successful",
            },
            status=status.HTTP_200_OK,
        )


class StudentRegistrationView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        request=StudentRegistrationSerializer,
        responses=inline_serializer(
            name="StudentRegistrationResponse",
            fields={
                "user": UserSerializer(),
                "student_profile": inline_serializer(
                    name="StudentProfileRef", fields={"id": serializers.IntegerField(), "user_id": serializers.IntegerField()}
                ),
                "access": serializers.CharField(),
                "refresh": serializers.CharField(),
            },
        ),
        auth=[],
    )
    def post(self, request):
        serializer = StudentRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = serializer.save()
        user = result["user"]
        tokens = _generate_tokens(user)

        logger.info("auth_registration", extra={"username": user.username, "result": "success"})

        return Response(
            {
                "user": UserSerializer(user).data,
                "student_profile": {"id": result["student_profile"].id, "user_id": user.id},
                **tokens,
                "message": "Registration successful",
            },
            status=status.HTTP_201_CREATED,
        )


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses=inline_serializer(
            name="CurrentUserResponse",
            fields={
                "id": serializers.IntegerField(),
                "username": serializers.CharField(),
                "email": serializers.EmailField(),
                "roles": inline_serializer(
                    name="UserRoles",
                    fields={
                        "student": serializers.BooleanField(),
                        "teacher": serializers.BooleanField(),
                        "admin": serializers.BooleanField(),
                    },
                ),
                "student_profile_id": serializers.IntegerField(allow_null=True),
                "teacher_profile_id": serializers.IntegerField(allow_null=True),
                "teacher_employee_code": serializers.CharField(allow_null=True),
                "current_academic_year": inline_serializer(
                    name="CurrentAcademicYear",
                    fields={
                        "id": serializers.IntegerField(),
                        "year": serializers.CharField(),
                        "is_current": serializers.BooleanField(),
                    },
                ),
            },
        )
    )
    def get(self, request):
        user = request.user
        current_year = get_current_academic_year()
        has_teacher = hasattr(user, "teacher_profile")
        has_student = hasattr(user, "student_profile") and not has_teacher
        return Response(
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "roles": {
                    "student": has_student,
                    "teacher": has_teacher,
                    "admin": user.is_staff or user.is_superuser,
                },
                "student_profile_id": getattr(user, "student_profile", None).id if has_student else None,
                "teacher_profile_id": getattr(user, "teacher_profile", None).id if has_teacher else None,
                "teacher_employee_code": getattr(user, "teacher_profile", None).employee_code if hasattr(user, "teacher_profile") else None,
                "current_academic_year": {
                    "id": current_year.id,
                    "year": current_year.year,
                    "is_current": current_year.is_current,
                }
                if current_year
                else None,
                "message": "Current user fetched",
            },
            status=status.HTTP_200_OK,
        )


class PasswordResetView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        request=PasswordResetSerializer,
        responses={204: OpenApiResponse(description="Password reset email sent"), 400: OpenApiResponse(description="Email not found")},
        auth=[],
    )
    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        form = PasswordResetForm({"email": email})
        if form.is_valid():
            form.save(
                request=request,
                from_email=settings.DEFAULT_FROM_EMAIL,
                use_https=False,
            )

        logger.info("auth_password_reset", extra={"email": email, "result": "requested"})
        return Response({"message": "Password reset email sent"}, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        request=PasswordResetConfirmSerializer,
        responses={204: OpenApiResponse(description="Password updated"), 400: OpenApiResponse(description="Invalid token/uid")},
        auth=[],
    )
    def post(self, request, uidb64=None, token=None):
        data = request.data.copy()
        # Support confirm links that hit the URL with path params by copying them into the payload
        if uidb64 and "uid" not in data:
            data["uid"] = uidb64
        if token and "token" not in data:
            data["token"] = token

        serializer = PasswordResetConfirmSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        logger.info("auth_password_reset_confirm", extra={"uid": data.get("uid"), "result": "success"})
        return Response({"message": "Password updated successfully"}, status=status.HTTP_200_OK)


class TokenRefreshWithMessageView(TokenRefreshView):
    @extend_schema(
        responses=inline_serializer(
            name="TokenRefreshResponse",
            fields={
                "access": serializers.CharField(),
                "refresh": serializers.CharField(required=False, allow_null=True),
                "message": serializers.CharField(),
            },
        ),
        auth=[],
    )
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            data = response.data
            data["message"] = "Token refreshed"
            response.data = data
        return response
