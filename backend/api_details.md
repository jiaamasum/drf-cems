# CEMS API Plan (DRF)

Role-aware REST endpoints to power student and teacher dashboards. Admin keeps using Django admin; no admin CRUD APIs.

## Auth & Identity
| Method | Path | Purpose | Payload (req) | Response (key fields) | Notes |
| --- | --- | --- | --- | --- | --- |
| POST | `/api/auth/login/` | Login | `username`, `password` | `{access, refresh, user:{id, username, role, student_profile_id?, teacher_profile_id?}}` | Issue JWT pair; set `Authorization: Bearer <access>` on all subsequent calls |
| POST | `/api/auth/register/student/` | Student self-sign-up | `username`, `email`, `password1`, `password2` | `{user, student_profile, access, refresh}` | Return JWT pair on successful signup |
| POST | `/api/auth/password-reset/` | Start reset | `email` | 204 or error | Error on unknown email (match `EmailExistsPasswordResetForm`) |
| POST | `/api/auth/password-reset/confirm/` | Complete reset | `uid`, `token`, `new_password1`, `new_password2` | 204 | Standard Django token flow |
| POST | `/api/auth/token/refresh/` | Refresh access token | `refresh` | `{access}` | Standard simplejwt refresh |
| GET | `/api/auth/me/` | Current user & role | — | `{id, username, email, roles:{student, teacher, admin}, student_profile_id?, teacher_profile_id?, current_academic_year}` | Requires Bearer token |

## Student (read-only)
| Method | Path | Purpose | Payload (req) | Response (key fields) | Notes |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/student/dashboard/` | Full student view | Optional `?year=` | `{profile, enrollment, subjects, upcoming_exams, marks, current_grade, history}` | Bearer token; uses `academics.services`; defaults to current year or latest active |
| GET | `/api/student/upcoming-exams/` | Upcoming exams | — | `[ {id, title, subject, date, max_marks} ]` | Bearer token; lightweight refresh |
| GET | `/api/student/marks/` | Marks list | Optional pagination | `[ {exam, subject, date, marks_obtained, max_marks} ]` | Bearer token; current active enrollment scope |

## Teacher
| Method | Path | Purpose | Payload (req) | Response (key fields) | Notes |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/teacher/dashboard/` | Teacher overview | — | `{teacher_profile, assignments:[...student_count], current_exams, past_exams, subject_count, current_year}` | Bearer token; admin allowed |
| GET | `/api/teacher/exams/` | List exams by teacher | Optional `?year=current|past|YYYY` | `[ {id, title, class, subject, date, max_marks, status, academic_year} ]` | Bearer token; created_by current user |
| POST | `/api/teacher/exams/` | Create exam | `{assignment_id, title, date, max_marks=100, status='published'|'draft'}` | `{exam}` | Bearer token; validate via `academic_services.create_exam` (current year, ≤3 per class+subject, date not past, max≤100) |
| GET | `/api/teacher/exams/<id>/` | Exam detail + roster | — | `{exam, allow_edit, read_only, roster:[{student_enrollment_id, student_name, student_id, roll, existing_mark}]}` | Bearer token; permission: admin or assigned teacher (class+subject) |
| POST | `/api/teacher/exams/<id>/marks/` | Enter marks | `{marks:[{student_enrollment_id, marks_obtained}]}` | `{saved: count}` | Bearer token; only if `allow_edit`; reject updates to existing marks (lock) |
| PATCH (optional) | `/api/teacher/exams/<id>/publish/` | Draft → published | `{status}` | `{exam}` | Bearer token; only if draft flow kept; skip if always publish on create |

## Reference / Helpers
| Method | Path | Purpose | Payload (req) | Response (key fields) | Notes |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/reference/assignments/current/` | Current-year assignments | — | `[ {id, academic_year, class_offering, subject} ]` | Bearer token; feeds exam-create dropdown |
| GET | `/api/reference/academic-years/current/` | Current academic year | — | `{id, year, start_date, end_date}` | Bearer token; keeps client aligned with server “current” |

## Permissions & Reuse
- Auth: JWT via simplejwt; all protected endpoints require `Authorization: Bearer <access>`.
- Permissions: `IsAuthenticated`; add role-based guards `IsStudent`, `IsTeacherOrAdmin`.
- Reuse `academics.services` for exam creation, marks, current-year logic, and constraints (DFY).
- No admin CRUD APIs; promotions/enrollments/assignments stay in Django admin (YAGNI).

## Implementation Notes
- Add `djangorestframework` (and `djangorestframework-simplejwt` if JWT), DRF settings, routers.
- Build serializers around existing models; avoid duplicating business rules.
- Implement order: auth → dashboard aggregations → exam/marks flows.
- Smoke-test with seeded data (years/levels/subjects/class offerings) to verify permissions/constraints match current HTML flows.
