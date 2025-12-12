from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from authentication.api import views

urlpatterns = [
    path("login/", views.LoginView.as_view(), name="auth_login"),
    path("register/student/", views.StudentRegistrationView.as_view(), name="auth_register_student"),
    path("token/refresh/", views.TokenRefreshWithMessageView.as_view(), name="token_refresh"),
    path("me/", views.CurrentUserView.as_view(), name="auth_me"),
    path("password-reset/", views.PasswordResetView.as_view(), name="password_reset"),
    path("password-reset/confirm/", views.PasswordResetConfirmView.as_view(), name="password_reset_confirm"),
    path(
        "password-reset/confirm/<uidb64>/<token>/",
        views.PasswordResetConfirmView.as_view(),
        name="password_reset_confirm",
    ),
]
