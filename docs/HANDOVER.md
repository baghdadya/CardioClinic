# HANDOVER.md
## Maadi Clinic (CardioClinic) — Project State

**Version:** 0.11.7
**Last Updated:** 2026-04-09
**Author:** Ahmed + Claude

---

## Project Summary

Maadi Clinic is a modern cardiology practice management system replacing a legacy VB6/Access application (DBHT.mdb) from 2001. Built for Dr. Yasser M.K. Baghdady's practice in Maadi, Cairo, Egypt. The legacy database had 23,589 patients and 25+ years of clinical data (977,330 total records), all of which have been successfully imported.

The application is live at **https://app.maadiclinic.com** on a Hetzner Cloud CX22 server.

---

## Current State (v0.11.7 — 2026-04-09)

| Area | Status |
|------|--------|
| Architecture | Done |
| Data model | Done — 19 tables via 4 Alembic migrations |
| Backend API | Done — 65+ endpoints, 16 routers |
| Frontend pages | Done — 13 pages, all working |
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
| Prescription PDF | Done — WeasyPrint, pixel-matched to real letterhead (~365KB) |
| Instruction PDF | Done — same letterhead, no patient info, bilingual |
| WhatsApp sharing | Done — Web Share API sends actual PDF file |
| Email sharing | Done — Gmail SMTP, PDF attachment |
| Branding | Done — real Maadi Clinic logo, favicon, browser tab, PWA manifest |
| Audit Log | Done — with data restore, changed-fields-only diff view |
| Testing | Not started |
| Equipment Integration | Pending — questionnaire sent to Dr. Yasser |

---

## How to Run Locally (Development)

### Prerequisites
- Docker Desktop installed and running
- Git

### Start
```bash
cd C:\Projects\CardioClinic
docker compose up
```
This starts:
- PostgreSQL on port 5432
- Backend (FastAPI + uvicorn --reload) on port 8000
- Frontend (Vite dev server) on port 5173

Open http://localhost:5173

### Login Credentials (Local)
| Email | Password | Role |
|---|---|---|
| admin@admin.com | admin | admin |
| Yasser@baghdady.org | Yasser123! | doctor |

**Note:** After any DB restore, passwords reset to defaults. Must change in User Management.

### Stop
```bash
docker compose down
```

### Shut Down Docker Desktop
Right-click Docker whale icon in system tray → "Quit Docker Desktop". This frees ~2.5GB RAM (VmmemWSL process).

---

## Production Server

| Item | Value |
|------|-------|
| Domain | https://app.maadiclinic.com |
| Provider | Hetzner Cloud |
| Plan | CX22 (2 vCPU, 4GB RAM, 40GB SSD, ~EUR3.29/mo) |
| OS | Ubuntu 24.04 LTS |
| IP | 23.88.105.81 |
| SSH | `ssh root@23.88.105.81` (password auth) |
| App directory | /opt/maadi-clinic |
| SSL | Let's Encrypt via Claude GUI nginx container (maadi-clinic_nginx_1) |
| Orphan warning | `COMPOSE_IGNORE_ORPHANS=true` set in `~/.bashrc` to suppress warning about nginx container |

**CRITICAL:** Frontend uses `expose: ["80"]` NOT `ports: ["80:80"]` — the Claude GUI nginx owns host ports 80/443.

### Deploy to Production
```bash
ssh root@23.88.105.81
cd /opt/maadi-clinic && git pull && docker compose -f docker-compose.prod.yml up -d --build
```

### Production Database Restore

```bash
# From local: export local DB
docker compose exec -T db pg_dump -U cardioclinic --no-owner --no-acl cardioclinic > backup_full.sql
gzip backup_full.sql

# From local: upload to server
scp backup_full.sql.gz root@23.88.105.81:/tmp/

# On server: stop backend, drop/recreate DB, restore, restart
docker compose -f docker-compose.prod.yml stop backend
docker compose -f docker-compose.prod.yml exec -T db psql -U cardioclinic -d postgres -c "DROP DATABASE cardioclinic WITH (FORCE);"
docker compose -f docker-compose.prod.yml exec -T db psql -U cardioclinic -d postgres -c "CREATE DATABASE cardioclinic;"
gunzip -c /tmp/backup_full.sql.gz | docker exec -i maadi-clinic-db-1 psql -U cardioclinic -d cardioclinic
docker compose -f docker-compose.prod.yml start backend

# IMPORTANT: Reset DB password after restore
docker compose -f docker-compose.prod.yml exec -T db psql -U cardioclinic -d cardioclinic -c "ALTER USER cardioclinic PASSWORD 'YFUgm5JdbjZuCt4YwZ8TB2f4ksYaQDqv';"
```

**After every restore, user passwords reset to local defaults.** Must manually change in User Management.

---

## Email Configuration

| Setting | Value |
|---------|-------|
| Provider | Gmail SMTP |
| Email | maadiclinic.noreply@gmail.com |
| Password | App password (in docker-compose files) |
| SMTP Host | smtp.gmail.com |
| SMTP Port | 587 |
| TLS | true |

Configured in environment variables in both `docker-compose.yml` (dev) and `docker-compose.prod.yml` (prod).

**Domain email note:** maadiclinic.com MX records point to Microsoft 365 (GoDaddy) but no mailbox was ever created. Using Gmail for now. Can migrate to M365 `secretary@maadiclinic.com` later — just buy a mailbox on GoDaddy and swap the SMTP settings.

---

## Prescription PDF System

**Generator:** `backend/app/services/pdf.py` using WeasyPrint
**Assets:** `backend/app/static/prescription/` — 7 compressed JPEGs (~255KB total)
**Template source of truth:** `Source/Prescriptions/prescription_template_reduced.pdf`

Features:
- Pixel-matched to original clinic letterhead (paper texture, watermark, arabesques, logo, stamp, footer)
- Single page for prescriptions (footer pinned via position:fixed)
- Multi-page for instructions (flowing footer)
- Transparent logo blend (mix-blend-mode: multiply)
- ~365KB per generated PDF

Sharing:
- **Download PDF** — direct browser download
- **WhatsApp** — Web Share API sends actual PDF file (mobile), downloads as fallback (desktop)
- **Email** — SMTP with PDF attachment, auto-generates PDF if not yet created
- **Print** — browser print dialog
- **Print Blank** — generates letterhead-only PDF for handwriting

---

## Naming Convention

- **"CardioClinic"** = internal code name (repo, database, Docker images, Python package)
- **"Maadi Clinic"** = user-facing brand (login, header, favicon, PDFs, emails, browser tab)
- Do NOT rename internal code — all user-facing text already says "Maadi Clinic"

---

## Version Bumping Rules

Every single change gets a version bump across ALL 4 files:
1. `frontend/src/version.ts` (source of truth)
2. `frontend/package.json`
3. `backend/pyproject.toml`
4. `backend/app/core/config.py`

Always run `cd frontend && npx tsc -b --noEmit` before pushing — prod build has strict unused-variable checks.

---

## Login Credentials

| Environment | Email | Password | Role | Notes |
|---|---|---|---|---|
| Local (Docker) | admin@admin.com | admin | admin | Ahmed |
| Production | Yasser@baghdady.org | (set by Ahmed) | doctor | Dr. Yasser |

---

## Legacy Data Import

**Source:** DBHT.mdb (82MB, Jet 3.5 / Access 97 format, VB6-era)
**Location:** C:\Projects\CardioClinic\Source\DBHT.mdb
**Import script:** scripts/import_legacy.py (1,035 lines, idempotent)

| Legacy Table | Rows | Destination | Notes |
|---|---|---|---|
| PersHt | 23,589 | patients | Name, age→DOB, sex, phone, smoking |
| PresntHt | 23,589 | present_history | Chest pain, dyspnea, palpitations |
| PastHt | 23,589 | past_family_history | DM, HTN, RHD, CABG, family |
| Exam | 23,630 | examinations | Vitals, cardiac exam, body systems |
| ECG | 74,089 | investigations | Echo, ECG, cath, diagnosis |
| Invest | 666,649 | lab_results | Test name + value |
| FollowUp | 59,423 | follow_ups | Visit data |
| dawa | 1,480 | medications_master | Drug catalog |
| MasMidic | 84,558 | prescriptions | Prescription sessions |
| Medication | 494,899 | prescription_items | Drug + dosage per prescription |
| Tahl | 70 | investigation_types | Lab test types |
| Write | 132 | dosage_instructions | Dosage templates |

**Total: 977,330 records imported.**

---

## Frontend Pages (13)

| File | Route | Description |
|------|-------|-------------|
| LoginPage.tsx | /login | Email + password, animated background, real logo |
| DashboardPage.tsx | / | Classic theme: stats + recent patients |
| ModernDashboardPage.tsx | / | Modern theme: card hub (2 rows of 4+3) + stats |
| PatientsPage.tsx | /patients | Paginated list, search, create |
| PatientDetailPage.tsx | /patients/:id | 8 clinical tabs, vital charts, prescriptions |
| AppointmentsPage.tsx | /appointments | Schedule, status tracking |
| PrescriptionsPage.tsx | /prescriptions | Standalone Rx list, create, finalize, share (lazy-loaded) |
| MedicationsPage.tsx | /medications | Drug catalog, FDA lookup |
| InstructionsPage.tsx | /instructions | Bilingual templates, preview, PDF/WhatsApp/Email |
| UsersPage.tsx | /users | Role management (behind settings gear) |
| AuditLogPage.tsx | /audit-log | Diff view, restore (behind settings gear) |
| RiskCalculatorsPage.tsx | /risk-calculators | ASCVD + CHA2DS2-VASc |
| DrugInteractionsPage.tsx | /drug-interactions | Multi-drug interaction check |

---

## Known Issues

1. **Prescriptions page blank on first SPA nav** — Sometimes renders blank on SPA navigation, works on F5. Lazy-loaded with Suspense as mitigation. May need further investigation.
2. **DB restore overwrites passwords** — Must manually reset after every restore.
3. **1,111 medications missing metadata** — Generic names/categories not yet mapped.
4. **Patient DOB approximate** — Legacy stored age, not DOB. Calculated as Jan 1 of birth year.

---

## Remaining Work

### Awaiting
- Dr. Yasser's v1.0 approval (v0.11.7 is the candidate)
- Equipment list from Dr. Yasser for device integration
- Standard admin credentials (not admin/admin)

### Post-v1.0
- Equipment integration (DICOM, HL7 FHIR, PDF upload)
- Automated daily backups
- Automated testing (pytest, Vitest)
- Mobile responsive polish
- Remaining medication enrichment (1,111 drugs)

---

*Update this document at every session end or release.*
