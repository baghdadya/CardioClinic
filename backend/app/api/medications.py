import asyncio
import json
import logging
from pathlib import Path
from uuid import UUID

import httpx
from fastapi import APIRouter, HTTPException, Query, Request, status
from sqlalchemy import func, or_, select

from app.core.deps import ClinicalStaff, DbSession, DoctorOnly
from app.models.enums import AuditAction
from app.models.medication import MedicationMaster
from app.models.patient import Patient
from app.models.patient_medication import PatientMedication
from app.schemas.medication import (
    EgyptianSyncResponse,
    FdaBulkImportRequest,
    FdaBulkImportResponse,
    MedicationListItem,
    MedicationMasterCreate,
    MedicationMasterResponse,
    MedicationMasterUpdate,
    PatientMedicationCreate,
    PatientMedicationResponse,
    PatientMedicationUpdate,
)
from app.services.audit import log_audit

logger = logging.getLogger(__name__)

router = APIRouter(tags=["medications"])


# --- Medication Master Catalog ---

@router.post("/api/medications", response_model=MedicationMasterResponse, status_code=status.HTTP_201_CREATED)
async def create_medication(data: MedicationMasterCreate, db: DbSession, current_user: DoctorOnly, request: Request):
    med = MedicationMaster(**data.model_dump())
    db.add(med)
    await db.flush()
    await log_audit(db, user_id=current_user.id, action=AuditAction.create, entity_type="medications_master",
                    entity_id=med.id, new_values=data.model_dump(mode="json"),
                    ip_address=request.client.host if request.client else None)
    await db.commit()
    await db.refresh(med)
    return med


@router.get("/api/medications", response_model=list[MedicationListItem])
async def list_medications(
    db: DbSession, current_user: ClinicalStaff,
    search: str | None = Query(None, min_length=1),
    active_only: bool = True,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
):
    query = select(
        MedicationMaster.id, MedicationMaster.name, MedicationMaster.name_ar,
        MedicationMaster.generic_name, MedicationMaster.category,
        MedicationMaster.default_dosage, MedicationMaster.is_active,
    )
    if active_only:
        query = query.where(MedicationMaster.is_active.is_(True))
    if search:
        query = query.where(or_(
            MedicationMaster.name.ilike(f"%{search}%"),
            MedicationMaster.name_ar.ilike(f"%{search}%"),
            MedicationMaster.generic_name.ilike(f"%{search}%"),
        ))
    offset = (page - 1) * page_size
    result = await db.execute(query.order_by(MedicationMaster.name).offset(offset).limit(page_size))
    return result.all()


@router.patch("/api/medications/{med_id}", response_model=MedicationMasterResponse)
async def update_medication(
    med_id: UUID, data: MedicationMasterUpdate, db: DbSession, current_user: DoctorOnly, request: Request,
):
    result = await db.execute(select(MedicationMaster).where(MedicationMaster.id == med_id))
    med = result.scalar_one_or_none()
    if not med:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(med, field, value)
    await db.flush()
    await log_audit(db, user_id=current_user.id, action=AuditAction.update, entity_type="medications_master",
                    entity_id=med.id, new_values=data.model_dump(exclude_unset=True, mode="json"),
                    ip_address=request.client.host if request.client else None)
    await db.commit()
    await db.refresh(med)
    return med


# --- FDA Bulk Import ---

DEFAULT_CARDIOLOGY_CLASSES = [
    "Angiotensin Converting Enzyme Inhibitor",
    "Angiotensin 2 Receptor Blocker",
    "Beta Adrenergic Blocker",
    "Calcium Channel Blocker",
    "HMG-CoA Reductase Inhibitor",
    "Anticoagulant",
    "Platelet Aggregation Inhibitor",
    "Loop Diuretic",
    "Thiazide Diuretic",
    "Potassium Sparing Diuretic",
    "Cardiac Glycoside",
    "Antiarrhythmic",
    "Vasodilator",
    "Nitrate Vasodilator",
    "SGLT2 Inhibitor",
    "Neprilysin Inhibitor",
]

FDA_API_BASE = "https://api.fda.gov/drug/label.json"
FDA_RATE_LIMIT_DELAY = 0.5  # seconds between requests


async def _fetch_fda_class(client: httpx.AsyncClient, pharm_class: str) -> list[dict]:
    """Fetch drugs for a single pharmacologic class from OpenFDA."""
    results = []
    try:
        url = f'{FDA_API_BASE}?search=openfda.pharm_class_epc:"{pharm_class}"&limit=100'
        resp = await client.get(url, timeout=30.0)
        if resp.status_code == 404:
            return []
        resp.raise_for_status()
        data = resp.json()
        for item in data.get("results", []):
            openfda = item.get("openfda", {})
            brand_names = openfda.get("brand_name", [])
            generic_names = openfda.get("generic_name", [])
            pharm_classes = openfda.get("pharm_class_epc", [])
            if not brand_names:
                continue
            results.append({
                "brand_name": brand_names[0].title()[:255],
                "generic_name": generic_names[0].title()[:255] if generic_names else None,
                "category": (pharm_classes[0] if pharm_classes else pharm_class)[:100],
            })
    except httpx.HTTPStatusError as e:
        logger.warning("FDA API error for class '%s': %s", pharm_class, e)
    except Exception as e:
        logger.warning("Unexpected error fetching FDA class '%s': %s", pharm_class, e)
    return results


@router.post("/api/medications/import-fda", response_model=FdaBulkImportResponse)
async def import_fda_medications(
    body: FdaBulkImportRequest,
    db: DbSession,
    current_user: DoctorOnly,
    request: Request,
):
    """Bulk-import cardiology medications from the OpenFDA drug label API."""
    categories = body.categories if body.categories else DEFAULT_CARDIOLOGY_CLASSES
    errors: list[str] = []
    all_drugs: list[dict] = []

    # Fetch from FDA with rate limiting
    async with httpx.AsyncClient() as client:
        for i, pharm_class in enumerate(categories):
            if i > 0:
                await asyncio.sleep(FDA_RATE_LIMIT_DELAY)
            try:
                drugs = await _fetch_fda_class(client, pharm_class)
                all_drugs.extend(drugs)
            except Exception as e:
                errors.append(f"Failed to fetch '{pharm_class}': {str(e)}")

    total_found = len(all_drugs)

    # Deduplicate by generic_name (case-insensitive), prefer first occurrence
    seen_generic: dict[str, dict] = {}
    for drug in all_drugs:
        key = (drug.get("generic_name") or drug["brand_name"]).lower()
        if key not in seen_generic:
            seen_generic[key] = drug

    unique_drugs = list(seen_generic.values())

    # Get existing generic names from database
    existing_result = await db.execute(
        select(func.lower(MedicationMaster.generic_name)).where(
            MedicationMaster.generic_name.is_not(None)
        )
    )
    existing_generics = {row[0] for row in existing_result.all()}

    # Also check by name
    existing_names_result = await db.execute(
        select(func.lower(MedicationMaster.name))
    )
    existing_names = {row[0] for row in existing_names_result.all()}

    imported_count = 0
    skipped_duplicates = 0

    for drug in unique_drugs:
        generic_key = (drug.get("generic_name") or "").lower()
        name_key = drug["brand_name"].lower()

        if (generic_key and generic_key in existing_generics) or name_key in existing_names:
            skipped_duplicates += 1
            continue

        med = MedicationMaster(
            name=drug["brand_name"][:255],
            generic_name=(drug.get("generic_name") or "")[:255] or None,
            category=(drug.get("category") or "")[:100] or None,
            is_active=True,
        )
        db.add(med)
        imported_count += 1

        # Track to avoid inserting duplicates within the same batch
        if generic_key:
            existing_generics.add(generic_key)
        existing_names.add(name_key)

    if imported_count > 0:
        await db.flush()
        await log_audit(
            db,
            user_id=current_user.id,
            action=AuditAction.create,
            entity_type="medications_master",
            entity_id=current_user.id,  # bulk action, use user id as reference
            new_values={"action": "fda_bulk_import", "imported_count": imported_count},
            ip_address=request.client.host if request.client else None,
        )
        await db.commit()

    return FdaBulkImportResponse(
        imported_count=imported_count,
        skipped_duplicates=skipped_duplicates,
        total_found=total_found,
        errors=errors,
    )


# --- Egyptian Drug Catalog Sync ---

EGYPTIAN_DRUGS_PATH = Path(__file__).resolve().parent.parent / "data" / "egyptian_drugs.json"


def _load_egyptian_catalog() -> list[dict]:
    """Load the local Egyptian drug catalog JSON file."""
    if not EGYPTIAN_DRUGS_PATH.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Egyptian drug catalog not found at {EGYPTIAN_DRUGS_PATH}",
        )
    with open(EGYPTIAN_DRUGS_PATH, encoding="utf-8") as f:
        return json.load(f)


@router.post("/api/medications/sync-egyptian", response_model=EgyptianSyncResponse)
async def sync_egyptian_drugs(
    db: DbSession,
    current_user: DoctorOnly,
    request: Request,
):
    """Sync Egyptian brand-name medications from the local JSON catalog.

    For each drug in the catalog:
    - If a medication with the same generic_name already exists (case-insensitive),
      update its name to the Egyptian brand and set name_ar if not already populated.
    - If no match exists, insert as a new medication.

    This is an idempotent upsert -- safe to run repeatedly.
    """
    catalog = _load_egyptian_catalog()
    total_in_catalog = len(catalog)
    new_count = 0
    updated_count = 0

    # Pre-load existing medications keyed by lowercase generic_name
    result = await db.execute(select(MedicationMaster))
    all_meds = result.scalars().all()
    generic_map: dict[str, MedicationMaster] = {}
    name_map: dict[str, MedicationMaster] = {}
    for med in all_meds:
        if med.generic_name:
            generic_map[med.generic_name.lower()] = med
        name_map[med.name.lower()] = med

    for drug in catalog:
        generic_key = (drug.get("generic_name") or "").lower()
        name_key = drug["name"].lower()

        existing = generic_map.get(generic_key) if generic_key else None
        # Also check by exact brand name to avoid duplicates
        if existing is None:
            existing = name_map.get(name_key)

        if existing is not None:
            changed = False
            # Update name to Egyptian brand if it differs
            if existing.name.lower() != name_key:
                existing.name = drug["name"]
                changed = True
            # Set Arabic name if not already set
            if not existing.name_ar and drug.get("name_ar"):
                existing.name_ar = drug["name_ar"]
                changed = True
            # Set category if not already set
            if not existing.category and drug.get("category"):
                existing.category = drug["category"]
                changed = True
            # Set default_dosage if not already set
            if not existing.default_dosage and drug.get("default_dosage"):
                existing.default_dosage = drug["default_dosage"]
                changed = True
            if changed:
                updated_count += 1
        else:
            # Insert new medication
            med = MedicationMaster(
                name=drug["name"][:255],
                name_ar=(drug.get("name_ar") or "")[:255] or None,
                generic_name=(drug.get("generic_name") or "")[:255] or None,
                category=(drug.get("category") or "")[:100] or None,
                default_dosage=(drug.get("default_dosage") or "")[:100] or None,
                is_active=True,
            )
            db.add(med)
            new_count += 1
            # Track to prevent duplicates within the same batch
            if generic_key:
                generic_map[generic_key] = med
            name_map[name_key] = med

    synced_count = new_count + updated_count

    if synced_count > 0:
        await db.flush()
        await log_audit(
            db,
            user_id=current_user.id,
            action=AuditAction.create,
            entity_type="medications_master",
            entity_id=current_user.id,
            new_values={
                "action": "egyptian_catalog_sync",
                "new_count": new_count,
                "updated_count": updated_count,
                "total_in_catalog": total_in_catalog,
            },
            ip_address=request.client.host if request.client else None,
        )
        await db.commit()

    return EgyptianSyncResponse(
        synced_count=synced_count,
        new_count=new_count,
        updated_count=updated_count,
        total_in_catalog=total_in_catalog,
    )



# --- Patient Medications ---

@router.post("/api/patients/{patient_id}/medications", response_model=PatientMedicationResponse, status_code=status.HTTP_201_CREATED)
async def add_patient_medication(
    patient_id: UUID, data: PatientMedicationCreate, db: DbSession, current_user: DoctorOnly, request: Request,
):
    p = await db.execute(select(Patient).where(Patient.id == patient_id, Patient.deleted_at.is_(None)))
    if not p.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    record = PatientMedication(**data.model_dump(), patient_id=patient_id, prescribed_by=current_user.id)
    db.add(record)
    await db.flush()
    await log_audit(db, user_id=current_user.id, action=AuditAction.create, entity_type="patient_medications",
                    entity_id=record.id, new_values=data.model_dump(mode="json"),
                    ip_address=request.client.host if request.client else None)
    await db.commit()
    await db.refresh(record)
    return record


@router.get("/api/patients/{patient_id}/medications", response_model=list[PatientMedicationResponse])
async def list_patient_medications(
    patient_id: UUID, db: DbSession, current_user: ClinicalStaff,
    current_only: bool = Query(True),
):
    query = select(PatientMedication).where(PatientMedication.patient_id == patient_id)
    if current_only:
        query = query.where(PatientMedication.ended_at.is_(None))
    result = await db.execute(query.order_by(PatientMedication.started_at.desc()))
    return result.scalars().all()


@router.patch("/api/patients/{patient_id}/medications/{med_id}", response_model=PatientMedicationResponse)
async def update_patient_medication(
    patient_id: UUID, med_id: UUID, data: PatientMedicationUpdate, db: DbSession, current_user: DoctorOnly, request: Request,
):
    result = await db.execute(
        select(PatientMedication).where(PatientMedication.id == med_id, PatientMedication.patient_id == patient_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication record not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(record, field, value)
    await db.flush()
    await log_audit(db, user_id=current_user.id, action=AuditAction.update, entity_type="patient_medications",
                    entity_id=record.id, new_values=data.model_dump(exclude_unset=True, mode="json"),
                    ip_address=request.client.host if request.client else None)
    await db.commit()
    await db.refresh(record)
    return record
