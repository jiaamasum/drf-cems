from rest_framework.permissions import BasePermission


class IsStudent(BasePermission):
    """Allows access only to authenticated users with a student profile."""

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False
        # A user with a teacher profile should not be treated as a student.
        if hasattr(user, "teacher_profile"):
            return False
        return hasattr(user, "student_profile")


class IsTeacherOrAdmin(BasePermission):
    """Allows access to teachers (with profile) or Django admins."""

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False
        if user.is_staff or user.is_superuser:
            return True
        return hasattr(user, "teacher_profile")
