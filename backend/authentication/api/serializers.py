from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
from rest_framework import serializers

from authentication.models import StudentProfile


User = get_user_model()


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        username = attrs.get("username")
        password = attrs.get("password")
        if not username or not password:
            raise serializers.ValidationError("Username and password are required")
        user = authenticate(username=username, password=password)
        if not user:
            raise serializers.ValidationError("Invalid credentials")
        attrs["user"] = user
        return attrs


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email"]


class StudentRegistrationSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    full_name = serializers.CharField(max_length=255, allow_blank=True, required=False)
    email = serializers.EmailField()
    password1 = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, min_length=8)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value

    def validate(self, attrs):
        if attrs["password1"] != attrs["password2"]:
            raise serializers.ValidationError("Passwords do not match")
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password1"],
        )
        student_profile = StudentProfile.objects.create(
            user=user,
            full_name=validated_data.get("full_name") or validated_data["username"],
        )
        return {"user": user, "student_profile": student_profile}


class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email not found for a registered user")
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password1 = serializers.CharField(write_only=True, min_length=8)
    new_password2 = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        if attrs["new_password1"] != attrs["new_password2"]:
            raise serializers.ValidationError({"new_password2": "Passwords do not match"})

        try:
            uid = urlsafe_base64_decode(attrs["uid"]).decode()
            user = User.objects.get(pk=uid)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError, UnicodeDecodeError) as exc:
            raise serializers.ValidationError({"uid": "Invalid or expired reset link"}) from exc

        if not default_token_generator.check_token(user, attrs["token"]):
            raise serializers.ValidationError({"token": "Invalid or expired token"})

        attrs["user"] = user
        return attrs

    def save(self, **kwargs):
        user = self.validated_data["user"]
        user.set_password(self.validated_data["new_password1"])
        user.save()
        return user
