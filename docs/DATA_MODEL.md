# DATA_MODEL.md
## CardioClinic Database Schema

**Version:** 0.11.7  
**Database:** PostgreSQL 16  
**Last Updated:** 2026-04-09  

---

## Entity Relationship Overview

```
┌─────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    User     │       │     Patient     │       │   Appointment   │
│  (staff)    │       │                 │◄──────│                 │
└─────────────┘       └────────┬────────┘       └─────────────────┘
                               │
       ┌───────────────────────┼───────────────────────┐
       │           │           │           │           │
       ▼           ▼           ▼           ▼           ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Present  │ │  Past &  │ │  Exam-   │ │ Investi- │ │  Follow  │
│ History  │ │  Family  │ │ ination  │ │  gation  │ │    Up    │
└──────────┘ └──────────┘ └──────────┘ └────┬─────┘ └──────────┘
                                            │
                               ┌────────────┼────────────┐
                               ▼            ▼            ▼
                         ┌──────────┐ ┌──────────┐ ┌──────────┐
                         │   Lab    │ │   Echo   │ │  Images  │
                         │ Results  │ │  Report  │ │ (DICOM)  │
                         └──────────┘ └──────────┘ └──────────┘

┌─────────────┐       ┌─────────────────┐
│ Medication  │◄──────│  Prescription   │
│   (master)  │       │                 │
└─────────────┘       └─────────────────┘
                               │
                               ▼
                      ┌─────────────────┐
                      │  Prescription   │
                      │     Items       │
                      └─────────────────┘
```

---

## Tables

### users
Staff accounts (doctor, nurses, receptionists).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Login identifier |
| password_hash | VARCHAR(255) | NOT NULL | Argon2 |
| full_name | VARCHAR(255) | NOT NULL | |
| role | ENUM('doctor','nurse','receptionist') | NOT NULL | |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

---

### patients
Core patient demographics.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| legacy_id | INTEGER | UNIQUE, NULLABLE | Original ID from Access DB |
| full_name | VARCHAR(255) | NOT NULL | |
| full_name_ar | VARCHAR(255) | NULLABLE | Arabic name |
| date_of_birth | DATE | NOT NULL | |
| sex | ENUM('male','female') | NOT NULL | |
| marital_status | ENUM('single','married','divorced','widowed') | NULLABLE | |
| phone | VARCHAR(20) | NULLABLE | |
| phone_alt | VARCHAR(20) | NULLABLE | |
| email | VARCHAR(255) | NULLABLE | |
| address | TEXT | NULLABLE | |
| smoking_status | ENUM('never','former','current') | NULLABLE | |
| smoking_packs_day | DECIMAL(3,1) | NULLABLE | |
| notes | TEXT | NULLABLE | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |
| deleted_at | TIMESTAMPTZ | NULLABLE | Soft delete |

**Indexes:** full_name (trigram for search), phone, legacy_id

---

### present_history
Current cardiac symptoms per visit.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| patient_id | UUID | FK → patients | |
| recorded_at | TIMESTAMPTZ | DEFAULT now() | |
| recorded_by | UUID | FK → users | |
| chest_pain | ENUM('none','typical','atypical','non_cardiac') | NULLABLE | |
| chest_pain_remarks | TEXT | NULLABLE | |
| dyspnea_exertional | BOOLEAN | DEFAULT false | |
| dyspnea_pnd | BOOLEAN | DEFAULT false | PND |
| dyspnea_orthopnea | BOOLEAN | DEFAULT false | |
| dyspnea_grade | INTEGER | CHECK 1-4 | NYHA class |
| palpitations | ENUM('none','occasional','frequent','constant') | NULLABLE | |
| syncope | ENUM('none','pre_syncope','syncope') | NULLABLE | |
| lower_limb_edema | BOOLEAN | DEFAULT false | |
| abdominal_swelling | BOOLEAN | DEFAULT false | |
| low_cardiac_output_dizziness | BOOLEAN | DEFAULT false | |
| low_cardiac_output_blurring | BOOLEAN | DEFAULT false | |
| low_cardiac_output_fatigue | BOOLEAN | DEFAULT false | |
| neurological_symptoms | TEXT | NULLABLE | |
| git_symptoms | BOOLEAN | DEFAULT false | |
| urinary_symptoms | BOOLEAN | DEFAULT false | |
| chest_symptoms | BOOLEAN | DEFAULT false | |
| remarks | TEXT | NULLABLE | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

---

### past_family_history
Medical and family history.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| patient_id | UUID | FK → patients, UNIQUE | One per patient |
| diabetes | BOOLEAN | DEFAULT false | |
| hypertension | BOOLEAN | DEFAULT false | |
| rheumatic_heart_disease | BOOLEAN | DEFAULT false | |
| ischemic_heart_disease | BOOLEAN | DEFAULT false | |
| cabg | TEXT | NULLABLE | Details if applicable |
| valve_replacement | TEXT | NULLABLE | Details |
| other_conditions | TEXT | NULLABLE | |
| family_consanguinity | BOOLEAN | DEFAULT false | |
| family_hypertension | BOOLEAN | DEFAULT false | |
| family_diabetes | BOOLEAN | DEFAULT false | |
| family_ihd | BOOLEAN | DEFAULT false | |
| family_other | TEXT | NULLABLE | |
| comments | TEXT | NULLABLE | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_by | UUID | FK → users | |

---

### examinations
Physical examination records.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| patient_id | UUID | FK → patients | |
| examined_at | TIMESTAMPTZ | DEFAULT now() | |
| examined_by | UUID | FK → users | |
| pulse_bpm | INTEGER | NULLABLE | |
| bp_systolic | INTEGER | NULLABLE | mmHg |
| bp_diastolic | INTEGER | NULLABLE | mmHg |
| weight_kg | DECIMAL(5,2) | NULLABLE | |
| height_cm | DECIMAL(5,2) | NULLABLE | |
| bmi | DECIMAL(4,1) | COMPUTED | |
| activity_level | ENUM('sedentary','light','moderate','active') | NULLABLE | |
| head_neck | TEXT | NULLABLE | |
| upper_limb | TEXT | NULLABLE | |
| lower_limb | TEXT | NULLABLE | |
| abdomen | TEXT | NULLABLE | |
| chest | TEXT | NULLABLE | |
| neurology | TEXT | NULLABLE | |
| cardiac_apex | VARCHAR(50) | NULLABLE | |
| cardiac_s1 | BOOLEAN | DEFAULT true | |
| cardiac_s2 | BOOLEAN | DEFAULT true | |
| cardiac_s3 | BOOLEAN | DEFAULT false | |
| cardiac_s4 | BOOLEAN | DEFAULT false | |
| cardiac_murmurs | TEXT | NULLABLE | |
| cardiac_additional_sounds | TEXT | NULLABLE | |
| remarks | TEXT | NULLABLE | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

---

### investigations
Diagnostic tests and results.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| patient_id | UUID | FK → patients | |
| investigation_date | DATE | NOT NULL | |
| recorded_by | UUID | FK → users | |
| ecg_result | TEXT | NULLABLE | |
| stress_test | TEXT | NULLABLE | |
| cardiac_cath | TEXT | NULLABLE | |
| echo_lvedd | DECIMAL(4,1) | NULLABLE | cm |
| echo_lvesd | DECIMAL(4,1) | NULLABLE | cm |
| echo_ivs | DECIMAL(4,1) | NULLABLE | cm |
| echo_pwt | DECIMAL(4,1) | NULLABLE | cm |
| echo_fs | DECIMAL(4,1) | NULLABLE | % |
| echo_ef | DECIMAL(4,1) | NULLABLE | % |
| echo_ao | DECIMAL(4,1) | NULLABLE | cm |
| echo_la | DECIMAL(4,1) | NULLABLE | cm |
| echo_ao_valve | TEXT | NULLABLE | |
| echo_mit_valve | TEXT | NULLABLE | |
| echo_pulm_valve | TEXT | NULLABLE | |
| echo_tric_valve | TEXT | NULLABLE | |
| diagnosis | TEXT | NULLABLE | |
| remarks | TEXT | NULLABLE | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

---

### lab_results
Laboratory test results.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| investigation_id | UUID | FK → investigations | |
| test_name | VARCHAR(100) | NOT NULL | |
| value | VARCHAR(50) | NOT NULL | |
| unit | VARCHAR(20) | NULLABLE | |
| reference_range | VARCHAR(50) | NULLABLE | |
| is_abnormal | BOOLEAN | DEFAULT false | |

---

### medications_master
Drug catalog.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| name | VARCHAR(255) | NOT NULL | |
| name_ar | VARCHAR(255) | NULLABLE | |
| generic_name | VARCHAR(255) | NULLABLE | |
| category | VARCHAR(100) | NULLABLE | |
| default_dosage | VARCHAR(100) | NULLABLE | |
| contraindications | TEXT | NULLABLE | |
| interactions | JSONB | NULLABLE | Drug interaction data |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

**Index:** name (trigram)

---

### patient_medications
Current and historical medications.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| patient_id | UUID | FK → patients | |
| medication_id | UUID | FK → medications_master | |
| dosage | VARCHAR(100) | NOT NULL | |
| frequency | VARCHAR(100) | NOT NULL | |
| instructions | TEXT | NULLABLE | |
| instructions_ar | TEXT | NULLABLE | |
| started_at | DATE | NOT NULL | |
| ended_at | DATE | NULLABLE | NULL = current |
| prescribed_by | UUID | FK → users | |
| reason_stopped | TEXT | NULLABLE | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

---

### prescriptions
Prescription documents.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| patient_id | UUID | FK → patients | |
| prescribed_by | UUID | FK → users | |
| prescribed_at | TIMESTAMPTZ | DEFAULT now() | |
| status | ENUM('draft','finalized','voided') | DEFAULT 'draft' | |
| finalized_at | TIMESTAMPTZ | NULLABLE | |
| voided_at | TIMESTAMPTZ | NULLABLE | |
| void_reason | TEXT | NULLABLE | |
| notes | TEXT | NULLABLE | |
| pdf_path | VARCHAR(500) | NULLABLE | Generated PDF |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

---

### prescription_items
Line items in a prescription.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| prescription_id | UUID | FK → prescriptions | |
| medication_id | UUID | FK → medications_master | |
| dosage | VARCHAR(100) | NOT NULL | |
| frequency | VARCHAR(100) | NOT NULL | |
| duration | VARCHAR(100) | NULLABLE | |
| instructions | TEXT | NULLABLE | |
| instructions_ar | TEXT | NULLABLE | |
| sort_order | INTEGER | DEFAULT 0 | |

---

### follow_ups
Follow-up visits.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| patient_id | UUID | FK → patients | |
| visit_date | TIMESTAMPTZ | DEFAULT now() | |
| seen_by | UUID | FK → users | |
| complaint | TEXT | NULLABLE | |
| present_history | TEXT | NULLABLE | |
| pulse_bpm | INTEGER | NULLABLE | |
| bp_systolic | INTEGER | NULLABLE | |
| bp_diastolic | INTEGER | NULLABLE | |
| examination | TEXT | NULLABLE | |
| investigation | TEXT | NULLABLE | |
| diagnosis | TEXT | NULLABLE | |
| plan | TEXT | NULLABLE | |
| next_follow_up | DATE | NULLABLE | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

---

### appointments
Scheduling.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| patient_id | UUID | FK → patients | |
| scheduled_at | TIMESTAMPTZ | NOT NULL | |
| duration_minutes | INTEGER | DEFAULT 30 | |
| type | ENUM('new','follow_up','procedure','telemedicine') | DEFAULT 'follow_up' | |
| status | ENUM('scheduled','confirmed','arrived','completed','cancelled','no_show') | DEFAULT 'scheduled' | |
| notes | TEXT | NULLABLE | |
| reminder_sent | BOOLEAN | DEFAULT false | |
| created_by | UUID | FK → users | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

**Index:** scheduled_at, status

---

### audit_log
Immutable audit trail.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| user_id | UUID | FK → users | |
| action | ENUM('create','update','delete','login','logout','export') | NOT NULL | |
| entity_type | VARCHAR(50) | NOT NULL | Table name |
| entity_id | UUID | NULLABLE | |
| old_values | JSONB | NULLABLE | |
| new_values | JSONB | NULLABLE | |
| ip_address | INET | NULLABLE | |
| user_agent | TEXT | NULLABLE | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

**Index:** entity_type + entity_id, created_at, user_id

---

### dosage_instructions
Preset dosage instructions (English + Arabic).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| text_en | VARCHAR(255) | NOT NULL | |
| text_ar | VARCHAR(255) | NULLABLE | |
| sort_order | INTEGER | DEFAULT 0 | |
| is_active | BOOLEAN | DEFAULT true | |

---

### investigation_types
Master list of investigation types.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| name | VARCHAR(100) | NOT NULL | |
| category | VARCHAR(50) | NULLABLE | lab, imaging, procedure |
| unit | VARCHAR(20) | NULLABLE | |
| reference_range | VARCHAR(50) | NULLABLE | |
| is_active | BOOLEAN | DEFAULT true | |

---

### images
Medical images (DICOM reference or file storage).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| patient_id | UUID | FK → patients | |
| investigation_id | UUID | FK → investigations, NULLABLE | |
| image_type | ENUM('xray','echo','ecg','ct','mri','other') | NOT NULL | |
| file_path | VARCHAR(500) | NOT NULL | |
| thumbnail_path | VARCHAR(500) | NULLABLE | |
| dicom_study_uid | VARCHAR(255) | NULLABLE | |
| description | TEXT | NULLABLE | |
| uploaded_at | TIMESTAMPTZ | DEFAULT now() | |
| uploaded_by | UUID | FK → users | |

---

## Future Tables (Wave 2+)

- `telemedicine_sessions` — Video call records
- `patient_portal_users` — Patient login accounts
- `wearable_data` — Imported BP/HR readings
- `risk_calculations` — Stored ASCVD/CHA2DS2 scores
- `drug_interactions` — Interaction rules cache
- `templates` — Cardiology report templates

---

## Migration Notes

1. **Legacy Import:** Map `legacy_id` to original Access patient ID
2. **Arabic fields:** All patient-facing text has `_ar` variant
3. **Soft deletes:** Clinical tables use `deleted_at`, never hard delete
4. **Timestamps:** All in UTC, display in local timezone

---

*Schema version must match application version.*
