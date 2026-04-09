# CardioClinic (Maadi Clinic)

Modern cardiology practice management system replacing a legacy VB6/Access application (2001) for **Dr. Yasser M.K. Baghdady's** cardiology practice in Maadi, Cairo, Egypt. The legacy database (DBHT.mdb) contained 23,589 patients and 977,330 records across 25+ years — all successfully imported.

- **Live:** https://app.maadiclinic.com
- **Version:** 0.11.4 (approval candidate — awaiting Dr. Yasser's sign-off for v1.0)
- **GitHub:** https://github.com/baghdadya/CardioClinic (public, main branch)
- **Owner:** Ahmed (security architect, baghdadya GitHub account)

---

## Architecture & Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript 5.9, Vite 8, TailwindCSS 4, Zustand 5, Shadcn/ui |
| Backend | Python 3.12+, FastAPI 0.115, SQLAlchemy 2 (async), Pydantic 2 |
| Database | PostgreSQL 16 (asyncpg driver) |
| Offline | Dexie 4 (IndexedDB), custom sync queue with conflict resolution |
| Auth | JWT (HS256) via python-jose, Argon2 password hashing |
| PDF | WeasyPrint 63 (optional dependency) |
| Charts | Recharts 3 |
| Animations | Framer Motion 12 |
| Icons | Lucide React |
| HTTP | Axios (frontend), httpx (backend) |
| Migrations | Alembic |
| Containers | Docker Compose (dev + prod) |
| Reverse Proxy | Caddy (dev), external nginx (prod SSL) |

---

## Hosting & Production Server

| Detail | Value |
|--------|-------|
| Provider | Hetzner Cloud |
| Plan | CX22 (2 vCPU, 4 GB RAM, 40 GB SSD, ~EUR3.29/mo) |
| IP | 23.88.105.81 |
| OS | Ubuntu 24.04 LTS |
| Domain | app.maadiclinic.com |
| SSL | Let's Encrypt via Claude GUI nginx container |
| App directory | /opt/maadi-clinic |
| SSH | `ssh root@app.maadiclinic.com` |

### Container Layout (Production)

| Container | Role |
|-----------|------|
| maadi-clinic_nginx_1 | Claude GUI SSL termination (ports 80/443) |
| maadi-clinic-frontend-1 | nginx serving Vite build (expose 80, NOT ports) |
| maadi-clinic-backend-1 | Uvicorn, 2 workers, port 8000 |
| maadi-clinic-db-1 | PostgreSQL 16 with persistent volume |

**CRITICAL:** Frontend uses `expose: ["80"]` not `ports: ["80:80"]` — the Claude GUI nginx owns 80/443. Never bind port 80 in docker-compose.prod.yml.

### Deploy Workflow

```bash
# On server
cd /opt/maadi-clinic && git pull && docker compose -f docker-compose.prod.yml up -d --build
```

If there are new migrations:
```bash
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

### DB Restore Workflow

1. `pg_dump` locally, SCP to server
2. Stop backend container
3. `DROP DATABASE cardioclinic; CREATE DATABASE cardioclinic;`
4. `gunzip` and `psql` restore
5. `ALTER USER cardioclinic PASSWORD 'YFUgm5JdbjZuCt4YwZ8TB2f4ksYaQDqv';`
6. `docker compose -f docker-compose.prod.yml up -d`
7. **Reset passwords** — restore overwrites to local defaults (admin@admin.com / admin)

---

## Project Structure

```
CardioClinic/
├── backend/
│   ├── app/
│   │   ├── api/                # 16 FastAPI route modules
│   │   │   ├── auth.py         # Login, token refresh, /auth/me
│   │   │   ├── patients.py     # Patient CRUD + search + archive
│   │   │   ├── present_history.py
│   │   │   ├── past_family_history.py
│   │   │   ├── examinations.py
│   │   │   ├── investigations.py
│   │   │   ├── follow_ups.py
│   │   │   ├── medications.py  # CRUD + FDA lookup
│   │   │   ├── prescriptions.py
│   │   │   ├── appointments.py
│   │   │   ├── audit.py        # Audit log + restore endpoint
│   │   │   ├── calculators.py  # ASCVD, CHA2DS2-VASc
│   │   │   ├── interactions.py # Drug interaction checker + RxNorm sync
│   │   │   ├── instructions.py # Patient instruction templates
│   │   │   ├── dashboard.py    # Stats + recent activity
│   │   │   └── users.py        # User management + roles
│   │   ├── models/             # 21 SQLAlchemy models (UUID PKs, timestamps)
│   │   ├── schemas/            # 12 Pydantic request/response schemas
│   │   ├── services/           # Business logic (pdf.py, email.py, audit.py)
│   │   ├── static/prescription/ # PDF assets: 7 compressed JPEGs (~255KB total)
│   │   ├── core/
│   │   │   ├── config.py       # Pydantic Settings (env file)
│   │   │   ├── database.py     # Async engine + session factory
│   │   │   ├── security.py     # JWT + Argon2 password hashing
│   │   │   └── deps.py         # DI: CurrentUser, AdminOnly, DoctorOnly, ClinicalStaff, AnyStaff
│   │   └── data/
│   ├── alembic/                # 4 migrations
│   ├── tests/                  # Empty (pytest configured, not started)
│   ├── Dockerfile
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── pages/              # 13 pages
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx        # Classic sidebar layout
│   │   │   ├── ModernDashboardPage.tsx  # Card hub layout
│   │   │   ├── PatientsPage.tsx
│   │   │   ├── PatientDetailPage.tsx    # Full clinical record
│   │   │   ├── AppointmentsPage.tsx
│   │   │   ├── PrescriptionsPage.tsx
│   │   │   ├── MedicationsPage.tsx
│   │   │   ├── UsersPage.tsx
│   │   │   ├── AuditLogPage.tsx         # With restore capability
│   │   │   ├── RiskCalculatorsPage.tsx  # ASCVD + CHA2DS2-VASc
│   │   │   ├── DrugInteractionsPage.tsx
│   │   │   └── InstructionsPage.tsx     # Bilingual EN/AR templates
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── AppLayout.tsx        # Classic sidebar theme
│   │   │   │   ├── CardLayout.tsx       # Modern card hub theme
│   │   │   │   ├── ProtectedRoute.tsx   # Auth guard
│   │   │   │   └── Sidebar.tsx          # Role-based nav
│   │   │   ├── clinical/
│   │   │   │   ├── ClinicalForms.tsx    # All clinical entry forms
│   │   │   │   └── PrescriptionView.tsx # Prescription display + print
│   │   │   ├── ui/                      # 10 Shadcn components (badge, button, card, dialog, input, select, skeleton, table, textarea, toast)
│   │   │   ├── InstallPrompt.tsx        # PWA install banner
│   │   │   ├── SyncIndicator.tsx        # Online/offline/syncing badge
│   │   │   ├── SyncConflictModal.tsx    # Field-by-field diff + resolution
│   │   │   └── ThemeToggle.tsx          # Classic/modern switcher
│   │   ├── services/
│   │   │   ├── api.ts           # Axios + offline queue + token refresh
│   │   │   ├── offlineDb.ts     # Dexie IndexedDB (patients, appointments, syncQueue, syncLog)
│   │   │   ├── sync.ts          # Sync orchestration (5 retries, conflict detection)
│   │   │   └── syncService.ts   # Backward-compat shim
│   │   ├── stores/
│   │   │   ├── authStore.ts     # Zustand: login/logout/checkAuth
│   │   │   └── themeStore.ts    # Zustand + persist: classic/modern layout
│   │   ├── hooks/
│   │   │   ├── useOnlineStatus.ts
│   │   │   └── useSyncStatus.ts
│   │   ├── types/index.ts       # TypeScript interfaces
│   │   ├── version.ts           # APP_VERSION = "0.11.4" (single source of truth)
│   │   ├── App.tsx              # Router + conditional layout
│   │   └── main.tsx
│   ├── public/
│   ├── nginx.conf               # Prod: SPA fallback, API proxy, asset caching
│   ├── Dockerfile               # Dev
│   ├── Dockerfile.prod          # Prod (nginx + build)
│   └── package.json
├── docs/
│   ├── HANDOVER.md              # Full project state document
│   ├── CHANGELOG.md             # Version history (v0.1.0 → v0.9.0)
│   ├── DATA_MODEL.md            # Complete schema + relationships
│   └── PROJECT_CONTRACT.md      # Governing contract, locked decisions
├── scripts/
│   ├── import_legacy.py         # 1035-line legacy Access importer (idempotent)
│   ├── enrich_medications.py    # OpenFDA API enrichment script
│   ├── enrich_common_meds.sql   # SQL-based medication enrichment
│   ├── seed_medications.sql     # 48 cardiology drugs with interactions JSONB
│   ├── seed_egyptian_brands.sql # 42 Egyptian brand name mappings
│   ├── seed_instructions.sql    # 7 bilingual patient instruction templates
│   ├── setup-server.sh          # Hetzner server provisioning script
│   └── legacy_import.py         # Stub for future multi-source import
├── Source/                      # Legacy VB6 app
│   ├── DBHT.mdb                 # 85MB Access database (Jet 3.5)
│   ├── DBHT_Empty.mdb           # Empty schema reference
│   ├── Cardiac.CAB              # Original app archive
│   ├── setup.exe                # Original installer
│   ├── rh.rpt, rhb.rpt         # Crystal Reports templates
│   ├── Prescriptions/           # Legacy prescription files
│   └── WhatsApp images/         # 11 VB6 app screenshots
├── docker-compose.yml           # Dev: db(5432) + backend(8000) + frontend(5173)
├── docker-compose.prod.yml      # Prod: db + backend(2 workers) + frontend(expose 80)
├── Caddyfile                    # Dev reverse proxy (:80 → frontend)
└── CLAUDE.md                    # This file
```

---

## Database Schema (19 tables, 4 Alembic migrations)

### Migration History

| # | Revision | Description |
|---|----------|-------------|
| 1 | 99701a023683 | Initial schema (all core tables) |
| 2 | d5d4ac8859ba | Add patient_instructions table |
| 3 | a3f7c1e92d01 | Add rxcui + interactions_synced_at to medications_master |
| 4 | b8e2f4a1c3d5 | Add admin role, expand phone/smoking fields |

### Core Tables

| Table | Records | Key Fields |
|-------|---------|------------|
| patients | 23,591 | legacy_id, full_name/full_name_ar, dob, sex, marital_status, phone(50), smoking, deleted_at (soft delete) |
| present_history | — | chest_pain(enum), dyspnea (exertional/PND/orthopnea/grade), palpitations, syncope, edema, cardiac output symptoms |
| past_family_history | — | patient_id(unique), diabetes, HTN, RHD, IHD, CABG, valve_replacement, family consanguinity/HTN/DM/IHD |
| examinations | — | vitals (pulse/BP/weight/height → computed BMI), body exam (head/neck/limbs/abdomen/chest/neuro), cardiac (apex/S1-S4/murmurs) |
| investigations | — | ECG, stress test, cardiac cath, echo measurements (LVEDD/LVESD/IVS/PWT/FS/EF/AO/LA), valve assessments, diagnosis |
| lab_results | 666,649 | investigation_id(FK), test_name, value, unit, reference_range, is_abnormal |
| follow_ups | — | visit_date, complaint, present_history, vitals, examination, investigation, diagnosis, plan, next_follow_up |
| medications_master | 1,749 | name/name_ar, generic_name, category, default_dosage, contraindications, interactions(JSONB), rxcui, interactions_synced_at |
| prescriptions | — | patient_id, prescribed_by, status(draft/finalized/voided), pdf_path |
| prescription_items | 494,899 | medication_id, dosage, frequency, duration, instructions_en/ar, sort_order |
| patient_medications | — | patient_id, medication_id, dosage, frequency, started_at, ended_at, reason_stopped |
| appointments | — | patient_id, scheduled_at, duration, type(new/follow_up/procedure/telemedicine), status(6 states) |
| users | — | email(unique), password_hash(Argon2), full_name, role(admin/doctor/nurse/receptionist), is_active |
| audit_log | — | user_id, action(create/update/delete/login/logout/export/restore), entity_type/id, old_values/new_values(JSONB), ip, user_agent |
| dosage_instructions | — | text_en/ar, sort_order, is_active |
| investigation_types | — | name, category(lab/imaging/procedure), unit, reference_range |
| images | — | patient_id, investigation_id, image_type(xray/echo/ecg/ct/mri/other), file_path, dicom_study_uid |
| patient_instructions | — | title_en/ar, content_en/ar, category, is_active, sort_order |
| alembic_version | — | Migration tracking |

### Design Patterns

- **UUID primary keys** (gen_random_uuid)
- **Soft deletes** on patients (deleted_at field)
- **Bilingual fields** (English + Arabic) on patient-facing data
- **JSONB** for medication interactions and audit old/new values
- **TimestampMixin** (created_at, updated_at with timezone) on all models
- **Foreign keys** with proper indexing, legacy_id preserved from import

---

## Authentication & Authorization

| Setting | Value |
|---------|-------|
| Algorithm | HS256 |
| Access token | 15 minutes |
| Refresh token | 7 days |
| Password hashing | Argon2 |
| Token storage | localStorage (access_token, refresh_token) |

### Role-Based Access Control

| Role | Scope |
|------|-------|
| admin | Full access everywhere (Ahmed) |
| doctor | Full clinical access (Dr. Yasser) |
| nurse | Clinical data only |
| receptionist | Appointments and patient demographics only |

### Dependency Shortcuts (backend/app/core/deps.py)

- `CurrentUser` — any authenticated user
- `AdminOnly` — admin
- `DoctorOnly` — admin + doctor
- `ClinicalStaff` — admin + doctor + nurse
- `AnyStaff` — all roles

---

## Frontend Routes

| Path | Page | Notes |
|------|------|-------|
| /login | LoginPage | Animated mesh background |
| / | DashboardPage or ModernDashboardPage | Conditional on theme store |
| /patients | PatientsPage | Search, paginated, create/edit |
| /patients/:id | PatientDetailPage | Full clinical record, vital charts |
| /appointments | AppointmentsPage | Schedule, status tracking |
| /prescriptions | PrescriptionsPage | Standalone Rx list, create, print blank |
| /medications | MedicationsPage | Drug catalog, FDA lookup |
| /audit-log | AuditLogPage | Diff view, restore button |
| /users | UsersPage | Role management, password reset |
| /risk-calculators | RiskCalculatorsPage | ASCVD + CHA2DS2-VASc |
| /drug-interactions | DrugInteractionsPage | Multi-drug interaction check |
| /instructions | InstructionsPage | Bilingual templates, print |

All routes except /login wrapped in `ProtectedRoute` (checks JWT).

---

## API Endpoints

All under `/api/`. 65+ endpoints across 16 routers:

- **Auth:** POST login, POST refresh, GET /auth/me, POST logout
- **Patients:** CRUD + search + archive (soft delete)
- **Clinical records:** present-history, past-family-history, examinations, investigations, follow-ups (all CRUD per patient)
- **Medications:** CRUD + FDA lookup integration
- **Prescriptions:** CRUD + items + PDF generation + email/WhatsApp sharing + blank prescription printing
- **Appointments:** CRUD + status transitions
- **Audit:** GET log (paginated) + POST /audit/{id}/restore (doctor-only)
- **Calculators:** POST ASCVD, POST CHA2DS2-VASc
- **Interactions:** POST check, POST /interactions/sync (RxNorm API)
- **Instructions:** CRUD for bilingual templates + PDF generation on letterhead + email with PDF attachment
- **Dashboard:** GET stats (today's appointments, total patients, pending prescriptions, active meds)
- **Users:** CRUD + role assignment + password management
- **Health:** GET /api/health → { status, version }
- **Docs:** GET /api/docs (Swagger), GET /api/openapi.json

---

## Offline-First Architecture

1. **Write queueing:** All POST/PATCH/PUT/DELETE queued to IndexedDB (Dexie) when offline
2. **Sync queue:** Items tracked with status (pending/syncing/synced/conflict/failed), retry count (max 5)
3. **Conflict detection:** Server returns 409 on version mismatch, server data stored for comparison
4. **Conflict resolution:** SyncConflictModal shows field-by-field diff, user chooses "Keep Local" (X-Force-Overwrite header) or "Keep Server" — never auto-resolved
5. **Visual indicators:** SyncIndicator badge (emerald=online, amber=offline, blue=syncing, rose=conflicts)
6. **Token refresh:** Auto-retry on 401, clears tokens on refresh failure
7. **PWA:** InstallPrompt component, service worker support

---

## Prescription PDF System

**Generator:** `backend/app/services/pdf.py` using WeasyPrint (installed in Docker via `apt` system libs + `pip install .[pdf]`)

**Assets:** `backend/app/static/prescription/` — 7 compressed JPEGs extracted from `Source/Prescriptions/prescription_template_reduced.pdf` (~255KB total):
- `background.jpg` (139KB) — cream paper texture, full-page
- `watermark.jpg` (52KB) — Union of Medical Professions, center, 10% opacity
- `arabesque1.jpg` (12KB) — mandala, right side top + bottom, 35% opacity
- `arabesque2.jpg` (12KB) — circular, right side middle, 35% opacity
- `stamp.jpg` (9KB) — Egyptian medical stamp, bottom-left corner
- `cairo_cardio.jpg` (9KB) — Cairo Uni Cardiology, bottom-right corner
- `logo.png` (109KB) — Maadi Clinic logo, transparent background, header center, 55mm wide

**Layout rules:**
- Single page always (never overflow to page 2)
- `@page { margin: 0 }` — full bleed, content padded via `.content` div
- Footer pinned to bottom via `position: fixed; bottom: 0`
- Header separator (2px green) + patient info separator (2px green, identical)
- 3 arabesques on right side below patient separator
- Stamp + Cairo Cardio large at bottom corners, footer text centered between them
- Logo uses transparent PNG + `mix-blend-mode: multiply` for seamless blend
- Generated PDFs stored in `uploads/prescriptions/` (~365KB each)

**Sharing:**
- **WhatsApp:** Web Share API shares actual PDF file (mobile), downloads PDF as fallback (desktop)
- **Email:** SMTP with PDF attachment, auto-generates if not yet created. Requires SMTP config in backend/.env
- **Download:** Direct PDF download via browser
- **Print Blank:** Generates letterhead-only PDF for handwriting

---

## Dual Theme System

| Theme | Layout | Navigation |
|-------|--------|-----------|
| Classic | AppLayout with vertical Sidebar | Sidebar links |
| Modern | CardLayout with card-based hub | Pill/chip nav at top, back button |

Stored in Zustand with `persist` middleware (localStorage key: `cardioclinic-theme-layout`). Default: modern. Toggle via ThemeToggle component.

---

## Legacy Data Import

**Source:** DBHT.mdb (85 MB, Jet 3.5/Access 97, cp1256 encoding)

**Script:** scripts/import_legacy.py (1,035 lines, idempotent for patients via legacy_id check)

| Legacy Table | Target Table | Records |
|-------------|-------------|---------|
| PersHt | patients | 23,589 |
| PresntHt | present_history | — |
| PastHt | past_family_history | — |
| Exam | examinations | — |
| ECG | investigations | — |
| Invest | lab_results | 666,649 |
| FollowUp | follow_ups | — |
| dawa | medications_master | 1,749 |
| MasMidic + Medication | prescriptions + items | 494,899 items |
| Tahl | investigation_types | — |
| Write | dosage_instructions | — |

**Total: 977,330 records imported.** Import runs locally, then pg_dump → SCP → restore on server.

---

## Medication Catalog

- **Total drugs:** 1,749 (imported from legacy)
- **Enriched:** 638 with generic names, categories, RXCUI codes
- **Sources:** OpenFDA API (scripts/enrich_medications.py), manual SQL (scripts/enrich_common_meds.sql)
- **Egyptian brands:** 42 mapped (scripts/seed_egyptian_brands.sql)
- **Seed data:** 48 cardiology drugs with full interaction JSONB (scripts/seed_medications.sql)
- **Interactions:** RxNorm API sync (re-runnable, not one-time)
- **Remaining:** 1,111 drugs still missing metadata

---

## Version History

| Version | Date | Highlights |
|---------|------|-----------|
| v0.1.0 | 2026-04-05 | Initial architecture (React 19, FastAPI, PostgreSQL, Docker) |
| v0.2.0 | 2026-04-06 | Dashboard stats, user management, medications catalog, risk calculators, clinical record dialogs |
| v0.5.0 | 2026-04-06 | PWA, modern dashboard, sync conflict resolution, risk calculators, audit logging |
| v0.6.7 | 2026-04-07 | Fixed FDA bulk import truncation, drug interactions array handling |
| v0.6.8 | 2026-04-07 | Egyptian drug sync, RxNorm integration |
| v0.6.9 | 2026-04-07 | Audit log restore with type coercion, full practice management system |
| v0.7.0 | 2026-04-07 | Legacy data import complete (977,330 records), patient archive feature |
| v0.7.1 | 2026-04-07 | Fix blank patient page (crypto.randomUUID()), fix dialog save buttons, audit log restore |
| v0.7.2 | 2026-04-07 | Add password reset in user management |
| v0.8.0 | 2026-04-07 | Role-based access control, admin role, email/password management |
| v0.8.1 | 2026-04-07 | Fix medications page pagination (was returning all 1,749 with full JSONB) |
| v0.9.0 | 2026-04-07 | Medication catalog enrichment (638 drugs mapped via OpenFDA + SQL) |
| v0.10.0 | 2026-04-08 | Prescription system: PDF generation matching real letterhead, standalone /prescriptions page, blank prescription printing, medication name resolution, WhatsApp/email sharing |
| v0.10.1 | 2026-04-08 | UI polish: real Maadi Clinic logo (login + header + favicon), settings gear for admin pages, centered dashboard card layout, branding update |
| v0.10.2 | 2026-04-08 | PDF fix: background texture, watermark, arabesques, footer pinning. Medication dropdown raised to 2000 limit |
| v0.10.3 | 2026-04-08 | PDF layout rewrite: position:fixed footer, full-bleed background, table-based header |
| v0.10.4 | 2026-04-08 | PDF template pixel-matched to original: compressed assets (14MB→255KB), 3 arabesques, large stamp/cairo emblems, large centered logo, removed unauthorized system note |
| v0.10.5 | 2026-04-08 | PDF: transparent logo blend (mix-blend-mode), bigger watermark aligned to middle arabesque, slightly larger arabesques |
| v0.10.6 | 2026-04-08 | PDF: logo 55mm, watermark nudged down for precise middle-arabesque alignment |
| v0.11.0 | 2026-04-08 | PDF: header sep tighter, patient-info separator after Date, arabesques below patient info. WhatsApp shares actual PDF file (Web Share API), email auto-generates PDF |
| v0.11.1 | 2026-04-08 | PDF: patient separator now matches header (2px green). Email endpoint accepts email_override from dialog, clear error when SMTP not configured |
| v0.11.2 | 2026-04-09 | Instruction PDF on clinic letterhead (no patient info). Download PDF button in instruction preview |
| v0.11.3 | 2026-04-09 | SMTP configured (Gmail: maadiclinic.noreply@gmail.com). WhatsApp + Email buttons on instruction preview. Fix prescriptions blank page (useEffect rewrite) |
| v0.11.4 | 2026-04-09 | Prescriptions page lazy-loaded (Suspense) to fix SPA blank page. Pill nav label "Rx" → "Prescriptions". Instruction email endpoint with PDF attachment |

---

## Bugs Fixed (Complete List)

1. **Blank patient detail page** — `crypto.randomUUID()` not available in non-secure contexts; added Math.random fallback
2. **Dialog save buttons not working** — Event handler binding issue in clinical form dialogs
3. **Audit log restore failing** — Type coercion needed when restoring JSONB old_values back to typed columns
4. **Audit restore modal showing all fields** — Changed to only show fields that actually changed (diff view)
5. **FDA drug name truncation** — Bulk import was truncating long drug names from OpenFDA API
6. **Drug interactions array handling** — Interactions JSONB was not properly parsed as array in some endpoints
7. **User edit dialog issues** — Form pre-population and save not working correctly
8. **Patient detail edit + archive** — Edit and soft-delete (archive) buttons not functional
9. **User management enhancements** — Delete user, role assignment issues
10. **Medications page performance** — Returning all 1,749 records with full interactions JSONB; fixed with pagination + lightweight response
11. **Port 80 conflict** — docker-compose.prod.yml was binding port 80, conflicting with Claude GUI nginx; changed to expose
12. **TypeScript build errors** — Various TS compilation issues blocking production build
13. **Garbled medication entries** — Legacy import encoding issue (cp1256) producing garbled Arabic text in some medication names

---

## Known Issues / Remaining Work

### Known Issues
- **DB restore overwrites passwords** — After every pg_dump restore, must manually reset passwords (defaults to admin@admin.com / admin)
- **Patient DOB approximate** — Legacy data had imprecise dates; some DOBs are approximations
- **1,111 medications missing metadata** — Generic names/categories not yet mapped
- **crypto.randomUUID() fallback** — Using Math.random fallback in non-secure contexts (HTTP dev)
- **Drug interactions UX** — Greyed-out "Check Interactions" button with no guidance text; needs "add 2+ medications" hint or auto-check
- **No automated tests** — pytest and framework configured but zero tests written
- **No CI/CD** — Manual git pull deploy, no GitHub Actions
- **Prescriptions page blank on first nav** — SPA navigation to /prescriptions sometimes renders blank; works on F5 refresh. Lazy-loaded with Suspense in v0.11.4 as attempted fix — needs verification. If still broken, may need error boundary or component restructuring.

### Awaiting
- **Dr. Yasser's v1.0 approval** — v0.11.4 is the approval candidate
- **Equipment list from Dr. Yasser** — Questionnaire sent about echo, ECG, Holter, etc.
- **Standard admin credentials** — Need permanent login credentials (not admin/admin)

### Completed (v0.10–v0.11)
- **Prescription PDF** — WeasyPrint generates prescription PDFs matching the original letterhead exactly. Compressed JPEG assets (~255KB total, PDFs ~365KB). Template source of truth: `Source/Prescriptions/prescription_template_reduced.pdf`
- **Instruction PDF** — Same clinic letterhead as prescriptions, no patient info. Fixed bilingual templates for any patient. Download PDF, WhatsApp, Email buttons in preview dialog.
- **WhatsApp sharing** — Shares actual PDF file via Web Share API (mobile), downloads PDF as fallback (desktop). Works for both prescriptions and instructions.
- **Email sharing** — SMTP configured via Gmail (`maadiclinic.noreply@gmail.com`, app password). Sends PDF attachments. Works for both prescriptions and instructions. Backend auto-generates PDF if not already created.
- **SMTP setup** — Gmail SMTP (`smtp.gmail.com:587`), app password auth. Env vars in docker-compose.yml and docker-compose.prod.yml. Domain maadiclinic.com MX still points to M365 (unused, from incomplete GoDaddy setup). Can migrate to M365 later.
- **Branding** — Real Maadi Clinic logo on login page, header, favicon. Browser tab says "Maadi Clinic". PWA manifest updated.
- **Settings gear** — User Management + Audit Log moved behind settings gear dropdown in modern theme header (freeing dashboard for 4-per-row cards)
- **Medication dropdown** — Backend limit raised from 200 to 2000, both PrescriptionsPage and ClinicalForms fetch all 1,749 meds

### Planned (Post v1.0)
- **Equipment integration** — DICOM (echo/imaging), HL7 FHIR, PDF upload fallback
- **Full offline sync** — Service worker, per-record conflict resolution with diff view
- **Mobile/tablet responsive** — Verify all screen sizes
- **Automated testing** — pytest-asyncio for backend, Vitest for frontend

---

## Development

```bash
docker compose up              # PostgreSQL (5432) + backend (8000) + frontend (5173)
```

Frontend proxies `/api` → `http://localhost:8000` via Vite config. Path alias `@/` → `src/`.

### Environment Variables

Backend reads from environment variables (set in docker-compose files):
- `DATABASE_URL` — PostgreSQL async connection string
- `SECRET_KEY` — JWT signing key
- `DEBUG` — SQLAlchemy echo mode
- `CORS_ORIGINS` — Allowed origins list (prod only)
- `SMTP_HOST` — `smtp.gmail.com`
- `SMTP_PORT` — `587`
- `SMTP_USER` — `maadiclinic.noreply@gmail.com`
- `SMTP_PASSWORD` — Gmail app password (in docker-compose files, not .env)
- `SMTP_FROM_EMAIL` — `maadiclinic.noreply@gmail.com`
- `SMTP_FROM_NAME` — `Maadi Clinic`
- `SMTP_USE_TLS` — `true`

Production also uses shell env vars: `DB_PASSWORD`, `SECRET_KEY`, `DOMAIN`.

---

## Governing Rules (from PROJECT_CONTRACT.md)

### Locked Architectural Decisions
- Frontend: React + TypeScript
- UI: Tailwind + Shadcn/ui
- State: Zustand
- Backend: Python 3.12 + FastAPI
- DB: PostgreSQL 16
- Auth: JWT + refresh tokens
- PDF: WeasyPrint
- Delivery: PWA

### Data Invariants
1. Patient ID immutable after creation
2. Audit log entries immutable (append-only)
3. Prescription items tied to valid medication
4. No hard deletes on clinical data (soft delete only)
5. All clinical mutations audit-logged
6. Bilingual support on patient-facing fields
7. UTC timestamps everywhere

### Prohibited Actions
1. No main branch commits without approval
2. No data deletion (soft deletes only)
3. No audit logging disable
4. No dependency additions without justification
5. No schema changes without migration
6. No security downgrades
7. No removal of bilingual support
8. No breaking API changes without versioning
9. **NEVER load/read/generate files above 1 MB** without Ahmed's explicit authorization — this includes PDFs, images, database dumps, logs, etc. Large files in context will crash the session.

---

## Working Guidelines

- **Don't ask to proceed** — keep building until done. Only pause for confirmation gates in PROJECT_CONTRACT (schema changes, new deps, auth changes, destructive ops).
- **Do work locally** — keep SSH commands to short one-liners; never use heredoc on server.
- **Test in browser** — HTTP 200 and TypeScript compiling does NOT mean the page works. Check for React runtime errors (white screens).
- **World-class standard** — Don't just clone legacy. Match/exceed Epic Cardiology, Cerner, eClinicalWorks. Add clinical decision support, smart prescribing, trending/charting.
- **Study legacy first** — Read VB6 screenshots in Source/ before building any clinical feature.
- **Version bump every release** — Update version.ts (source of truth), package.json, pyproject.toml together. Semver: patch=fix, minor=feature, major=breaking.
- **Medication syncs re-runnable** — FDA + Egyptian syncs use ON CONFLICT DO UPDATE, show "Last synced" timestamp, idempotent.
- **Audit restore** — POST /api/audit/{id}/restore creates new audit entry (restore is audited). Doctor-only.
- **Sync conflicts** — Human decides, never auto-resolve, field-by-field diff, per-record resolution.
