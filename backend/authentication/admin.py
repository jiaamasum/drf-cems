from django.contrib import admin

from authentication.models import StudentProfile, TeacherProfile


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "full_name", "student_id", "created_at", "updated_at")
    search_fields = ("user__username", "user__email", "full_name", "student_id")
    list_filter = ("created_at",)


@admin.register(TeacherProfile)
class TeacherProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "full_name", "employee_code", "created_at", "updated_at")
    search_fields = ("user__username", "user__email", "full_name", "employee_code")
    list_filter = ("created_at",)
