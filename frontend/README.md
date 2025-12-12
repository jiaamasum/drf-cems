# Frontend — React + Vite + Tailwind

[![React 19](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](../README.md#license)

Modern dashboard UI for students and teachers, featuring class and exam browsing, mark entry, and history views. Built with Vite, TypeScript, Tailwind, and React Router 7.

## Requirements
- Node.js 18+ and npm

## Environment
Copy the sample env and adjust API settings:
```bash
cd frontend
cp .env.example .env.local
# Defaults:
# VITE_API_ORIGIN=same-origin
# VITE_API_PATH_PREFIX=/api
# VITE_PROXY_API_TARGET=http://127.0.0.1:8000
# VITE_ADMIN_PATH=/admin/
```
During `npm run dev`, Vite proxies `/api` calls to `VITE_PROXY_API_TARGET`.

## Setup & scripts
```bash
npm install
npm run dev      # start dev server
npm run build    # type-check + production build to dist/
npm run preview  # preview the built app
```

## Project structure (high level)
- `src/pages/` — Student and Teacher dashboards, routing.
- `src/components/` — UI primitives and shared layout (cards, tables, metrics, sidebar/topbar).
- `src/services/` — API clients (fetch wrappers for student/teacher endpoints).
- `public/` — static assets injected by Vite.

## Styling & UX
- Tailwind utility classes plus custom design tokens (see `tailwind.config.js`).
- Radix UI + Lucide icons for accessible components.
- Responsive layout with dashboard shell components.

## Testing
No tests are defined yet; add Vitest/React Testing Library before shipping critical UI changes.

## License
MIT License (see repository root).
