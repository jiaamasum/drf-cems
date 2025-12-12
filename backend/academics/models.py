from datetime import date

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models.functions import Lower
from django.utils import timezone

from authentication.models import StudentProfile, TeacherProfile

# Hard constraints requested by business
ALLOWED_ACADEMIC_YEARS = [str(year) for year in range(2024, 2051)]
ALLOWED_CLASS_LEVELS = [str(level) for level in range(6, 11)]
HARDCODED_SUBJECTS = {
    "BANGLA": "BAN-101",
    "ENGLISH": "ENG-101",
    "MATH": "MAT-101",
    "SCIENCE": "SCE-101",
    "ISLAMIC STUDIES": "ISL-101",
}


class TimestampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class AcademicYear(TimestampedModel):
    year = models.CharField(max_length=20, unique=True)
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)

    class Meta:
        ordering = ["-start_date"]

    def __str__(self) -> str:
        return self.year

    def clean(self):
        super().clean()
        if self.year not in ALLOWED_ACADEMIC_YEARS:
            raise ValidationError("Academic year must be between 2024 and 2050.")

        if self.start_date.year != self.end_date.year:
            raise ValidationError("Start and end dates must live in the same calendar year.")

        year_int = int(self.year)
        if self.start_date != date(year_int, 1, 1) or self.end_date != date(year_int, 12, 31):
            raise ValidationError("Academic year must span the full calendar year (Jan 1 - Dec 31).")

        if self.is_current and year_int != timezone.localdate().year:
            raise ValidationError("Only the running calendar year can be marked as current.")

        if self.is_current and AcademicYear.objects.exclude(pk=self.pk).filter(is_current=True).exists():
            raise ValidationError("Only one academic year can be marked as current.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class Subject(TimestampedModel):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=20, unique=True)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(Lower("name"), name="unique_subject_name_ci"),
        ]

    def __str__(self) -> str:
        return self.name

    def clean(self):
        super().clean()
        normalized = (self.name or "").strip().upper()
        expected_code = HARDCODED_SUBJECTS.get(normalized)
        if not expected_code:
            raise ValidationError("Subject must be one of the approved subjects.")
        if self.code != expected_code:
            raise ValidationError("Subject code does not match approved list.")
        self.name = normalized.title()
        self.code = expected_code

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class ClassOffering(TimestampedModel):
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name="class_offerings")
    name = models.CharField(max_length=255)
    level = models.CharField(max_length=50)

    class Meta:
        unique_together = ("academic_year", "name")
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.name} ({self.academic_year})"

    def clean(self):
        super().clean()
        if not self.academic_year:
            raise ValidationError("Academic year is required for a class offering.")

        allow_future = getattr(self, "_allow_future_year", False)
        if not allow_future and not self.academic_year.is_current:
            raise ValidationError("Class offering can only be created for the current academic year.")

        level_value = str(self.level).strip()
        if level_value not in ALLOWED_CLASS_LEVELS:
            raise ValidationError("Class level must be between 1 and 10.")
        self.level = level_value

        canonical_name = f"Class {level_value}"
        if not self.name or self.name.strip().lower() not in {canonical_name.lower(), level_value.lower()}:
            self.name = canonical_name

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class Assignment(TimestampedModel):
    teacher = models.ForeignKey(TeacherProfile, on_delete=models.CASCADE, related_name="assignments")
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name="assignments")
    class_offering = models.ForeignKey(ClassOffering, on_delete=models.CASCADE, related_name="assignments")
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="assignments")

    class Meta:
        unique_together = ("teacher", "academic_year", "class_offering", "subject")
        constraints = [
            models.UniqueConstraint(
                fields=["academic_year", "class_offering", "subject"],
                name="unique_assignment_per_class_subject_year",
            )
        ]
        ordering = ["class_offering__name"]

    def __str__(self) -> str:
        return f"{self.class_offering} - {self.subject}"

    def clean(self):
        super().clean()
        if not self.academic_year or not self.class_offering:
            return

        allow_future = getattr(self, "_allow_future_year", False)
        if not allow_future and not self.academic_year.is_current:
            raise ValidationError("Assignments must belong to the current academic year.")

        if self.class_offering.academic_year_id != self.academic_year_id:
            raise ValidationError("Class offering must belong to the same academic year.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class Enrollment(TimestampedModel):
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name="enrollments")
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name="enrollments")
    class_offering = models.ForeignKey(ClassOffering, on_delete=models.CASCADE, related_name="enrollments")
    roll_number = models.PositiveIntegerField(blank=True, null=True)
    grade = models.CharField(max_length=2, blank=True, null=True)

    class Meta:
        unique_together = ("student", "academic_year", "class_offering")
        ordering = ["class_offering__name"]
        constraints = [
            models.UniqueConstraint(
                fields=["academic_year", "class_offering", "roll_number"],
                name="unique_roll_per_class_year",
                condition=~models.Q(roll_number=None),
            ),
            models.UniqueConstraint(
                fields=["student", "academic_year"],
                name="unique_student_per_academic_year",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.student} - {self.class_offering}"

    def save(self, *args, **kwargs):
        self.full_clean()
        if not self.roll_number:
            existing_max = (
                Enrollment.objects.filter(
                    academic_year=self.academic_year, class_offering=self.class_offering
                ).aggregate(max_roll=models.Max("roll_number"))["max_roll"]
            )
            self.roll_number = (existing_max or 0) + 1
        super().save(*args, **kwargs)

    def clean(self):
        super().clean()
        if not self.academic_year or not self.class_offering:
            return

        allow_promotion = getattr(self, "_allow_promotion", False)
        if not allow_promotion and not self.academic_year.is_current:
            raise ValidationError("Enrollment is only allowed for the current academic year.")

        if self.class_offering.academic_year_id != self.academic_year_id:
            raise ValidationError("Class offering and enrollment year must match.")

        existing = (
            Enrollment.objects.exclude(pk=self.pk)
            .filter(student=self.student, academic_year=self.academic_year)
            .exists()
        )
        if existing:
            raise ValidationError("Student already has an enrollment for this academic year.")


class Exam(TimestampedModel):
    STATUS_PUBLISHED = "published"
    STATUS_DRAFT = "draft"
    STATUS_CHOICES = [
        (STATUS_PUBLISHED, "Published"),
        (STATUS_DRAFT, "Draft"),
    ]

    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name="exams")
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name="exams")
    title = models.CharField(max_length=255)
    date = models.DateField(default=timezone.now)
    max_marks = models.PositiveIntegerField(default=100)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PUBLISHED)
    created_by = models.ForeignKey(TeacherProfile, on_delete=models.CASCADE, related_name="created_exams")

    class Meta:
        ordering = ["-date"]

    def __str__(self) -> str:
        return self.title

    def clean(self):
        super().clean()
        if not self.assignment or not self.academic_year:
            return

        if self.academic_year_id != self.assignment.academic_year_id:
            raise ValidationError("Exam academic year must match assignment academic year.")

        if not self.academic_year.is_current:
            raise ValidationError("Exams can only be created for the current academic year.")

        today = timezone.localdate()
        if self.date != today:
            raise ValidationError("Exam date must be today; future or past dates are not allowed.")

        if self.max_marks != 100:
            raise ValidationError("Each exam must be out of exactly 100 marks.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class Mark(TimestampedModel):
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name="marks")
    enrollment = models.ForeignKey(Enrollment, on_delete=models.CASCADE, related_name="marks")
    marks_obtained = models.PositiveIntegerField()

    class Meta:
        unique_together = ("exam", "enrollment")
        ordering = ["exam__date"]

    def __str__(self) -> str:
        return f"{self.enrollment} - {self.exam} ({self.marks_obtained})"

    def clean(self):
        super().clean()
        if self.marks_obtained is None:
            raise ValidationError("Marks obtained is required.")
        if self.exam and self.marks_obtained > self.exam.max_marks:
            raise ValidationError("Marks obtained cannot exceed the exam's maximum marks.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class PromotionRecord(TimestampedModel):
    source_academic_year = models.ForeignKey(
        AcademicYear, on_delete=models.CASCADE, related_name="promotion_sources"
    )
    target_academic_year = models.ForeignKey(
        AcademicYear, on_delete=models.CASCADE, related_name="promotion_targets"
    )
    source_class = models.ForeignKey(ClassOffering, on_delete=models.CASCADE, related_name="promotions_from")
    target_class = models.ForeignKey(ClassOffering, on_delete=models.CASCADE, related_name="promotions_to")
    promoted_count = models.PositiveIntegerField(default=0)
    retained_count = models.PositiveIntegerField(default=0)
    notes = models.TextField(blank=True)
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="promotion_runs"
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Promotion {self.source_class} -> {self.target_class} ({self.promoted_count} promoted)"
