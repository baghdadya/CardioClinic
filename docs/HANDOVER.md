# HANDOVER.md
## CardioClinic — Project State

**Version:** 0.2.0  
**Wave:** 1 (in progress)  
**Last Updated:** 2026-04-06  
**Author:** Ahmed + Claude  

---

## Project Summary

CardioClinic is a modern cardiology practice management system replacing a legacy VB6/Access application (DBHT.mdb) from 2001. Built for a single cardiologist practice in Egypt with supporting staff (nurses, receptionists).

---

## Current State

| Area | Status |
|------|--------|
| Architecture | Done |
| Data model | Done — 17 tables |
| Backend API | Done — 55 endpoints, 15 routers |
| Frontend pages | Partially broken — compile errors on several pages |
| Database migrations | Done — initial schema applied |
| Seed data | Done — 56 medications, 20 dosage instructions |
| Docker | Done — 3 containers (db, backend, frontend) |
| Testing | Not started |
| PWA/Offline | Scaffolded but not tested |
| Legacy import | Not started |

---

## Legacy App Reference

The original VB6/Access app ("Cardiac Clinic") has these screens that the new app must replicate:

### Menu Structure (from original app screenshots)
- **Program**: Exit, Make a Backup File, Properties
- **Patient**: Add Patient, Personal History, Present History, Past and Family History, Examination, Investigation, Follow Up, Medication, Instructions, Report
- **System**: Investigation File, Medicine File, Auto Text

### Key UI Patterns from Legacy
1. **Personal History** — Patient ID, Name, Age, Sex, Marital Status, Smoking, Address, Diagnosis, Date, Phone, Notes. Bottom grid shows patient list (ID, Name, Age, Sex, Marital Status, Smoking). Buttons: Menu, Search, New Pat, Save, Delete, Dial
2. **Present History** — Patient name dropdown, Chest Pain, Remark, Dyspnea (Exertional/PND/Orthopnea), Grade, Low Cardiac Output (Dizziness/Blurring/Fatigue), Right Sided Congestion (Lower Limb Oedema/Abdominal Swelling), Grade, Palpitations, Syncope, Neurological Symptoms, GIT/Urinary Tract/Chest/Neurology checkboxes, Remark. Bottom patient grid. Buttons: Menu, Search, Save
3. **Past and Family History** — DM/Hypertension/RHD checkboxes, Others, CABG, Valve Replacement, Comment. Family: +ve consanguinity/Hypertension/DM/IHD checkboxes
4. **Examination** — Name, Date, Pulse, BP, Weight/Height, BMI, Ideal Body Weight, Activity Level, Needed Calories, Remark. Right side: Head and Neck, Upper Limb, Lower Limb, Abdomen, Chest, Neurology. Cardiac: Apex/Elevated, S1/S2/S3/S4, Additional Sounds, Murmurs, Remark. Bottom grid: Date, Pulse, BP, Weight, Height, Remark. Buttons: Menu, Search, New, Save, Delete, Print
5. **Investigation** — Name, Date, ECG, LVEDD/LVESD/IVS/PWT/FS/AO (CM), LA (CM), Ao.valve/Mit.valve/Pulm.valve/Tric.valve, Stress Test, Cardiac Catheterization, Diagnosis, Remark. Lab list with Name/Quantity picker (Albumin, Creatinine, Uric acid, Na+, K+, etc.). Bottom grid: ID, Date, ECG, Diagnosis. Buttons: Menu, Search, New, Save, Delete, Print
6. **Medication** — Patient name, Date. Left: Medicine list (ABC Plus tab, Abimol, etc.). Instructions button + bilingual instructions list (English + Arabic). Right: Medicine/Dosage table. Buttons: Menu, Search, New, Save, Delete, Print
7. **Follow Up** — Name, Date, Complaint, Present History, Pulse, BP, Examination, Investigation, Diagnosis. Buttons: Menu, Search, New, Save, Delete

### Critical Difference from Current Build
The legacy app uses a **patient-centric** workflow: you select a patient, then navigate tabs across all their clinical data (Personal Hist, Present History, Past/Family, Examination, Investigation, Medication, Follow-Up). The new app's PatientDetailPage already has this tab structure in the backend and frontend — but the **add/edit forms are broken** (white page crashes).

---

## What's Working (v0.2.0)

| Page | Status | Notes |
|------|--------|-------|
| Login | Working | admin@admin.com / admin |
| Dashboard | Working | Stats, recent patients, quick actions |
| Appointments (view) | Working | Date filter, status filter |
| Medications catalog | Working | 56 drugs with Arabic names |
| Risk Calculators | Working | ASCVD, CHA2DS2-VASc, HEART Score |
| Drug Interactions | Working | Search + check (button greyed until 2+ meds selected) |
| Audit Log | Working | Shows 1 entry (patient creation) |

## What's Broken (v0.2.0)

| Page | Issue | Root Cause |
|------|-------|------------|
| Patients page | White screen | PatientsPage.tsx has import errors from added dialog code |
| Appointments (new) | White screen after save | Likely API error not caught |
| Users page | White screen | UsersPage.tsx has import/component errors |
| Add Patient dialog | Never appears | Broken page prevents rendering |
| Patient detail | Can't access | Patients page is broken |
| Clinical forms | Untested | Can't reach patient detail |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite + Tailwind v4 |
| UI | Custom components (Button, Card, Dialog, etc.) + Framer Motion |
| State | Zustand (auth store) |
| Backend | Python 3.12 + FastAPI + SQLAlchemy 2.0 (async) |
| Database | PostgreSQL 16 (Docker) |
| Auth | JWT access (15min) + refresh (7d), Argon2 hashing |
| PDF | WeasyPrint (bilingual prescriptions) |
| Email | Generic SMTP (async) |
| Containers | Docker Compose (db, backend, frontend) |

---

## Backend API Endpoints (55 total)

- **Auth** (4): register, login, refresh, me
- **Dashboard** (1): stats
- **Users** (4): list, create, update, soft-delete (doctor-only)
- **Patients** (5): CRUD + search
- **Present History** (4): CRUD per patient
- **Past/Family History** (2): get + upsert per patient
- **Examinations** (4): CRUD per patient
- **Investigations** (5): CRUD per patient + add labs
- **Follow-ups** (4): CRUD per patient
- **Medications master** (3): catalog CRUD
- **Patient medications** (3): per-patient CRUD
- **Prescriptions** (7): create, list, get, finalize, void, PDF, email
- **Appointments** (5): CRUD + filters + today summary
- **Risk calculators** (3): ASCVD, CHA2DS2-VASc, HEART
- **Drug interactions** (2): check, check-prescription
- **Audit log** (1): paginated viewer (doctor-only)
- **Health** (1): health check

---

## Frontend Pages (10 files)

| File | Route | Status |
|------|-------|--------|
| LoginPage.tsx | /login | Working |
| DashboardPage.tsx | / | Working |
| PatientsPage.tsx | /patients | BROKEN |
| PatientDetailPage.tsx | /patients/:id | Can't reach |
| AppointmentsPage.tsx | /appointments | Partially working |
| MedicationsPage.tsx | /medications | Working |
| AuditLogPage.tsx | /audit-log | Working |
| UsersPage.tsx | /users | BROKEN |
| RiskCalculatorsPage.tsx | /risk-calculators | Working |
| DrugInteractionsPage.tsx | /drug-interactions | Working |

---

## Database

- **17 tables** via Alembic migration
- **56 seeded medications** with Arabic names, interactions, contraindications
- **20 dosage instruction templates** (bilingual EN/AR)
- Seed script: `scripts/seed_medications.sql`

---

## Docker

```bash
# Start all services
docker compose up -d --build

# Run migrations
docker compose exec backend alembic upgrade head

# Seed medications
docker compose exec -T db psql -U cardioclinic -d cardioclinic < scripts/seed_medications.sql

# View logs
docker compose logs -f backend
docker compose logs -f frontend
```

**Ports:** PostgreSQL 5432, Backend 8000, Frontend 5173  
**Test login:** admin@admin.com / admin  
**API docs:** http://localhost:8000/api/docs

---

## Key Files

| File | Purpose |
|------|---------|
| docker-compose.yml | 3-service Docker setup |
| backend/app/main.py | FastAPI app with all router registrations |
| backend/app/core/deps.py | Auth dependencies (CurrentUser, DoctorOnly, etc.) |
| backend/app/core/security.py | JWT + Argon2 |
| frontend/src/App.tsx | React router with all routes |
| frontend/src/components/layout/Sidebar.tsx | Navigation sidebar |
| frontend/src/components/clinical/ClinicalForms.tsx | 7 clinical add/edit dialogs |
| frontend/src/services/api.ts | Axios client with JWT interceptor |
| frontend/src/stores/authStore.ts | Zustand auth + token refresh |
| scripts/seed_medications.sql | 56 medications + 20 dosage instructions |

---

## Immediate Next Steps

1. **Fix broken pages** — PatientsPage, UsersPage, Appointments new dialog crash
2. **Test clinical forms** — AddPresentHistory, EditPastFamily, AddExamination, AddInvestigation, AddMedication, AddPrescription, AddFollowUp dialogs
3. **Add medication management** — Allow adding new medications to catalog (not just seed data)
4. **Legacy data import** — Import from Access .mdb or CSV
5. **PWA testing** — Offline mode, service worker
6. **Test coverage** — pytest for backend

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| No legacy DB file | Medium | Low | CSV import fallback |
| Broken frontend pages | HIGH | HIGH | Fix import errors, add error boundaries |
| Drug interaction data | Medium | Medium | Seeded 56 drugs with interactions JSONB |
| Offline sync conflicts | Medium | Medium | Aggressive sync + human conflict resolution |

---

*Update this document at every session end or release.*
