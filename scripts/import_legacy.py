"""
Legacy Access Database Import Script
=====================================
Imports patient data from DBHT.mdb (Jet 3.5 / VB6-era Access database)
into the CardioClinic PostgreSQL database.

Uses access_parser to read the .mdb file (no ODBC driver needed).

Usage:
    python import_legacy.py --mdb-path /path/to/DBHT.mdb
    python import_legacy.py --mdb-path /path/to/DBHT.mdb --dry-run
    python import_legacy.py --mdb-path /path/to/DBHT.mdb --db-url postgresql://user:pass@host/db
"""

import argparse
import sys
import uuid
from datetime import date, datetime, timezone
from decimal import Decimal, InvalidOperation
from typing import Any, Optional

import psycopg2
import psycopg2.extras
from access_parser import AccessParser

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

psycopg2.extras.register_uuid()


def decode_text(value: Any) -> Optional[str]:
    """Decode a value that may be bytes (cp1256 Access memo field), str, or None."""
    if value is None:
        return None
    if isinstance(value, bytes):
        try:
            return value.decode("utf-8")
        except UnicodeDecodeError:
            return value.decode("cp1256", errors="replace")
    return str(value).strip() or None


def to_bool(value: Any) -> bool:
    """Convert Access boolean representations to Python bool.

    Access stores booleans as True/False, -1/0, 1/0, or 'Yes'/'No'.
    """
    if value is None:
        return False
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value != 0
    s = str(value).strip().lower()
    return s in ("true", "yes", "-1", "1")


def to_int(value: Any) -> Optional[int]:
    if value is None:
        return None
    try:
        return int(value)
    except (ValueError, TypeError):
        return None


def to_decimal(value: Any) -> Optional[Decimal]:
    if value is None:
        return None
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError, TypeError):
        return None


def to_date(value: Any) -> Optional[date]:
    """Parse a date from datetime object, date object, or string."""
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    s = str(value).strip()
    if not s:
        return None
    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y", "%Y-%m-%d %H:%M:%S", "%m/%d/%Y %H:%M:%S"):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    return None


def to_datetime(value: Any) -> Optional[datetime]:
    """Parse to timezone-aware datetime (UTC)."""
    d = to_date(value)
    if d is None:
        return None
    return datetime(d.year, d.month, d.day, tzinfo=timezone.utc)


def dob_from_age(age_value: Any) -> date:
    """Calculate approximate date of birth from age.

    Returns Jan 1 of the computed birth year.
    """
    age = to_int(age_value)
    if age is None or age < 0 or age > 150:
        # Default: 1970-01-01 when no usable age
        return date(1970, 1, 1)
    birth_year = date.today().year - age
    return date(birth_year, 1, 1)


def map_sex(value: Any) -> str:
    """Map legacy sex field to enum value."""
    if value is None:
        return "male"  # default
    s = decode_text(value)
    if s is None:
        return "male"
    s = s.lower().strip()
    if "female" in s or s == "f" or "أنث" in s:
        return "female"
    return "male"


def map_marital(value: Any) -> Optional[str]:
    """Map legacy marital status to enum value."""
    s = decode_text(value)
    if s is None:
        return None
    s = s.lower().strip()
    if "married" in s or "متزوج" in s:
        return "married"
    if "single" in s or "أعزب" in s:
        return "single"
    if "divorced" in s or "مطلق" in s:
        return "divorced"
    if "widow" in s or "أرمل" in s:
        return "widowed"
    return None


def map_smoking(value: Any) -> tuple[str, Optional[Decimal]]:
    """Return (smoking_status, packs_per_day)."""
    v = to_decimal(value)
    if v is None or v == 0:
        return "never", None
    return "current", v


# ---------------------------------------------------------------------------
# Table reader helper
# ---------------------------------------------------------------------------

class TableReader:
    """Wraps access_parser dict-of-lists into row iteration."""

    def __init__(self, data: dict):
        self._data = data
        # Normalise column names: strip whitespace
        self._columns = {k.strip(): k for k in data.keys()}
        if not data:
            self._row_count = 0
        else:
            self._row_count = len(next(iter(data.values())))

    def __len__(self):
        return self._row_count

    def get(self, row_idx: int, col_name: str) -> Any:
        """Get value at row index for a column name (case-insensitive match)."""
        # Try exact match first
        key = self._columns.get(col_name)
        if key is None:
            # Case-insensitive search
            col_lower = col_name.lower().strip()
            for k, orig in self._columns.items():
                if k.lower() == col_lower:
                    key = orig
                    break
        if key is None:
            return None
        values = self._data[key]
        if row_idx >= len(values):
            return None
        return values[row_idx]


# ---------------------------------------------------------------------------
# Import functions
# ---------------------------------------------------------------------------

def import_patients(db: AccessParser, cur, legacy_to_uuid: dict, admin_uid: str, dry_run: bool) -> int:
    """Import PersHt → patients. Returns count imported."""
    data = db.parse_table("PersHt")
    reader = TableReader(data)
    count = len(reader)
    if count == 0:
        print("  No records found in PersHt.")
        return 0

    print(f"  Importing {count} patients...", end=" ", flush=True)

    imported = 0
    skipped = 0
    for i in range(count):
        legacy_id = to_int(reader.get(i, "ID"))
        if legacy_id is None:
            continue

        # Check if already imported
        if not dry_run:
            cur.execute("SELECT id FROM patients WHERE legacy_id = %s", (legacy_id,))
            existing = cur.fetchone()
            if existing:
                legacy_to_uuid[legacy_id] = str(existing[0])
                skipped += 1
                continue

        new_id = str(uuid.uuid4())
        legacy_to_uuid[legacy_id] = new_id

        full_name = decode_text(reader.get(i, "NAME")) or f"Patient {legacy_id}"
        sex = map_sex(reader.get(i, "SEX"))
        marital = map_marital(reader.get(i, "MARRITAL STATUS"))
        smoking_status, packs = map_smoking(reader.get(i, "SMOKING"))
        address = decode_text(reader.get(i, "ADDRESS"))
        phone = decode_text(reader.get(i, "TEL"))
        email = decode_text(reader.get(i, "EMAIL"))
        notes = decode_text(reader.get(i, "REMARK"))
        dob = dob_from_age(reader.get(i, "AGE"))

        # Try to use the Date field as created_at
        created_date = to_date(reader.get(i, "Date"))
        created_at = None
        if created_date:
            created_at = datetime(created_date.year, created_date.month, created_date.day, tzinfo=timezone.utc)

        if not dry_run:
            cur.execute(
                """INSERT INTO patients
                   (id, legacy_id, full_name, date_of_birth, sex, marital_status,
                    phone, email, address, smoking_status, smoking_packs_day, notes,
                    created_at, updated_at)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                           COALESCE(%s, now()), now())""",
                (new_id, legacy_id, full_name, dob, sex, marital,
                 phone, email, address, smoking_status, packs, notes,
                 created_at),
            )
        imported += 1

    msg = f"done ({imported} imported"
    if skipped:
        msg += f", {skipped} skipped"
    msg += ")."
    print(msg)
    return imported


def import_present_history(db: AccessParser, cur, legacy_to_uuid: dict, admin_uid: str, dry_run: bool) -> int:
    """Import PresntHt → present_history."""
    data = db.parse_table("PresntHt")
    reader = TableReader(data)
    count = len(reader)
    if count == 0:
        print("  No records found in PresntHt.")
        return 0

    print(f"  Importing {count} present histories...", end=" ", flush=True)

    imported = 0
    for i in range(count):
        legacy_id = to_int(reader.get(i, "ID"))
        patient_uuid = legacy_to_uuid.get(legacy_id)
        if patient_uuid is None:
            continue

        new_id = str(uuid.uuid4())

        # Map chest pain — store as text since legacy is free text
        chest_pain_raw = decode_text(reader.get(i, "ChestPair"))
        chest_pain = None
        if chest_pain_raw:
            cp = chest_pain_raw.lower()
            if "typical" in cp and "atypical" not in cp:
                chest_pain = "typical"
            elif "atypical" in cp:
                chest_pain = "atypical"
            elif "non" in cp or "none" in cp:
                chest_pain = "none"
            else:
                chest_pain = "non_cardiac"

        dyspnea_exertional = to_bool(reader.get(i, "Exetional"))
        dyspnea_pnd = to_bool(reader.get(i, "PND"))
        dyspnea_orthopnea = to_bool(reader.get(i, "Orthopnea"))
        dyspnea_grade = to_int(reader.get(i, "Grade"))

        dizziness = to_bool(reader.get(i, "Dizzines"))
        blurring = to_bool(reader.get(i, "Blurring"))
        fatigue = to_bool(reader.get(i, "Fatigue"))

        lower_limb_edema = to_bool(reader.get(i, "LowerLimbOedema"))
        abdominal_swelling = to_bool(reader.get(i, "AbdominalSwelling"))

        palpitations_raw = decode_text(reader.get(i, "Palpitations"))
        palpitations = None
        if palpitations_raw:
            p = palpitations_raw.lower()
            if "constant" in p:
                palpitations = "constant"
            elif "frequent" in p:
                palpitations = "frequent"
            elif "occasional" in p or "yes" in p or to_bool(palpitations_raw):
                palpitations = "occasional"
            else:
                palpitations = "none"

        syncope_raw = decode_text(reader.get(i, "Syncope"))
        syncope = None
        if syncope_raw:
            sr = syncope_raw.lower()
            if "pre" in sr:
                syncope = "pre_syncope"
            elif "syncope" in sr or "yes" in sr or to_bool(syncope_raw):
                syncope = "syncope"
            else:
                syncope = "none"

        neurological = decode_text(reader.get(i, "NewologicalSymphoms"))
        git = to_bool(reader.get(i, "GIT"))
        urinary = to_bool(reader.get(i, "UrinaryTract"))
        chest_symptoms = to_bool(reader.get(i, "Chest"))
        chest_pain_remarks = decode_text(reader.get(i, "Remark"))
        remarks = decode_text(reader.get(i, "Remark1"))

        if not dry_run:
            cur.execute(
                """INSERT INTO present_history
                   (id, patient_id, recorded_at, recorded_by,
                    chest_pain, chest_pain_remarks,
                    dyspnea_exertional, dyspnea_pnd, dyspnea_orthopnea, dyspnea_grade,
                    palpitations, syncope,
                    lower_limb_edema, abdominal_swelling,
                    low_cardiac_output_dizziness, low_cardiac_output_blurring, low_cardiac_output_fatigue,
                    neurological_symptoms, git_symptoms, urinary_symptoms, chest_symptoms,
                    remarks, created_at, updated_at)
                   VALUES (%s, %s, now(), %s,
                           %s, %s,
                           %s, %s, %s, %s,
                           %s, %s,
                           %s, %s,
                           %s, %s, %s,
                           %s, %s, %s, %s,
                           %s, now(), now())""",
                (new_id, patient_uuid, admin_uid,
                 chest_pain, chest_pain_remarks,
                 dyspnea_exertional, dyspnea_pnd, dyspnea_orthopnea, dyspnea_grade,
                 palpitations, syncope,
                 lower_limb_edema, abdominal_swelling,
                 dizziness, blurring, fatigue,
                 neurological, git, urinary, chest_symptoms,
                 remarks),
            )
        imported += 1

    print(f"done ({imported} imported).")
    return imported


def import_past_family_history(db: AccessParser, cur, legacy_to_uuid: dict, admin_uid: str, dry_run: bool) -> int:
    """Import PastHt → past_family_history."""
    data = db.parse_table("PastHt")
    reader = TableReader(data)
    count = len(reader)
    if count == 0:
        print("  No records found in PastHt.")
        return 0

    print(f"  Importing {count} past/family histories...", end=" ", flush=True)

    imported = 0
    for i in range(count):
        legacy_id = to_int(reader.get(i, "ID"))
        patient_uuid = legacy_to_uuid.get(legacy_id)
        if patient_uuid is None:
            continue

        new_id = str(uuid.uuid4())

        diabetes = to_bool(reader.get(i, "DM"))
        hypertension = to_bool(reader.get(i, "Hypertersion"))
        rhd = to_bool(reader.get(i, "RHD"))
        cabg = decode_text(reader.get(i, "CABG"))
        valve_replacement = decode_text(reader.get(i, "ValueReplacement"))
        other_conditions = decode_text(reader.get(i, "Other"))
        comments = decode_text(reader.get(i, "POther"))

        family_consanguinity = to_bool(reader.get(i, "VeCon"))
        family_hypertension = to_bool(reader.get(i, "Hypertesion"))
        family_diabetes = to_bool(reader.get(i, "Diabetes Mellelim"))
        family_ihd = to_bool(reader.get(i, "HD"))

        if not dry_run:
            # past_family_history has a UNIQUE constraint on patient_id
            cur.execute(
                """INSERT INTO past_family_history
                   (id, patient_id,
                    diabetes, hypertension, rheumatic_heart_disease,
                    cabg, valve_replacement, other_conditions, comments,
                    family_consanguinity, family_hypertension, family_diabetes, family_ihd,
                    updated_at, updated_by)
                   VALUES (%s, %s,
                           %s, %s, %s,
                           %s, %s, %s, %s,
                           %s, %s, %s, %s,
                           now(), %s)
                   ON CONFLICT (patient_id) DO NOTHING""",
                (new_id, patient_uuid,
                 diabetes, hypertension, rhd,
                 cabg, valve_replacement, other_conditions, comments,
                 family_consanguinity, family_hypertension, family_diabetes, family_ihd,
                 admin_uid),
            )
        imported += 1

    print(f"done ({imported} imported).")
    return imported


def import_examinations(db: AccessParser, cur, legacy_to_uuid: dict, exam_id_map: dict, admin_uid: str, dry_run: bool) -> int:
    """Import Exam → examinations."""
    data = db.parse_table("Exam")
    reader = TableReader(data)
    count = len(reader)
    if count == 0:
        print("  No records found in Exam.")
        return 0

    print(f"  Importing {count} examinations...", end=" ", flush=True)

    imported = 0
    for i in range(count):
        legacy_id = to_int(reader.get(i, "ID"))
        patient_uuid = legacy_to_uuid.get(legacy_id)
        if patient_uuid is None:
            continue

        new_id = str(uuid.uuid4())

        # Track EXID for potential cross-references
        exid = to_int(reader.get(i, "EXID"))
        if exid is not None:
            exam_id_map[exid] = new_id

        examined_at = to_datetime(reader.get(i, "Date"))
        pulse = to_int(reader.get(i, "Pulse"))
        bp_sys = to_int(reader.get(i, "Bp"))
        bp_dia = to_int(reader.get(i, "Bp1"))
        weight = to_decimal(reader.get(i, "weight"))
        height = to_decimal(reader.get(i, "height"))

        # Cardiac apex + elevated
        apex = decode_text(reader.get(i, "Apex")) or ""
        elevated = decode_text(reader.get(i, "Elevaled"))
        if elevated and to_bool(elevated):
            apex = (apex + " (elevated)").strip()
        cardiac_apex = apex or None

        s1 = to_bool(reader.get(i, "S1"))
        s2 = to_bool(reader.get(i, "S2"))
        s3 = to_bool(reader.get(i, "S3"))
        s4 = to_bool(reader.get(i, "S4"))
        additional_sounds = decode_text(reader.get(i, "AdditionalSounds"))
        murmurs = decode_text(reader.get(i, "Mwmws"))

        head_neck = decode_text(reader.get(i, "HeadNeek"))
        upper_limb = decode_text(reader.get(i, "UpperLimb"))
        lower_limb = decode_text(reader.get(i, "Lower"))
        abdomen = decode_text(reader.get(i, "Abdomer"))
        chest = decode_text(reader.get(i, "Chest"))
        neurology = decode_text(reader.get(i, "Neurological"))
        remarks = decode_text(reader.get(i, "Remark"))

        if not dry_run:
            cur.execute(
                """INSERT INTO examinations
                   (id, patient_id, examined_at, examined_by,
                    pulse_bpm, bp_systolic, bp_diastolic, weight_kg, height_cm,
                    cardiac_apex, cardiac_s1, cardiac_s2, cardiac_s3, cardiac_s4,
                    cardiac_additional_sounds, cardiac_murmurs,
                    head_neck, upper_limb, lower_limb, abdomen, chest, neurology,
                    remarks, created_at, updated_at)
                   VALUES (%s, %s, COALESCE(%s, now()), %s,
                           %s, %s, %s, %s, %s,
                           %s, %s, %s, %s, %s,
                           %s, %s,
                           %s, %s, %s, %s, %s, %s,
                           %s, now(), now())""",
                (new_id, patient_uuid, examined_at, admin_uid,
                 pulse, bp_sys, bp_dia, weight, height,
                 cardiac_apex, s1, s2, s3, s4,
                 additional_sounds, murmurs,
                 head_neck, upper_limb, lower_limb, abdomen, chest, neurology,
                 remarks),
            )
        imported += 1

    print(f"done ({imported} imported).")
    return imported


def import_investigations(db: AccessParser, cur, legacy_to_uuid: dict, ecg_eid_map: dict, admin_uid: str, dry_run: bool) -> int:
    """Import ECG → investigations.

    Also builds ecg_eid_map {EID: investigation_uuid} for lab_results linking.
    """
    data = db.parse_table("ECG")
    reader = TableReader(data)
    count = len(reader)
    if count == 0:
        print("  No records found in ECG.")
        return 0

    print(f"  Importing {count} investigations...", end=" ", flush=True)

    imported = 0
    for i in range(count):
        legacy_id = to_int(reader.get(i, "ID"))
        patient_uuid = legacy_to_uuid.get(legacy_id)
        if patient_uuid is None:
            continue

        new_id = str(uuid.uuid4())

        eid = to_int(reader.get(i, "EID"))
        if eid is not None:
            ecg_eid_map[eid] = new_id

        inv_date = to_date(reader.get(i, "Date")) or date.today()

        echo_lvedd = to_decimal(reader.get(i, "Luedd"))
        echo_lvesd = to_decimal(reader.get(i, "Luesd"))
        echo_ivs = to_decimal(reader.get(i, "Ivs"))
        echo_pwt = to_decimal(reader.get(i, "Pwt"))
        echo_fs = to_decimal(reader.get(i, "Fs"))
        echo_ao = to_decimal(reader.get(i, "Ao"))
        echo_la = to_decimal(reader.get(i, "La"))

        echo_ao_valve = decode_text(reader.get(i, "VAO"))
        echo_mit_valve = decode_text(reader.get(i, "VMit"))
        echo_pulm_valve = decode_text(reader.get(i, "VPul"))
        echo_tric_valve = decode_text(reader.get(i, "VTrcusspid"))

        ecg_result = decode_text(reader.get(i, "Ecg"))
        cardiac_cath = decode_text(reader.get(i, "Casdiac"))
        diagnosis = decode_text(reader.get(i, "Diagnosis"))
        comment = decode_text(reader.get(i, "Comment"))
        xray = decode_text(reader.get(i, "X-ray"))

        # Combine comment and xray into remarks
        remarks_parts = [p for p in [comment, f"X-ray: {xray}" if xray else None] if p]
        remarks = "; ".join(remarks_parts) or None

        if not dry_run:
            cur.execute(
                """INSERT INTO investigations
                   (id, patient_id, investigation_date, recorded_by,
                    ecg_result, cardiac_cath,
                    echo_lvedd, echo_lvesd, echo_ivs, echo_pwt, echo_fs,
                    echo_ao, echo_la,
                    echo_ao_valve, echo_mit_valve, echo_pulm_valve, echo_tric_valve,
                    diagnosis, remarks,
                    created_at, updated_at)
                   VALUES (%s, %s, %s, %s,
                           %s, %s,
                           %s, %s, %s, %s, %s,
                           %s, %s,
                           %s, %s, %s, %s,
                           %s, %s,
                           now(), now())""",
                (new_id, patient_uuid, inv_date, admin_uid,
                 ecg_result, cardiac_cath,
                 echo_lvedd, echo_lvesd, echo_ivs, echo_pwt, echo_fs,
                 echo_ao, echo_la,
                 echo_ao_valve, echo_mit_valve, echo_pulm_valve, echo_tric_valve,
                 diagnosis, remarks),
            )
        imported += 1

    print(f"done ({imported} imported).")
    return imported


def import_lab_results(db: AccessParser, cur, ecg_eid_map: dict, dry_run: bool) -> int:
    """Import Invest → lab_results (linked via EID to investigations)."""
    data = db.parse_table("Invest")
    reader = TableReader(data)
    count = len(reader)
    if count == 0:
        print("  No records found in Invest.")
        return 0

    print(f"  Importing {count} lab results...", end=" ", flush=True)

    imported = 0
    for i in range(count):
        eid = to_int(reader.get(i, "EID"))
        investigation_uuid = ecg_eid_map.get(eid)
        if investigation_uuid is None:
            continue

        test_name = decode_text(reader.get(i, "Name"))
        value = decode_text(reader.get(i, "Qunt"))
        if not test_name or not value:
            continue

        new_id = str(uuid.uuid4())

        if not dry_run:
            cur.execute(
                """INSERT INTO lab_results
                   (id, investigation_id, test_name, value)
                   VALUES (%s, %s, %s, %s)""",
                (new_id, investigation_uuid, test_name, value),
            )
        imported += 1

    print(f"done ({imported} imported).")
    return imported


def import_follow_ups(db: AccessParser, cur, legacy_to_uuid: dict, admin_uid: str, dry_run: bool) -> int:
    """Import FollowUp → follow_ups."""
    data = db.parse_table("FollowUp")
    reader = TableReader(data)
    count = len(reader)
    if count == 0:
        print("  No records found in FollowUp.")
        return 0

    print(f"  Importing {count} follow-ups...", end=" ", flush=True)

    imported = 0
    for i in range(count):
        legacy_id = to_int(reader.get(i, "ID"))
        patient_uuid = legacy_to_uuid.get(legacy_id)
        if patient_uuid is None:
            continue

        new_id = str(uuid.uuid4())

        visit_date = to_datetime(reader.get(i, "Date"))
        complaint = decode_text(reader.get(i, "Complaint"))
        present_history = decode_text(reader.get(i, "PresentHistory"))
        pulse = to_int(reader.get(i, "Puls"))
        bp_sys = to_int(reader.get(i, "Bp"))
        bp_dia = to_int(reader.get(i, "Bp1"))
        examination = decode_text(reader.get(i, "Examination"))
        investigation = decode_text(reader.get(i, "Investigation"))
        diagnosis = decode_text(reader.get(i, "Diagognosis"))

        if not dry_run:
            cur.execute(
                """INSERT INTO follow_ups
                   (id, patient_id, visit_date, seen_by,
                    complaint, present_history,
                    pulse_bpm, bp_systolic, bp_diastolic,
                    examination, investigation, diagnosis,
                    created_at, updated_at)
                   VALUES (%s, %s, COALESCE(%s, now()), %s,
                           %s, %s,
                           %s, %s, %s,
                           %s, %s, %s,
                           now(), now())""",
                (new_id, patient_uuid, visit_date, admin_uid,
                 complaint, present_history,
                 pulse, bp_sys, bp_dia,
                 examination, investigation, diagnosis),
            )
        imported += 1

    print(f"done ({imported} imported).")
    return imported


def import_medications(db: AccessParser, cur, dry_run: bool) -> int:
    """Import dawa → medications_master."""
    data = db.parse_table("dawa")
    reader = TableReader(data)
    count = len(reader)
    if count == 0:
        print("  No records found in dawa.")
        return 0

    print(f"  Importing {count} medications...", end=" ", flush=True)

    imported = 0
    for i in range(count):
        name = decode_text(reader.get(i, "Dawa"))
        if not name:
            continue

        new_id = str(uuid.uuid4())

        if not dry_run:
            # Skip if medication with same name already exists
            cur.execute("SELECT id FROM medications_master WHERE name = %s", (name,))
            if cur.fetchone():
                continue
            cur.execute(
                """INSERT INTO medications_master (id, name, created_at)
                   VALUES (%s, %s, now())""",
                (new_id, name),
            )
        imported += 1

    print(f"done ({imported} imported).")
    return imported


def import_investigation_types(db: AccessParser, cur, dry_run: bool) -> int:
    """Import Tahl → investigation_types."""
    data = db.parse_table("Tahl")
    reader = TableReader(data)
    count = len(reader)
    if count == 0:
        print("  No records found in Tahl.")
        return 0

    print(f"  Importing {count} investigation types...", end=" ", flush=True)

    imported = 0
    for i in range(count):
        name = decode_text(reader.get(i, "InvestName"))
        if not name:
            continue
        unit = decode_text(reader.get(i, "Unit"))
        new_id = str(uuid.uuid4())

        if not dry_run:
            cur.execute("SELECT id FROM investigation_types WHERE name = %s", (name,))
            if cur.fetchone():
                continue
            cur.execute(
                """INSERT INTO investigation_types (id, name, unit, category)
                   VALUES (%s, %s, %s, 'lab')""",
                (new_id, name, unit),
            )
        imported += 1

    print(f"done ({imported} imported).")
    return imported


def import_dosage_instructions(db: AccessParser, cur, dry_run: bool) -> int:
    """Import Write → dosage_instructions."""
    data = db.parse_table("Write")
    reader = TableReader(data)
    count = len(reader)
    if count == 0:
        print("  No records found in Write.")
        return 0

    print(f"  Importing {count} dosage instructions...", end=" ", flush=True)

    imported = 0
    for i in range(count):
        name = decode_text(reader.get(i, "Name"))
        if not name:
            continue
        new_id = str(uuid.uuid4())

        if not dry_run:
            cur.execute("SELECT id FROM dosage_instructions WHERE text_en = %s", (name,))
            if cur.fetchone():
                continue
            cur.execute(
                """INSERT INTO dosage_instructions (id, text_en, sort_order)
                   VALUES (%s, %s, %s)""",
                (new_id, name, imported),
            )
        imported += 1

    print(f"done ({imported} imported).")
    return imported


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def get_admin_user(cur) -> str:
    """Fetch the first user UUID from the users table to use as default author."""
    cur.execute("SELECT id FROM users ORDER BY created_at ASC LIMIT 1")
    row = cur.fetchone()
    if row is None:
        raise RuntimeError(
            "No users found in the database. Please create at least one user before importing."
        )
    return str(row[0])


def main():
    parser = argparse.ArgumentParser(
        description="Import legacy Access database (DBHT.mdb) into CardioClinic PostgreSQL."
    )
    parser.add_argument(
        "--mdb-path", required=True, help="Path to the legacy DBHT.mdb file"
    )
    parser.add_argument(
        "--db-url",
        default="postgresql://cardioclinic:cardioclinic@localhost:5432/cardioclinic",
        help="PostgreSQL connection URL (default: %(default)s)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Parse and report stats without writing to the database",
    )
    args = parser.parse_args()

    # -----------------------------------------------------------------------
    # Open the Access database
    # -----------------------------------------------------------------------
    print(f"Opening {args.mdb_path}...")
    try:
        access_db = AccessParser(args.mdb_path)
    except Exception as e:
        print(f"ERROR: Cannot open Access database: {e}", file=sys.stderr)
        sys.exit(1)

    print("  Available tables:", ", ".join(access_db.catalog) if hasattr(access_db, "catalog") else "(unknown)")

    if args.dry_run:
        print("\n*** DRY RUN — no database changes will be made ***\n")

    # -----------------------------------------------------------------------
    # Connect to PostgreSQL
    # -----------------------------------------------------------------------
    conn = None
    if not args.dry_run:
        try:
            conn = psycopg2.connect(args.db_url)
            conn.autocommit = False
        except Exception as e:
            print(f"ERROR: Cannot connect to PostgreSQL: {e}", file=sys.stderr)
            sys.exit(1)

    try:
        cur = conn.cursor() if conn else None

        # Get admin user for foreign key references
        admin_uid = None
        if not args.dry_run:
            admin_uid = get_admin_user(cur)
            print(f"  Using admin user: {admin_uid}")

        # Mapping dictionaries
        legacy_to_uuid: dict[int, str] = {}   # PersHt.ID → patients.id
        exam_id_map: dict[int, str] = {}       # Exam.EXID → examinations.id
        ecg_eid_map: dict[int, str] = {}       # ECG.EID → investigations.id

        totals: dict[str, int] = {}

        # Import in dependency order
        print("\n[1/9] Patients (PersHt)")
        totals["patients"] = import_patients(access_db, cur, legacy_to_uuid, admin_uid, args.dry_run)

        print("[2/9] Present History (PresntHt)")
        totals["present_history"] = import_present_history(access_db, cur, legacy_to_uuid, admin_uid, args.dry_run)

        print("[3/9] Past/Family History (PastHt)")
        totals["past_family_history"] = import_past_family_history(access_db, cur, legacy_to_uuid, admin_uid, args.dry_run)

        print("[4/9] Examinations (Exam)")
        totals["examinations"] = import_examinations(access_db, cur, legacy_to_uuid, exam_id_map, admin_uid, args.dry_run)

        print("[5/9] Investigations (ECG)")
        totals["investigations"] = import_investigations(access_db, cur, legacy_to_uuid, ecg_eid_map, admin_uid, args.dry_run)

        print("[6/9] Lab Results (Invest)")
        totals["lab_results"] = import_lab_results(access_db, cur, ecg_eid_map, args.dry_run)

        print("[7/9] Follow-ups (FollowUp)")
        totals["follow_ups"] = import_follow_ups(access_db, cur, legacy_to_uuid, admin_uid, args.dry_run)

        print("[8/9] Medications (dawa)")
        totals["medications"] = import_medications(access_db, cur, args.dry_run)

        print("[9/9] Reference Data (Tahl, Write)")
        totals["investigation_types"] = import_investigation_types(access_db, cur, args.dry_run)
        totals["dosage_instructions"] = import_dosage_instructions(access_db, cur, args.dry_run)

        # Commit
        if conn and not args.dry_run:
            conn.commit()
            print("\nTransaction committed successfully.")

        # Summary
        print("\n" + "=" * 50)
        print("IMPORT SUMMARY")
        print("=" * 50)
        total = 0
        for table, n in totals.items():
            print(f"  {table:.<30} {n:>6}")
            total += n
        print(f"  {'TOTAL':.<30} {total:>6}")

        if args.dry_run:
            print("\n(Dry run — nothing was written to the database.)")

    except Exception as e:
        if conn:
            conn.rollback()
            print(f"\nERROR: {e}", file=sys.stderr)
            print("Transaction rolled back.", file=sys.stderr)
        else:
            print(f"\nERROR: {e}", file=sys.stderr)
        sys.exit(1)

    finally:
        if conn:
            conn.close()


if __name__ == "__main__":
    main()
