from __future__ import annotations

from datetime import date
from typing import Iterable, List, Optional

from django.core.exceptions import PermissionDenied, ValidationError
from django.db import transaction, models
from django.db.models import Count, Max, Min, Sum
from django.utils import timezone

from authentication.models import StudentProfile, TeacherProfile

from .models import (
    AcademicYear,
    ALLOWED_ACADEMIC_YEARS,
    ALLOWED_CLASS_LEVELS,
    Assignment,
    ClassOffering,
    Enrollment,
    Exam,
    Mark,
    PromotionRecord,
    Subject,
)


class ServiceError(ValidationError):
    """Raised for known validation errors that should surface to the API layer."""


def get_current_academic_year() -> Optional[AcademicYear]:
    return AcademicYear.objects.filter(is_current=True).order_by("-start_date").first()


def _get_enrollment(student: StudentProfile, year: Optional[str] = None) -> Optional[Enrollment]:
    qs = (
        Enrollment.objects.select_related("academic_year", "class_offering")
        .filter(student=student)
        .order_by("-academic_year__start_date")
    )
    if year:
        qs = qs.filter(academic_year__year=year)
    else:
        current_year = get_current_academic_year()
        if current_year:
            qs = qs.filter(academic_year=current_year)
    return qs.first()


def _calculate_grade(marks: Iterable[Mark]) -> Optional[str]:
    marks = list(marks)
    if not marks:
        return None

    total_scored = sum(mark.marks_obtained for mark in marks)
    total_possible = sum(mark.exam.max_marks for mark in marks)
    if total_possible == 0:
        return None

    percentage = (total_scored / total_possible) * 100
    if percentage >= 90:
        return "A"
    if percentage >= 80:
        return "B"
    if percentage >= 70:
        return "C"
    if percentage >= 60:
        return "D"
    return "E"


def _grade_from_percent(percent: Optional[float]) -> Optional[str]:
    if percent is None:
        return None
    if percent >= 90:
        return "A"
    if percent >= 80:
        return "B"
    if percent >= 70:
        return "C"
    if percent >= 60:
        return "D"
    return "E"


def _calculate_percentage(marks: Iterable[Mark]) -> float:
    marks = list(marks)
    total_scored = sum(mark.marks_obtained for mark in marks)
    total_possible = sum(mark.exam.max_marks for mark in marks)
    if total_possible == 0:
        return 0.0
    return (total_scored / total_possible) * 100


def _update_enrollment_grade(enrollment: Enrollment):
    marks_qs = Mark.objects.filter(enrollment=enrollment).select_related("exam")
    grade = _calculate_grade(marks_qs)
    Enrollment.objects.filter(pk=enrollment.pk).update(grade=grade, updated_at=timezone.now())


def get_student_dashboard(student: StudentProfile, year: Optional[str] = None) -> dict:
    enrollment = _get_enrollment(student, year)

    # Aggregate lifetime history across all enrollments
    enrollments = (
        Enrollment.objects.filter(student=student)
        .select_related("academic_year", "class_offering")
        .order_by("-academic_year__start_date")
    )

    history_entries = []
    for enr in enrollments:
        enr_marks_qs = (
            Mark.objects.filter(enrollment=enr)
            .select_related("exam__assignment__subject")
            .order_by("-exam__date")
        )
        enr_marks = list(enr_marks_qs)
        total_scored = sum(m.marks_obtained for m in enr_marks)
        total_possible = sum(m.exam.max_marks for m in enr_marks)
        overall_percent = round((total_scored / total_possible) * 100, 2) if total_possible else None
        subjects_map = {}
        for mark in enr_marks:
            subj = mark.exam.assignment.subject
            if subj.id not in subjects_map:
                subjects_map[subj.id] = {
                    "id": subj.id,
                    "name": subj.name,
                    "code": subj.code,
                    "scored": 0,
                    "possible": 0,
                }
            subjects_map[subj.id]["scored"] += mark.marks_obtained
            subjects_map[subj.id]["possible"] += mark.exam.max_marks
        subjects_history = []
        for subj in subjects_map.values():
            percent = round((subj["scored"] / subj["possible"]) * 100, 2) if subj["possible"] else None
            subjects_history.append(
                {
                    "id": subj["id"],
                    "name": subj["name"],
                    "code": subj["code"],
                    "percent": percent,
                    "grade": _grade_from_percent(percent),
                }
            )
        history_entries.append(
            {
                "academic_year": enr.academic_year.year,
                "class_name": enr.class_offering.name,
                "roll_number": enr.roll_number,
                "total_exams": len(enr_marks),
                "overall_percent": overall_percent,
                "overall_grade": enr.grade or _calculate_grade(enr_marks),
                "subjects": subjects_history,
            }
        )

    # Current enrollment-specific data
    if enrollment:
        subjects_qs = (
            Subject.objects.filter(assignments__class_offering=enrollment.class_offering)
            .distinct()
            .order_by("name")
        )

        today = timezone.localdate()
        upcoming_exams_qs = (
            Exam.objects.filter(
                assignment__class_offering=enrollment.class_offering,
                assignment__subject__in=subjects_qs,
                date__gte=today,
            )
            .select_related("assignment__subject")
            .order_by("date")
        )

        marks_qs = list(
            Mark.objects.filter(enrollment=enrollment)
            .select_related("exam__assignment__subject")
            .order_by("-exam__date")
        )

        exam_stats_map = {}
        if marks_qs:
            exam_stats = (
                Mark.objects.filter(exam_id__in=[mark.exam_id for mark in marks_qs])
                .values("exam_id")
                .annotate(highest=Max("marks_obtained"), lowest=Min("marks_obtained"))
            )
            exam_stats_map = {
                row["exam_id"]: {"highest": row["highest"], "lowest": row["lowest"]} for row in exam_stats
            }

        subjects = [
            {"id": subject.id, "name": subject.name, "code": subject.code} for subject in subjects_qs
        ]
        upcoming_exams = [
            {
                "id": exam.id,
                "title": exam.title,
                "subject": exam.assignment.subject.name,
                "date": exam.date,
                "max_marks": exam.max_marks,
            }
            for exam in upcoming_exams_qs
        ]
        marks = [
            {
                "exam_id": mark.exam_id,
                "exam_title": mark.exam.title,
                "subject": mark.exam.assignment.subject.name,
                "date": mark.exam.date,
                "marks_obtained": mark.marks_obtained,
                "max_marks": mark.exam.max_marks,
                "highest_mark": exam_stats_map.get(mark.exam_id, {}).get("highest"),
                "lowest_mark": exam_stats_map.get(mark.exam_id, {}).get("lowest"),
            }
            for mark in marks_qs
        ]

        current_grade = enrollment.grade or _calculate_grade(marks_qs)

        return {
            "profile": {
            "id": enrollment.student.id,
            "user_id": enrollment.student.user_id,
            "full_name": enrollment.student.full_name,
            "username": enrollment.student.user.username,
            "student_id": enrollment.student.student_id,
        },
            "enrollment": {
                "id": enrollment.id,
                "academic_year": enrollment.academic_year.year,
                "class_offering": {
                    "id": enrollment.class_offering.id,
                    "name": enrollment.class_offering.name,
                    "level": enrollment.class_offering.level,
                },
                "roll_number": enrollment.roll_number,
                "student_id": enrollment.student.student_id,
                "grade": current_grade,
            },
            "subjects": subjects,
            "upcoming_exams": upcoming_exams,
            "marks": marks,
            "current_grade": current_grade,
            "history": history_entries,
        }

    # No enrollment at all; return history only and empty current sections
    return {
        "profile": {
            "id": student.id,
            "user_id": student.user_id,
            "full_name": student.full_name,
            "username": student.user.username,
            "student_id": student.student_id,
        },
        "enrollment": None,
        "subjects": [],
        "upcoming_exams": [],
        "marks": [],
        "current_grade": None,
        "history": history_entries,
    }


def _ensure_assignment_current_year(assignment: Assignment):
    current_year = get_current_academic_year()
    if not current_year or assignment.academic_year_id != current_year.id:
        raise ServiceError("Can only create exams for current academic year")


def _ensure_teacher_assignment(assignment: Assignment, teacher: Optional[TeacherProfile], is_admin: bool):
    if teacher is None or is_admin:
        return
    if assignment.teacher_id != teacher.id:
        raise PermissionDenied("Not assigned to this class or subject")


def _ensure_exam_limits(assignment: Assignment):
    current_year = assignment.academic_year
    existing_count = Exam.objects.filter(
        assignment__class_offering=assignment.class_offering,
        assignment__subject=assignment.subject,
        academic_year=current_year,
    ).count()
    if existing_count >= 3:
        raise ServiceError("Maximum 3 exams per class and subject")


def create_exam(
    *,
    assignment: Assignment,
    teacher: Optional[TeacherProfile],
    title: str,
    exam_date: date,
    max_marks: int = 100,
    status: str = Exam.STATUS_PUBLISHED,
    is_admin: bool = False,
) -> Exam:
    _ensure_teacher_assignment(assignment, teacher, is_admin)
    _ensure_assignment_current_year(assignment)

    today = timezone.localdate()
    if max_marks != 100:
        raise ServiceError("Each exam must be set to 100 marks.")
    if exam_date != today:
        raise ServiceError("Exam date must be today; future or past dates are not allowed.")
    if str(exam_date.year) != assignment.academic_year.year:
        raise ServiceError("Exam date must fall within the academic year.")

    _ensure_exam_limits(assignment)

    return Exam.objects.create(
        assignment=assignment,
        academic_year=assignment.academic_year,
        title=title,
        date=exam_date,
        max_marks=max_marks,
        status=status,
        created_by=teacher or assignment.teacher,
    )


def list_teacher_exams(teacher: TeacherProfile, year_filter: Optional[str] = None):
    qs = Exam.objects.filter(created_by=teacher).select_related(
        "assignment__class_offering", "assignment__subject", "academic_year"
    )
    if year_filter == "current":
        current_year = get_current_academic_year()
        if current_year:
            qs = qs.filter(academic_year=current_year)
    elif year_filter == "past":
        current_year = get_current_academic_year()
        if current_year:
            qs = qs.exclude(academic_year=current_year)
    elif year_filter:
        qs = qs.filter(academic_year__year=year_filter)
    return qs.order_by("-date")


def get_teacher_past_classes(teacher: TeacherProfile):
    qs = (
        Assignment.objects.filter(teacher=teacher)
        .values("class_offering_id", "class_offering__name", "academic_year__year")
        .annotate(exam_count=Count("exams"))
        .order_by("-academic_year__year", "class_offering__name")
    )
    return [
        {
            "class_offering_id": row["class_offering_id"],
            "class_name": row["class_offering__name"],
            "academic_year": row["academic_year__year"],
            "exam_count": row["exam_count"],
        }
        for row in qs
    ]


def list_teacher_exams_for_class(teacher: TeacherProfile, class_offering_id: int):
    return (
        Exam.objects.filter(
            assignment__teacher=teacher,
            assignment__class_offering_id=class_offering_id,
        )
        .select_related("assignment__subject", "academic_year", "assignment__class_offering")
        .order_by("-date")
    )


def get_teacher_dashboard(teacher: TeacherProfile) -> dict:
    current_year = get_current_academic_year()
    assignments_qs = Assignment.objects.filter(teacher=teacher)
    if current_year:
        assignments_qs = assignments_qs.filter(academic_year=current_year)

    assignments_qs = assignments_qs.select_related(
        "academic_year", "class_offering", "subject"
    ).annotate(student_count=Count("class_offering__enrollments"))

    assignments = [
        {
            "id": assignment.id,
            "academic_year": assignment.academic_year.year,
            "class_offering": {
                "id": assignment.class_offering.id,
                "name": assignment.class_offering.name,
                "level": assignment.class_offering.level,
            },
            "subject": {
                "id": assignment.subject.id,
                "name": assignment.subject.name,
                "code": assignment.subject.code,
            },
            "student_count": assignment.student_count,
        }
        for assignment in assignments_qs
    ]

    current_exams = list(
        Exam.objects.filter(created_by=teacher, date__gte=timezone.localdate())
        .order_by("date")
        .values("id", "title", "date", "status")
    )
    past_exams = list(
        Exam.objects.filter(created_by=teacher, date__lt=timezone.localdate())
        .order_by("-date")
        .values("id", "title", "date")
    )

    subject_count = assignments_qs.values("subject").distinct().count()

    return {
        "teacher_profile": {
            "id": teacher.id,
            "user_id": teacher.user_id,
            "full_name": teacher.full_name,
            "employee_code": teacher.employee_code,
            "username": teacher.user.username,
        },
        "assignments": assignments,
        "current_exams": current_exams,
        "past_exams": past_exams,
        "subject_count": subject_count,
        "current_year": {"id": current_year.id, "year": current_year.year} if current_year else None,
    }


def get_exam_roster(exam: Exam) -> List[dict]:
    enrollments = Enrollment.objects.filter(
        class_offering=exam.assignment.class_offering, academic_year=exam.academic_year
    ).select_related("student__user")
    marks_by_enrollment = {mark.enrollment_id: mark for mark in exam.marks.all()}
    roster = []
    for enrollment in enrollments:
        mark = marks_by_enrollment.get(enrollment.id)
        roster.append(
            {
                "student_enrollment_id": enrollment.id,
                "student_name": enrollment.student.full_name or enrollment.student.user.username,
                "student_id": enrollment.student.student_id,
                "roll": enrollment.roll_number,
                "existing_mark": mark.marks_obtained if mark else None,
            }
        )
    return roster


def can_edit_marks(exam: Exam) -> bool:
    return not exam.marks.exists()


def save_marks(exam: Exam, marks: List[dict], *, actor: TeacherProfile, is_admin: bool = False) -> int:
    if not can_edit_marks(exam):
        raise ServiceError("Marks already entered and cannot be modified")
    _ensure_teacher_assignment(exam.assignment, actor, is_admin)

    with transaction.atomic():
        created = 0
        touched_enrollments = set()
        for entry in marks:
            enrollment_id = entry.get("student_enrollment_id")
            marks_obtained = entry.get("marks_obtained")
            try:
                enrollment = Enrollment.objects.get(id=enrollment_id, class_offering=exam.assignment.class_offering)
            except Enrollment.DoesNotExist as exc:
                raise ServiceError("Invalid student enrollment") from exc

            if marks_obtained is None or marks_obtained > exam.max_marks or marks_obtained < 0:
                raise ServiceError("Marks obtained must be between 0 and the exam maximum.")

            Mark.objects.create(exam=exam, enrollment=enrollment, marks_obtained=marks_obtained)
            created += 1
            touched_enrollments.add(enrollment)

        for enrollment in touched_enrollments:
            _update_enrollment_grade(enrollment)
    return created


def _get_or_create_class_for_year(academic_year: AcademicYear, level: str) -> ClassOffering:
    level = str(level)
    existing = ClassOffering.objects.filter(academic_year=academic_year, level=level).first()
    if existing:
        return existing

    class_offering = ClassOffering(
        academic_year=academic_year,
        level=level,
        name=f"Class {level}",
    )
    class_offering._allow_future_year = True
    class_offering.save()
    return class_offering


def promote_class(
    class_offering: ClassOffering, *, actor=None, notes: str = ""
) -> PromotionRecord:
    current_year = get_current_academic_year()
    if not current_year:
        raise ServiceError("No current academic year configured.")
    if class_offering.academic_year_id != current_year.id:
        raise ServiceError("Only classes from the current academic year can be promoted.")

    try:
        current_level = int(class_offering.level)
    except (TypeError, ValueError) as exc:
        raise ServiceError("Class level is not a valid number and cannot be promoted.") from exc

    max_level = max(int(level) for level in ALLOWED_CLASS_LEVELS)
    if current_level >= max_level:
        raise ServiceError("Highest class cannot be promoted further.")

    target_year_value = str(int(current_year.year) + 1)
    if target_year_value not in ALLOWED_ACADEMIC_YEARS:
        raise ServiceError("Target academic year is outside the allowed range.")
    target_year = AcademicYear.objects.filter(year=target_year_value).first()
    if not target_year:
        raise ServiceError(f"Target academic year {target_year_value} is not configured.")

    promoted_class = _get_or_create_class_for_year(target_year, str(current_level + 1))
    repeat_class = _get_or_create_class_for_year(target_year, str(current_level))

    promoted_count = 0
    retained_count = 0

    enrollments = Enrollment.objects.filter(class_offering=class_offering, academic_year=current_year)
    for enrollment in enrollments:
        marks = Mark.objects.filter(enrollment=enrollment).select_related("exam")
        percentage = _calculate_percentage(marks)
        target_class = promoted_class if percentage >= 40 else repeat_class

        target_enrollment = Enrollment.objects.filter(
            student=enrollment.student, academic_year=target_year
        ).first()

        if not target_enrollment:
            target_enrollment = Enrollment(
                student=enrollment.student,
                academic_year=target_year,
                class_offering=target_class,
            )
        else:
            target_enrollment.class_offering = target_class
            target_enrollment.roll_number = None
            target_enrollment.grade = None

        target_enrollment._allow_promotion = True
        target_enrollment.save()

        if percentage >= 40:
            promoted_count += 1
        else:
            retained_count += 1

    return PromotionRecord.objects.create(
        source_academic_year=current_year,
        target_academic_year=target_year,
        source_class=class_offering,
        target_class=promoted_class,
        promoted_count=promoted_count,
        retained_count=retained_count,
        notes=notes or "",
        performed_by=actor,
    )
