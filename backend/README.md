# Backend — Django REST API

[![Django 4.2](https://img.shields.io/badge/Django-4.2-0C4B33?logo=django&logoColor=white)](https://www.djangoproject.com/)
[![DRF](https://img.shields.io/badge/DRF-3.14-ff1709?logo=django&logoColor=white)](https://www.django-rest-framework.org/)
[![JWT](https://img.shields.io/badge/Auth-JWT-blue)](#authentication)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](../README.md#license)

Role-aware REST API for students, teachers, and admins. Includes dashboard endpoints, exam creation and grading, and schema-first documentation via drf-spectacular.

## Requirements
- Python 3.11+ (tested)
- Pip + virtualenv
- PostgreSQL (production) or SQLite (dev convenience)

## Environment
Key settings are environment-driven. Create a `.env` (or export vars) before running:
```bash
DJANGO_SECRET_KEY=change-me
DEBUG=True
USE_SQLITE=1                 # Set to 0/False to enable Postgres
ALLOWED_HOSTS=localhost,127.0.0.1

# Postgres (if USE_SQLITE is false)
DB_ENGINE=django.db.backends.postgresql
DB_NAME=cems_restapi
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DB_CONN_MAX_AGE=60
```

## Setup
```bash
cd backend
python -m venv env
env\Scripts\activate  # or source env/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser  # optional, for admin access
python manage.py runserver
```

## Usage
- **Docs**: Swagger UI at `/api/schema/swagger-ui/`, Redoc at `/api/schema/redoc/`.
- **Auth**: JWT via SimpleJWT, enabled globally (`DEFAULT_AUTHENTICATION_CLASSES`).
- **Pagination**: DRF page-number pagination (default page size 20; endpoints accept `page_size` overrides).

## Tests
```bash
python manage.py test
```
(Add unit tests for new endpoints before merging to main.)

## Project structure (high level)
- `academics/` — student/teacher flows, exams, marks.
- `authentication/` — auth endpoints, permissions.
- `reference/` — reference data (academic years, etc.).
- `config/` — Django project, settings, URLs, WSGI/ASGI.

## Deployment tips
- Set `DEBUG=False` and a strong `DJANGO_SECRET_KEY`.
- Point database to PostgreSQL and run migrations.
- Configure static/media hosting (CDN or reverse proxy).
- Use a process manager (Gunicorn/Uvicorn) behind Nginx/Apache.

## License
MIT License (see repository root).
