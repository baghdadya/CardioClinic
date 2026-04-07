# HANDOVER.md
## Maadi Clinic (CardioClinic) — Project State

**Version:** 0.9.0
**Last Updated:** 2026-04-07
**Author:** Ahmed + Claude

---

## Project Summary

Maadi Clinic is a modern cardiology practice management system replacing a legacy VB6/Access application (DBHT.mdb) from 2001. Built for Dr. Yasser M.K. Baghdady's practice in Maadi, Cairo, Egypt. The legacy database had 23,589 patients and 25+ years of clinical data (977,330 total records), all of which have been successfully imported.

The application is live at **https://app.maadiclinic.com** on a Hetzner Cloud CX22 server.

---

## Current State (v0.9.0 — 2026-04-07)

| Area | Status |
|------|--------|
| Architecture | Done |
| Data model | Done — 19 tables via 4 Alembic migrations |
| Backend API | Done — 65+ endpoints, 16 routers |
| Frontend pages | Done — 12 pages, all working |
| Database migrations | Done — 4 Alembic versions (initial, instructions, rxcui, admin role) |
| Legacy data import | Done — 977,330 records imported from DBHT.mdb |
| Medication enrichment | Done — 638 of 1,749 drugs mapped with generic names/categories |
| RBAC | Done — admin, doctor, nurse, receptionist with role-based nav |
| Docker (dev) | Done — 3 containers (db, backend, frontend) on localhost |
| Docker (prod) | Done — 4 containers on Hetzner (Claude GUI nginx + our 3) |
| HTTPS/SSL | Done — Let's Encrypt via Claude GUI nginx on app.maadiclinic.com |
| PWA/Offline | Done — service worker, offline page, sync queue, conflict resolution |
| Dual Theme | Done — classic sidebar + modern card hub, toggle button |
| Drug Interactions | Done — RxNorm sync from NLM |
| Medication Catalog | Done — FDA import, Egyptian brands sync, 300 SQL enrichment mappings |
| Prescriptions | Done — PDF generation, email, WhatsApp sharing |
| Audit Log | Done — with data restore, changed-fields-only diff view |
| Testing | Not started |
| Equipment Integration | Pending — questionnaire sent to Dr. Yasser |

---

## Production Server

| Item | Value |
|------|-------|
| Domain | https://app.maadiclinic.com |
| Provider | Hetzner Cloud |
| Plan | CX22 (2 vCPU, 4GB RAM, 40GB SSD, ~€3.29/mo) |
| OS | Ubuntu 24.04 LTS |
| IP | 23.88.105.81 |
| IPv6 | 2a01:4f8:1c1e:76a7::/64 |
| SSH User | root (password changed by user on first login) |
| App directory | /opt/maadi-clinic |
| Docker Compose file | docker-compose.prod.yml |
| Env file | /opt/maadi-clinic/.env (DOMAIN, DB_PASSWORD, SECRET_KEY) |
| SSL | Let's Encrypt via Claude GUI nginx container (maadi-clinic_nginx_1) |
| SSL nginx config | /opt/maadi-clinic/nginx.conf — proxies / to frontend:80, /api to backend:8000 |
| IMPORTANT | docker-compose.prod.yml frontend uses `expose: ["80"]` NOT `ports: ["80:80"]` — Claude GUI nginx owns the host ports |
| DB password note | After every pg_dump restore, must run: `ALTER USER cardioclinic PASSWORD '...'` and reset user passwords in UI |

### Production Deployment Steps

```bash
# SSH into server
ssh root@23.88.105.81

# Pull latest code
cd /opt/maadi-clinic && git pull

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build

# If needed: fix iptables after reboot
iptables -I DOCKER-USER -p tcp --dport 80 -j ACCEPT
```

### Production Database Restore

The production database was loaded from a local pg_dump. To re-import:

```bash
# From local machine: export local DB
docker compose exec -T db pg_dump -U cardioclinic --no-owner --no-acl cardioclinic > backup_full.sql
gzip backup_full.sql

# From local machine: upload to server
scp backup_full.sql.gz root@23.88.105.81:/tmp/

# On server: stop backend, drop/recreate DB, restore, restart
docker compose -f docker-compose.prod.yml stop backend
docker compose -f docker-compose.prod.yml exec -T db psql -U cardioclinic -d postgres -c "DROP DATABASE cardioclinic WITH (FORCE);"
docker compose -f docker-compose.prod.yml exec -T db psql -U cardioclinic -d postgres -c "CREATE DATABASE cardioclinic;"
gunzip -c /tmp/backup_full.sql.gz | docker exec -i maadi-clinic-db-1 psql -U cardioclinic -d cardioclinic
docker compose -f docker-compose.prod.yml start backend
```

---

## Login Credentials

| Environment | Email | Password | Role |
|---|---|---|---|
| Local (Docker) | admin@admin.com | admin | doctor (admin) |
| Production | admin@admin.com | admin | doctor (admin) |

The user renamed the doctor to "Dr. Yasser Baghdady" via User Management.

---

## Legacy Data Import

**Source:** DBHT.mdb (82MB, Jet 3.5 / Access 97 format, VB6-era)
**Location:** C:\Projects\CardioClinic\Source\DBHT.mdb
**Import script:** scripts/import_legacy.py
**Method:** access_parser library (reads binary .mdb format directly, no ODBC needed)

### Import Mapping

| Legacy Table | Rows | Destination Table | Notes |
|---|---|---|---|
| PersHt | 23,589 | patients | Name, age→DOB, sex, marital, phone, address, smoking, notes |
| PresntHt | 23,589 | present_history | Chest pain, dyspnea, palpitations, syncope, edema, etc. |
| PastHt | 23,589 | past_family_history | DM, hypertension, RHD, CABG, valve replacement, family history |
| Exam | 23,630 | examinations | Pulse, BP, weight, height, cardiac exam (S1-S4, apex, murmurs), head/neck/limb/abdomen/chest/neurology |
| ECG | 74,089 | investigations | Echo measurements (LVEDD, LVESD, IVS, PWT, FS, AO, LA), valve assessments, ECG, cardiac cath, diagnosis, X-ray |
| Invest | 666,649 | lab_results | Test name + value, linked to investigations via EID |
| FollowUp | 59,423 | follow_ups | Complaint, present history, pulse, BP, examination, investigation, diagnosis |
| dawa | 1,480 | medications_master | Drug names from legacy medication catalog |
| MasMidic | 84,558 | prescriptions | Prescription sessions (patient + date), linked to Medication table |
| Medication | 494,899 | prescription_items | Drug name + dosage instructions (Arabic), linked via MID to MasMidic |
| Tahl | 70 | investigation_types | Lab test type names + units |
| Write | 132 | dosage_instructions | Bilingual dosage instruction templates |

**Skipped tables:**
- FamHt — 0 rows (family data was in PastHt instead)
- Password — 1 row, just "125" (old VB6 login)
- MSysObjects — internal Access system table

### Import Script Usage

```bash
# Dry run (no database changes)
python scripts/import_legacy.py --mdb-path Source/DBHT.mdb --dry-run

# Real import against local Docker DB
python scripts/import_legacy.py --mdb-path Source/DBHT.mdb --db-url "postgresql://cardioclinic:cardioclinic@localhost:5432/cardioclinic"
```

### Known Import Behaviors
- Patient DOB is calculated from legacy "AGE" field (approximate: Jan 1 of birth year)
- Phone numbers truncated to 50 chars (legacy had multi-line phone entries)
- smoking_packs_day widened to Numeric(5,1) for legacy values > 99
- Medications auto-created during prescription import if drug name not in existing catalog
- Import is idempotent for patients (skips if legacy_id already exists)
- All records linked to the first admin user as the recording clinician

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS v4 |
| UI | Custom components + Framer Motion animations |
| State | Zustand (auth store, theme store) with persist middleware |
| Charts | Recharts (vitals trending) |
| Dates | date-fns |
| Offline | Dexie.js (IndexedDB) for sync queue |
| Backend | Python 3.12 + FastAPI + SQLAlchemy 2.0 (async) + Alembic |
| Database | PostgreSQL 16 (Docker) |
| Auth | JWT access (15min) + refresh (7d), Argon2 hashing |
| PDF | WeasyPrint (bilingual prescriptions) |
| Email | Generic SMTP (async, configurable) |
| Dev containers | Docker Compose — db, backend (uvicorn --reload), frontend (vite dev) |
| Prod containers | Docker Compose — db, backend (uvicorn 2 workers), frontend (nginx serving Vite build) |
| Prod frontend | Multi-stage Docker build: Node builds Vite, nginx serves static + proxies /api/ |

---

## Frontend Pages (12 files)

| File | Route | Description |
|------|-------|-------------|
| LoginPage.tsx | /login | Email + password login, version display |
| DashboardPage.tsx | / | Classic theme: stats + recent patients + quick actions |
| ModernDashboardPage.tsx | / | Modern theme: card hub with nav cards + stats row |
| PatientsPage.tsx | /patients | Paginated patient list (15/page), search, add patient dialog |
| PatientDetailPage.tsx | /patients/:id | Rich header with risk scores, 8 clinical tabs, edit/archive buttons |
| AppointmentsPage.tsx | /appointments | Calendar view, create/edit appointments |
| MedicationsPage.tsx | /medications | Catalog with search, add/edit, FDA import, bulk FDA import, Egyptian sync |
| InstructionsPage.tsx | /instructions | Patient instruction templates, bilingual editor, preview + print |
| RiskCalculatorsPage.tsx | /risk-calculators | Framingham ASCVD, CHA2DS2-VASc, HEART, HAS-BLED, Wells DVT/PE |
| DrugInteractionsPage.tsx | /drug-interactions | Multi-drug interaction checker, auto-check on 2+ meds, RxNorm sync |
| UsersPage.tsx | /users | User CRUD, role management, activate/deactivate/delete |
| AuditLogPage.tsx | /audit-log | Paginated log, entity type filter, restore with before/after diff |

### Patient Detail Tabs
1. **Overview** — Vitals at-a-glance cards with trend arrows, vitals trend chart (Recharts), clinical summary
2. **Present History** — Chest pain, dyspnea, palpitations, syncope, edema, neurological
3. **Past / Family** — DM, hypertension, RHD, CABG, valve replacement, family history
4. **Examinations** — Pulse, BP, weight/height/BMI, cardiac exam (S1-S4, apex, murmurs), body systems
5. **Investigations** — Echo measurements, ECG, cardiac cath, diagnosis, lab results
6. **Medications** — Current/past medications with start/end dates, dosage, frequency
7. **Prescriptions** — Create, finalize, void, PDF download, email, WhatsApp share
8. **Follow-ups** — Complaint, vitals, examination, investigation, diagnosis per visit

---

## Backend API Endpoints (65+ total)

- **Auth** (4): register, login, refresh, me
- **Dashboard** (1): stats summary
- **Users** (4): list, create, update, delete (doctor-only)
- **Patients** (5): list (paginated + search), create, get, update, soft-delete
- **Present History** (4): list, create, get, update per patient
- **Past/Family History** (2): get + upsert per patient
- **Examinations** (4): list, create, get, update per patient
- **Investigations** (5): list, create, get, update + add lab results per patient
- **Follow-ups** (4): list, create, get, update per patient
- **Medications master** (6): list, create, update + FDA bulk import + Egyptian sync + Egyptian status
- **Patient medications** (3): list, create, update per patient
- **Prescriptions** (7): create, list, get, finalize, void, generate PDF, send email
- **Appointments** (5): list, create, get, update, today summary
- **Risk calculators** (3): ASCVD, CHA2DS2-VASc, HEART score
- **Drug interactions** (3): check, check-prescription, sync (RxNorm) + sync-status
- **Patient instructions** (4): list, create, update, delete
- **Audit log** (2): paginated list + restore entry
- **Health** (1): health check with version

---

## Database Tables (19)

| Table | Records | Purpose |
|-------|---------|---------|
| patients | 23,591 | Core patient demographics |
| present_history | 23,589 | Cardiac symptoms |
| past_family_history | 23,589 | Medical/family history |
| examinations | 23,630 | Physical exam + cardiac |
| investigations | 74,089 | Echo, ECG, cath, imaging |
| lab_results | 666,649 | Lab test results |
| follow_ups | 59,423 | Follow-up visits |
| prescriptions | 81,090+ | Prescription sessions |
| prescription_items | 494,899+ | Drugs in each prescription |
| medications_master | 2,000+ | Drug catalog (legacy + FDA + Egyptian) |
| patient_medications | 0 | Active medication tracking |
| patient_instructions | 7 | Instruction templates |
| dosage_instructions | 132+ | Dosage text templates |
| investigation_types | 70 | Lab test type definitions |
| appointments | 0 | Appointment scheduling |
| audit_log | varies | All data changes |
| users | 1+ | Staff accounts |
| images | 0 | Medical image references |
| alembic_version | 1 | Migration tracking |

---

## Key Files

| File | Purpose |
|------|---------|
| docker-compose.yml | Dev Docker setup (3 services with hot reload) |
| docker-compose.prod.yml | Production Docker setup (nginx + uvicorn workers) |
| Caddyfile | Caddy reverse proxy config (reserved for HTTPS) |
| frontend/Dockerfile | Dev Dockerfile (vite dev server) |
| frontend/Dockerfile.prod | Production multi-stage build (vite build → nginx) |
| frontend/nginx.conf | Nginx config: serves static files + proxies /api/ to backend |
| frontend/src/version.ts | Single source of truth for app version — bump on every release |
| frontend/src/App.tsx | React router, theme-aware layout selection |
| frontend/src/stores/themeStore.ts | Zustand store for layout theme (classic/modern), persisted in localStorage |
| frontend/src/stores/authStore.ts | Zustand auth store with JWT token refresh |
| frontend/src/services/api.ts | Axios client with JWT interceptor + offline queue |
| frontend/src/services/sync.ts | Offline sync engine with pub/sub state |
| frontend/src/services/offlineDb.ts | Dexie IndexedDB for sync queue |
| frontend/src/components/clinical/ClinicalForms.tsx | 7 clinical add/edit dialogs |
| frontend/src/components/clinical/PrescriptionView.tsx | Prescription display + sharing |
| frontend/src/components/SyncConflictModal.tsx | 3-screen offline conflict resolution |
| frontend/src/components/SyncIndicator.tsx | Online/offline/syncing pill indicator |
| frontend/src/components/ThemeToggle.tsx | Classic ↔ Modern layout toggle button |
| backend/app/main.py | FastAPI app with 16 routers |
| backend/app/core/config.py | Pydantic settings (DB URL, JWT secret, SMTP, CORS) |
| backend/app/core/deps.py | Auth dependencies (CurrentUser, DoctorOnly, ClinicalStaff) |
| backend/app/core/security.py | JWT encode/decode + Argon2 password hashing |
| backend/app/data/egyptian_drugs.json | 180 Egyptian cardiac medication brands with Arabic names |
| backend/app/services/rxnorm_sync.py | RxNorm drug interaction sync from NLM |
| backend/app/services/pdf.py | WeasyPrint bilingual prescription PDF template |
| backend/app/services/email.py | Async SMTP email sending |
| backend/app/services/risk_calculators.py | Framingham, HEART, CHA2DS2-VASc, HAS-BLED, Wells |
| scripts/import_legacy.py | Legacy Access DB import (access_parser + psycopg2) |
| scripts/enrich_common_meds.sql | 300 brand→generic SQL mappings for Egyptian cardiology drugs |
| scripts/enrich_medications.py | OpenFDA API enrichment for remaining drugs |
| scripts/seed_medications.sql | 56 cardiology medications with Arabic names |
| scripts/seed_instructions.sql | 7 bilingual patient instruction templates |
| scripts/seed_egyptian_brands.sql | 42 Egyptian brand medications |

---

## Known Issues / Quirks

1. **DB restore overwrites passwords** — Every pg_dump restore resets production user passwords to local defaults (admin/admin). Must manually reset passwords in User Management after each restore. Also must run `ALTER USER cardioclinic PASSWORD '...'` to fix DB connection.
2. **Claude GUI nginx owns port 80/443** — docker-compose.prod.yml must use `expose: ["80"]` not `ports: ["80:80"]` for frontend. Claude GUI's nginx container (maadi-clinic_nginx_1) handles SSL and proxies to our containers.
3. **Patient DOB approximate** — Legacy data only stored age, not DOB. All imported patients have DOB of Jan 1 of calculated birth year.
4. **Prescription items** — Legacy prescriptions store drug name in both `dosage` and `instructions` fields since the legacy format didn't distinguish between medication name and dosage instructions clearly.
5. **Browser caching** — After deployments, users may need to open incognito or hard-refresh to see changes.
6. **1,111 medications still missing metadata** — 638 of 1,749 enriched. Remaining are Egyptian-specific brands not in FDA database. Can be manually edited or enriched with future Egyptian pharmacy API if one becomes available.
7. **crypto.randomUUID() fallback** — Replaced with Math.random for non-HTTPS contexts. Now on HTTPS so less critical, but fallback remains for safety.

---

## Bugs Fixed in Session (2026-04-07)

1. **Blank patient detail page** — `crypto.randomUUID()` crashes on HTTP. Fixed with Math.random fallback.
2. **All dialog save buttons not working** — Same root cause (toast component crash prevented success callback). Fixed.
3. **Audit log restore failing** — Dates/enums stored as strings couldn't write back to PostgreSQL. Added type coercion.
4. **Audit log showing all fields** — Restore modal now only shows changed fields with highlighting.
5. **Edit patient button did nothing** — Added full edit dialog with all patient fields.
6. **User edit dialog flicker/no close** — Was sending all unchanged fields. Fixed to only send diffs.
7. **FDA bulk import 500 error** — Drug names > 255 chars. Fixed with truncation.
8. **TypeScript build errors** — Unused imports, wrong variant types, Framer Motion ease tuples. All fixed.
9. **Medications page infinite loading** — Returning all 1,749 records with massive interactions JSONB. Fixed with pagination (50/page) and lightweight response model.
10. **Production port 80 conflict** — Claude GUI nginx already bound port 80. Removed host port binding from docker-compose.prod.yml.
11. **Production DB password mismatch** — After DB restore, password didn't match .env. Fixed with ALTER USER.
12. **Garbled medication entry** — Legacy encoding produced corrupted text. Renamed to "(Unknown)" and deactivated.

---

## Remaining Work / Roadmap

### v1.0 — Awaiting Dr. Yasser's Approval
- Dr. Yasser is testing v0.9.0 at https://app.maadiclinic.com
- Once approved, bump to v1.0

### Post-v1.0: Equipment Integration
- Questionnaire sent to Dr. Yasser about clinic equipment (echo, ECG, Holter, stress test, BP monitor)
- Priority: DICOM integration for echo machine (auto-import measurements)
- Also possible: HL7 FHIR, PDF/image upload, direct device APIs
- Build depends on specific equipment brands/models

### High Priority
1. **Email configuration** — Set up SMTP in .env for prescription email sharing
2. **Backup strategy** — Automated daily pg_dump to external storage
3. **Fix DB restore password issue** — Standardize credentials between local and production, or build post-restore password reset script
4. **Remaining medication enrichment** — 1,111 drugs still missing generic names. Manual editing or future Egyptian pharmacy API

### Medium Priority
5. **WhatsApp sharing** — Currently generates share link, needs testing with real numbers
6. **PWA testing** — Offline mode and sync conflict resolution need real-world testing
7. **Patient search improvements** — Search by phone, legacy ID, Arabic name
8. **Appointment scheduling** — Module exists but no legacy data; needs real usage testing
9. **Reporting** — Patient statistics, visit summaries, export to Excel

### Low Priority
10. **Testing** — pytest for backend, Playwright for frontend
11. **Mobile responsive polish** — Works on tablet, needs phone-specific testing
12. **Performance** — Patient detail loads all clinical data eagerly; could lazy-load tabs

---

*Update this document at every session end or release.*

