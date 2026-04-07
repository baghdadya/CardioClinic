# CHANGELOG.md
## CardioClinic

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).  
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.2.0] - 2026-04-06

### Added
- Dashboard stats API endpoint (GET /api/dashboard/stats)
- User management API (GET/POST/PATCH/DELETE /api/users) — doctor-only
- Medications catalog page (frontend) — 56 drugs with Arabic names, search
- Audit log page (frontend) — paginated, filterable
- Risk calculators page (frontend) — ASCVD, CHA2DS2-VASc, HEART Score
- Drug interactions page (frontend) — search medications, check interactions
- Users management page (frontend) — BROKEN, white screen
- Add Patient dialog on PatientsPage — BROKEN, white screen
- 7 clinical record dialogs (ClinicalForms.tsx) — Add Present History, Edit Past/Family, Add Examination, Add Investigation, Add Follow-up, Add Medication, Add Prescription
- Sidebar navigation expanded: Risk Calculators, Drug Interactions, User Management
- Version indicator (v0.2.0) on login page and sidebar
- Seed data: 56 cardiology medications with Arabic names, interactions, contraindications (scripts/seed_medications.sql)
- Seed data: 20 dosage instruction templates (bilingual EN/AR)

### Fixed
- Docker proxy: frontend Vite proxy now correctly routes /api to backend container
- Missing email-validator dependency (pydantic[email])
- PYTHONPATH in backend Dockerfile for Alembic
- Initial Alembic migration generated and applied (17 tables)

### Known Issues
- PatientsPage crashes to white screen (import errors from dialog code)
- UsersPage crashes to white screen (component errors)
- Appointment creation dialog crashes after save
- Clinical form dialogs untested (can't reach patient detail)
- Appointment dialog asks for raw UUID instead of patient name search

---

## [0.1.0] - 2026-04-05

### Added
- PROJECT_CONTRACT.md — architectural decisions and guardrails
- DATA_MODEL.md — complete PostgreSQL schema (17 tables)
- NEW_SESSION_PROMPT.md — Claude Code bootstrap document
- HANDOVER.md — project state tracking
- All 17 SQLAlchemy models
- Backend: 53 API endpoints across 13 routers
- Frontend: 10 UI components, 3 layouts, 5 pages (Login, Dashboard, Patients, Patient Detail, Appointments)
- Auth: Argon2 + JWT access/refresh tokens
- PDF generation (WeasyPrint, bilingual prescriptions)
- Email service (SMTP, async, bilingual)
- Risk calculators (ASCVD, CHA2DS2-VASc, HEART)
- Drug interaction checking
- Audit logging on all CRUD operations
- PWA manifest + service worker scaffolding
- Docker Compose setup (PostgreSQL 16, FastAPI, Vite)

### Technical Decisions
- Frontend: React 19 + TypeScript + Vite + Tailwind v4
- Backend: Python 3.12 + FastAPI + SQLAlchemy 2.0
- Database: PostgreSQL 16
- Auth: JWT with access/refresh tokens, Argon2 hashing

---

*Version numbers must match across: frontend/package.json, backend/pyproject.toml, HANDOVER.md*
