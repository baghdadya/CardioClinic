# PROJECT_CONTRACT.md
## CardioClinic — Cardiology Practice Management System

**Version:** 0.1.0  
**Date:** 2026-04-05  
**Status:** Pre-development  

---

## 1. Purpose

Modern cloud-based cardiology practice management system replacing a legacy VB6/Access application from 2001. Single cardiologist practice with supporting staff (nurses, receptionists).

---

## 2. Architectural Decisions (LOCKED)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend | React 18 + TypeScript | PWA-capable, strong typing |
| UI Framework | Tailwind CSS + shadcn/ui | Customizable, modern, accessible |
| State Management | Zustand | Lightweight, simple |
| Offline | Service Worker + IndexedDB (Dexie.js) | PWA requirement |
| Backend | Python 3.12 + FastAPI | Clean, fast, good ecosystem |
| Database | PostgreSQL 16 | Robust, JSON support, full-text search |
| ORM | SQLAlchemy 2.0 | Async support, migrations via Alembic |
| Auth | JWT + refresh tokens | Stateless, role-based |
| API Style | REST + OpenAPI | Simple, well-documented |
| PDF Generation | WeasyPrint or ReportLab | Prescription printing |
| Hosting | Cloud PaaS (Render/Railway/AWS) | Auto-deploy from GitHub, managed DB |
| Delivery | PWA (Progressive Web App) | Install from browser, works offline |
| Email | SMTP (generic) | Prescriptions, reminders, notifications |
| Repo | GitHub | Version control |

---

## 3. Security Constraints

| Constraint | Implementation |
|------------|----------------|
| Data at rest | PostgreSQL encryption, encrypted backups |
| Data in transit | TLS 1.3 everywhere |
| Authentication | Argon2 password hashing, JWT tokens |
| Authorization | Role-based (Doctor, Nurse, Receptionist) |
| Session | Short-lived access tokens (15min), refresh tokens (7d) |
| Audit | All data changes logged with user, timestamp, action |
| Input validation | Pydantic models, parameterized queries |
| CORS | Whitelist only |
| Rate limiting | Per-endpoint limits |
| PHI handling | GDPR/HIPAA-aligned (pragmatic, not certified) |

---

## 4. Role Permissions Matrix

| Action | Doctor | Nurse | Receptionist |
|--------|--------|-------|--------------|
| View patients | ✓ | ✓ | ✓ |
| Edit patient demographics | ✓ | ✓ | ✓ |
| View medical history | ✓ | ✓ | ✗ |
| Edit medical history | ✓ | ✓ | ✗ |
| Create prescription | ✓ | ✗ | ✗ |
| View prescriptions | ✓ | ✓ | ✗ |
| Manage appointments | ✓ | ✓ | ✓ |
| Manage users | ✓ | ✗ | ✗ |
| View audit logs | ✓ | ✗ | ✗ |
| System settings | ✓ | ✗ | ✗ |

---

## 5. Data Invariants

These must NEVER be violated:

1. **Patient ID immutability** — Once assigned, patient IDs never change
2. **Audit completeness** — Every create/update/delete logged, no exceptions
3. **Prescription integrity** — Prescriptions cannot be edited after finalization, only voided
4. **Referential integrity** — No orphan records; cascades defined explicitly
5. **Soft deletes** — No hard deletes on clinical data; use `deleted_at` timestamp
6. **Version sync** — All version markers (package.json, pyproject.toml, CHANGELOG) match
7. **Sync guarantee** — No clinical data shall exist only in client storage for more than 5 seconds when online. No data shall be silently discarded during sync — conflicts require human resolution.

---

## 6. Offline Strategy

| State | Behavior |
|-------|----------|
| Online | Normal API calls |
| Offline detected | Switch to IndexedDB reads, queue writes |
| Back online | Sync queue to server, resolve conflicts via human review |
| Conflict | Save both versions, flag record, require human resolution |

Offline scope: Read all cached data, create/edit patients and appointments. Prescriptions require online (drug interaction check).

### 6.1 Aggressive Sync Strategy

Medical data cannot be lost. The following rules govern all data synchronization:

1. **Immediate sync** — Every save triggers immediate cloud sync when online. No batching, no delays.
2. **Visual sync indicator** — Every record displays sync status:
   - ✅ Green checkmark = synced to server
   - 🔄 Yellow spinner = sync in progress
   - ⚠️ Red warning = pending/failed sync
3. **Close protection** — `beforeunload` event warns user if unsynced changes exist. User cannot silently lose data by closing the tab/app.
4. **Crash-resilient queue** — Sync queue persists in IndexedDB. Survives browser crash, power loss, device restart. Queue is the source of truth for unsynced changes.
5. **Reconnect behavior** — On network restore: auto-sync queued items oldest-first, show progress bar with item count.
6. **Retry policy** — Failed syncs retry with exponential backoff (1s, 2s, 4s, 8s, 16s), max 5 attempts. After 5 failures, surface error to user with option to retry manually.
7. **Conflict resolution** — NEVER discard either version. If the same record was edited offline and online:
   - Save BOTH versions (original server version + incoming local version)
   - Flag the record as "conflict"
   - Show user: *"This record was also edited by [user] at [time]. Review changes."*
   - Human reviews side-by-side diff and decides which to keep or manually merges
   - Conflicted record cannot be edited further until the conflict is resolved
8. **Sync audit trail** — Every sync attempt logged with: timestamp, success/fail, item count, conflict count.

---

## 7. UI/UX Requirements

| Requirement | Specification |
|-------------|---------------|
| Aesthetic | Premium medical — clean, trustworthy, modern |
| Theme | Light default, dark mode supported |
| Typography | Distinctive, readable (NOT Inter/Roboto/Arial) |
| Responsiveness | Desktop-first, fully responsive to mobile |
| Accessibility | WCAG 2.1 AA minimum |
| Loading states | Skeleton loaders, optimistic updates |
| Animations | Subtle, purposeful (framer-motion) |
| RTL | Arabic support (prescriptions, instructions) |
| Language | Bilingual: English + Arabic only |

### 7.1 Bilingual Support (English + Arabic)

The application supports exactly two languages: **English** and **Arabic**. No other languages.

1. **UI language toggle** — User can switch between English and Arabic at any time. Preference persisted per user.
2. **RTL layout** — Arabic mode switches entire layout to right-to-left via `dir="rtl"` on `<html>`.
3. **Data fields** — All patient-facing text fields have `_ar` variants (e.g., `full_name` / `full_name_ar`, `instructions` / `instructions_ar`).
4. **Prescriptions** — Always render bilingual: English + Arabic side by side or stacked. Medication names, dosage instructions, and patient instructions in both languages.
5. **UI labels** — All static UI text (buttons, headings, placeholders) available in both languages via i18n keys.
6. **Font stack** — "Source Sans 3" for Latin, "Noto Sans Arabic" for Arabic script.
7. **Input** — Arabic text input supported in all free-text fields. No transliteration — user types in their chosen language.
8. **Search** — Full-text search works across both `full_name` and `full_name_ar` fields.
9. **PDF output** — Prescriptions and reports render correctly in both LTR and RTL with proper font embedding.

---

## 8. Legacy Data Import

The system must import data from the original 2001 VB6/Access application. The legacy source files are in `Source/`.

### 8.1 Supported Import Formats

| Format | File(s) | Strategy |
|--------|---------|----------|
| Microsoft Access (.mdb) | `DBHT.mdb` | Via `pyodbc` or `mdbtools` — extract tables directly |
| Crystal Reports (.rpt) | `rh.rpt`, `rhb.rpt` | Parse report definitions to understand field mappings; extract embedded SQL queries to identify source tables and column layouts |
| CSV fallback | Any `.csv` exports | Column mapping config per table |
| CAB archive (.cab) | `Cardiac.CAB` | Extract with `cabextract`, process contents |

### 8.2 Import Rules

1. **`legacy_id` preservation** — Original Access patient IDs mapped to `patients.legacy_id` for traceability
2. **No data loss** — Every record from the legacy system must be accounted for. Import log shows: imported, skipped (with reason), failed (with error)
3. **Validation** — All imported data passes the same Pydantic validation as API input
4. **Idempotent** — Running import twice does not duplicate records (match on `legacy_id`)
5. **Dry run mode** — `--dry-run` flag validates and reports without writing to database
6. **Encoding** — Handle Arabic text encoding from legacy system (likely Windows-1256 or CP1256)
7. **Audit** — Import creates audit log entries attributed to a system import user

---

## 9. Email Integration

Generic SMTP integration for sending clinical communications. Provider-agnostic — works with Gmail, Outlook/O365, SendGrid, or any SMTP server.

### 9.1 Email Use Cases

| Trigger | Content | Recipient |
|---------|---------|-----------|
| Prescription finalized | PDF attachment + summary | Patient email |
| Appointment scheduled | Date, time, location | Patient email |
| Appointment reminder | 24h before scheduled time | Patient email |
| Appointment cancelled | Cancellation notice | Patient email |

### 9.2 Email Rules

1. **Opt-in only** — Email sent only if patient has email on file and has not opted out
2. **Bilingual** — Email body in both English and Arabic
3. **PDF attachment** — Prescriptions attached as PDF (same as print output)
4. **Audit logged** — Every email send attempt logged: recipient, type, timestamp, success/fail
5. **Async sending** — Emails sent in background, never block the UI or API response
6. **Retry** — Failed sends retry up to 3 times with backoff, then surface to user
7. **No PHI in subject** — Subject lines must not contain patient names or diagnoses
8. **Configuration** — SMTP host, port, credentials, sender address via environment variables

### 9.3 Backend Configuration

```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=clinic@example.com
SMTP_PASSWORD=...
SMTP_FROM_NAME=CardioClinic
SMTP_FROM_EMAIL=clinic@example.com
SMTP_USE_TLS=true
```

---

## 10. Deployment Model

Cloud-hosted Progressive Web App. Auto-deploys from GitHub.

### 10.1 Architecture

| Component | Hosting | Notes |
|-----------|---------|-------|
| Frontend (React) | Static files via CDN/PaaS | Built by CI, served as static assets |
| Backend (FastAPI) | Container on PaaS | Docker container, auto-scales |
| Database (PostgreSQL) | Managed DB service | Automatic backups, encryption at rest |

### 10.2 Deployment Flow

1. Developer pushes to `main` on GitHub
2. CI/CD pipeline builds frontend + backend
3. Host auto-deploys containers
4. Zero-downtime deployment (rolling update)
5. Database migrations run automatically before new version goes live

### 10.3 User Access

- Users open `https://cardioclinic.yourdomain.com` in any browser
- Browser offers "Install App" → adds icon to desktop/phone home screen
- Works offline via service worker
- No installer, no `.exe`, no local database

---

## 11. File Structure (updated)

```
CardioClinic/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── stores/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── utils/
│   ├── alembic/
│   ├── tests/
│   ├── pyproject.toml
│   └── main.py
├── docs/
│   ├── PROJECT_CONTRACT.md
│   ├── HANDOVER.md
│   ├── NEW_SESSION_PROMPT.md
│   └── CHANGELOG.md
├── scripts/
│   └── legacy_import.py
└── docker-compose.yml
```

---

## 12. Version Sync Points

| File | Field |
|------|-------|
| `frontend/package.json` | `version` |
| `backend/pyproject.toml` | `version` |
| `docs/CHANGELOG.md` | Latest entry |
| `docs/HANDOVER.md` | Header |

All must match on every release.

---

## 13. Prohibited Actions (AI Guardrails)

Claude Code must NEVER:

1. Commit directly to `main` without approval
2. Delete clinical data (soft delete only)
3. Disable audit logging
4. Store passwords in plaintext or reversible encryption
5. Skip input validation on any endpoint
6. Use `eval()` or dynamic SQL
7. Expose internal errors to client
8. Proceed without explicit human confirmation on destructive operations

---

## 14. Amendment Process

Contract changes require:
1. Written justification
2. Human approval
3. Version bump
4. CHANGELOG entry
5. HANDOVER update

---

*This contract governs all development. Deviations are bugs.*
