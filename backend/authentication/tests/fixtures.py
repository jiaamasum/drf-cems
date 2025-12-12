from django.contrib.auth import get_user_model

from authentication.models import StudentProfile, TeacherProfile


def create_student(username: str = "student1", email: str = "student1@example.com", password: str = "password123"):
    user_model = get_user_model()
    user = user_model.objects.create_user(username=username, email=email, password=password)
    student_profile = StudentProfile.objects.create(user=user, full_name=username.title())
    return user, student_profile


def create_teacher(username: str = "teacher1", email: str = "teacher1@example.com", password: str = "password123"):
    user_model = get_user_model()
    user = user_model.objects.create_user(username=username, email=email, password=password)
    teacher_profile = TeacherProfile.objects.create(user=user, full_name=username.title())
    return user, teacher_profile
