from django import forms
from django.contrib import admin

from academics.models import (
    AcademicYear,
    Assignment,
    ClassOffering,
    Enrollment,
    Exam,
    Mark,
    PromotionRecord,
    Subject,
)


@admin.register(AcademicYear)
class AcademicYearAdmin(admin.ModelAdmin):
    list_display = ("id", "year", "start_date", "end_date", "is_current")
    list_filter = ("is_current",)
    search_fields = ("year",)


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "code")
    search_fields = ("name", "code")


@admin.register(ClassOffering)
class ClassOfferingAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "level", "academic_year")
    list_filter = ("academic_year",)
    search_fields = ("name", "level")


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ("id", "teacher", "academic_year", "class_offering", "subject")
    list_filter = ("academic_year", "subject")
    search_fields = ("class_offering__name", "subject__name", "teacher__user__username")


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "student",
        "student_id_display",
        "academic_year",
        "class_offering",
        "roll_number",
        "grade",
    )
    list_filter = ("academic_year", "class_offering")
    search_fields = ("student__user__username", "student__full_name", "student__student_id", "roll_number")

    @admin.display(description="Student ID")
    def student_id_display(self, obj):
        return getattr(obj.student, "student_id", None)


@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "academic_year", "assignment", "date", "status", "max_marks", "created_by")
    list_filter = ("academic_year", "status", "assignment__subject")
    search_fields = ("title", "assignment__class_offering__name", "assignment__subject__name")
    date_hierarchy = "date"


@admin.register(Mark)
class MarkAdmin(admin.ModelAdmin):
    list_display = ("id", "exam", "enrollment", "marks_obtained")
    list_filter = ("exam",)
    search_fields = ("exam__title", "enrollment__student__user__username")


@admin.register(PromotionRecord)
class PromotionRecordAdmin(admin.ModelAdmin):
    class PromotionRecordForm(forms.ModelForm):
        class Meta:
            model = PromotionRecord
            fields = ("source_class", "notes")

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)
            self.fields["source_class"].queryset = ClassOffering.objects.select_related("academic_year").filter(
                academic_year__is_current=True
            )
            self.fields["source_class"].label = "Source class (Year - Class)"
            self.fields["source_class"].label_from_instance = (
                lambda obj: f"{obj.academic_year.year} - {obj.name}"
            )
            self.fields["notes"].required = False
            self.fields["notes"].help_text = "Optional notes for this promotion run."

    form = PromotionRecordForm
    list_display = ("id", "source_class_label", "target_class_label")
    readonly_fields = (
        "source_academic_year",
        "target_academic_year",
        "target_class",
        "performed_by",
    )
    fields = ("source_class", "notes")
    search_fields = ("source_class__name", "target_class__name")
    list_filter = ("source_academic_year", "target_academic_year")

    def source_class_label(self, obj):
        return f"{obj.source_academic_year.year} - {obj.source_class.name}"

    source_class_label.short_description = "Source class"

    def target_class_label(self, obj):
        return f"{obj.target_academic_year.year} - {obj.target_class.name}"

    target_class_label.short_description = "Target class"

    def has_change_permission(self, request, obj=None):
        # Prevent edits; use add-only to trigger promotions.
        if obj:
            return False
        return super().has_change_permission(request, obj)

    def save_model(self, request, obj, form, change):
        # On add, run promotion logic and populate the record; editing is disabled.
        if change:
            return
        from academics.services import promote_class

        record = promote_class(obj.source_class, actor=request.user, notes=form.cleaned_data.get("notes", ""))
        obj.pk = record.pk
        obj.source_academic_year = record.source_academic_year
        obj.target_academic_year = record.target_academic_year
        obj.target_class = record.target_class
        obj.promoted_count = record.promoted_count
        obj.retained_count = record.retained_count
        obj.performed_by = record.performed_by
        super().save_model(request, obj, form, change)
