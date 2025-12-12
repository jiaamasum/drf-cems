# CEMS – Classroom & Exam Management Suite

[![Python 3.11+](https://img.shields.io/badge/python-3.11%2B-3776AB?logo=python&logoColor=white)](#backend-api)
[![Django REST Framework](https://img.shields.io/badge/DRF-3.14-ff1709?logo=django&logoColor=white)](#backend-api)
[![React + Vite](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](#frontend)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#license)

Enterprise-style monorepo for the CEMS platform: a Django REST API paired with a React + Vite + Tailwind UI. It serves students and teachers with dashboards, exams, marks, and history tracking, all secured by JWT authentication.

## At a glance
- **Backend**: Django 4.2, DRF, SimpleJWT, PostgreSQL/SQLite toggle, Spectacular-powered docs.
- **Frontend**: React 19 with Vite, TypeScript, Tailwind, Radix UI primitives, React Router 7.
- **Security**: JWT auth, role-aware endpoints (student, teacher, admin).
- **Docs**: Auto-generated OpenAPI/Swagger/Redoc from the backend.

## Repository layout
- `backend/` — Django REST API (authentication, academics, reference apps).
- `frontend/` — Vite React client with Tailwind UI.

## Quick start

### Backend API
```bash
cd backend
python -m venv env
env\Scripts\activate  # or source env/bin/activate
pip install -r requirements.txt

# Configure env (examples below) then run
python manage.py migrate
python manage.py runserver
```
Open API docs at `http://localhost:8000/api/schema/swagger-ui/`.

Environment highlights:
```bash
set DJANGO_SECRET_KEY=change-me
set DEBUG=True
set USE_SQLITE=1           # set to 0/False to use Postgres
# Postgres fallback vars: DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local   # adjust API origin/prefix as needed
npm run dev
```
Vite dev server proxies API calls to the backend using `VITE_PROXY_API_TARGET`.

## Testing
- Backend: `python manage.py test`
- Frontend: (no tests defined) consider adding Vitest/React Testing Library before shipping.

## Deployment notes
- Use PostgreSQL in production (`USE_SQLITE` unset).
- Set strong `DJANGO_SECRET_KEY`, `DEBUG=False`, and tighten `ALLOWED_HOSTS`.
- Serve static assets via a CDN/reverse proxy; configure `STATIC_URL`/`MEDIA` as needed.
- Build the frontend with `npm run build`; serve `frontend/dist` behind your preferred web server.

## License
MIT License. You are free to use, modify, and distribute with attribution and without warranty.

