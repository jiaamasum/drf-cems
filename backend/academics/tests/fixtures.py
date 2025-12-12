from datetime import date

from django.utils import timezone

from authentication.tests.fixtures import create_student, create_teacher
from academics.models import (
    AcademicYear,
    Assignment,
    ClassOffering,
    Enrollment,
    Exam,
    Subject,
)


def create_academic_year(year: str | None = None, is_current: bool = True):
    year_value = str(timezone.localdate().year) if is_current else (year or "2024")
    year_int = int(year_value)
    start = date(year_int, 1, 1)
    end = date(year_int, 12, 31)
    obj, _ = AcademicYear.objects.get_or_create(
        year=str(year_int),
        defaults={"start_date": start, "end_date": end, "is_current": is_current},
    )
    obj.start_date = start
    obj.end_date = end
    if is_current:
        AcademicYear.objects.exclude(pk=obj.pk).update(is_current=False)
    obj.is_current = is_current
    obj.save()
    return obj


def create_subject(name: str = "BANGLA", code: str = "BAN-101"):
    obj, _ = Subject.objects.get_or_create(code=code, defaults={"name": name})
    return obj


def create_class_offering(academic_year: AcademicYear, name: str = "", level: str = "6"):
    name = name or f"Class {level}"
    existing = ClassOffering.objects.filter(academic_year=academic_year, level=str(level)).first()
    if existing:
        return existing
    return ClassOffering.objects.create(academic_year=academic_year, name=name, level=level)


def create_assignment(teacher_profile, academic_year, class_offering, subject):
    return Assignment.objects.create(
        teacher=teacher_profile,
        academic_year=academic_year,
        class_offering=class_offering,
        subject=subject,
    )


def enroll_student(student_profile, academic_year, class_offering, roll_number: str = "001"):
    return Enrollment.objects.create(
        student=student_profile,
        academic_year=academic_year,
        class_offering=class_offering,
        roll_number=int(roll_number),
    )


def create_exam(assignment, created_by=None, title: str = "Mid Term", max_marks: int = 100):
    created_by = created_by or assignment.teacher
    return Exam.objects.create(
        assignment=assignment,
        academic_year=assignment.academic_year,
        title=title,
        date=timezone.localdate(),
        max_marks=max_marks,
        created_by=created_by,
    )
