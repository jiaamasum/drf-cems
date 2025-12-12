import os

from django.contrib.auth import get_user_model
from django.db import models
from django.db.models import IntegerField, Max
from django.db.models.functions import Cast, Substr


User = get_user_model()


class TimestampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class StudentProfile(TimestampedModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="student_profile")
    full_name = models.CharField(max_length=255, blank=True)
    student_id = models.CharField(max_length=20, unique=True, null=True, blank=True)

    def _generate_student_id(self) -> str:
        base_start = int(os.getenv("STUDENT_ID_START", "221002001"))
        cls = self.__class__
        agg = cls.objects.annotate(num=Cast("student_id", IntegerField())).aggregate(max_num=Max("num"))
        current_max = agg.get("max_num") or 0
        next_num = max(base_start, current_max + 1)
        return f"{next_num:09d}"

    def save(self, *args, **kwargs):
        if not self.student_id:
            self.student_id = self._generate_student_id()
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.full_name or self.user.get_username()


class TeacherProfile(TimestampedModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="teacher_profile")
    full_name = models.CharField(max_length=255, blank=True)
    employee_code = models.CharField(max_length=20, unique=True, null=True, blank=True)

    def _generate_employee_code(self) -> str:
        prefix = "EMP-"
        cls = self.__class__
        agg = cls.objects.annotate(
            code_num=Cast(Substr("employee_code", len(prefix) + 1), IntegerField())
        ).aggregate(max_num=Max("code_num"))
        next_num = (agg.get("max_num") or 0) + 1
        return f"{prefix}{next_num:03d}"

    def save(self, *args, **kwargs):
        # If user is becoming a teacher, remove any existing student profile.
        if not self.pk and hasattr(self.user, "student_profile"):
            self.user.student_profile.delete()
        if not self.employee_code:
            self.employee_code = self._generate_employee_code()
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        base = self.full_name or self.user.get_username()
        return f"{base} ({self.employee_code})" if self.employee_code else base
