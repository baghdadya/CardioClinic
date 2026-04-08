from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, Request, status
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.core.deps import ClinicalStaff, DbSession, DoctorOnly
from app.models.enums import AuditAction, PrescriptionStatus
from app.models.medication import MedicationMaster
from app.models.patient import Patient
from app.models.prescription import Prescription
from app.models.prescription_item import PrescriptionItem
from app.models.user import User
from app.schemas.prescription import (
    PrescriptionCreate,
    PrescriptionItemResponse,
    PrescriptionResponse,
    VoidPrescriptionRequest,
)
from app.services.audit import log_audit

router = APIRouter(tags=["prescriptions"])


# ---------------------------------------------------------------------------
# Helpers — enrich prescription response with names
# ---------------------------------------------------------------------------
async def _enrich_prescription(db, rx: Prescription) -> PrescriptionResponse:
    """Convert ORM prescription to response with resolved names."""
    # Resolve patient name
    patient_name = None
    p_result = await db.execute(select(Patient.full_name).where(Patient.id == rx.patient_id))
    row = p_result.first()
    if row:
        patient_name = row[0]

    # Resolve prescriber name
    prescriber_name = None
    u_result = await db.execute(select(User.full_name).where(User.id == rx.prescribed_by))
    row = u_result.first()
    if row:
        prescriber_name = row[0]

    # Resolve medication names for items
    med_ids = [item.medication_id for item in rx.items]
    med_names: dict[UUID, str] = {}
    if med_ids:
        med_result = await db.execute(
            select(MedicationMaster.id, MedicationMaster.name)
            .where(MedicationMaster.id.in_(med_ids))
        )
        med_names = {mid: mname for mid, mname in med_result.all()}

    items = []
    for item in sorted(rx.items, key=lambda x: x.sort_order):
        item_dict = PrescriptionItemResponse.model_validate(item).model_dump()
        item_dict["medication_name"] = med_names.get(item.medication_id)
        items.append(PrescriptionItemResponse(**item_dict))

    resp = PrescriptionResponse.model_validate(rx)
    resp.patient_name = patient_name
    resp.prescriber_name = prescriber_name
    resp.items = items
    return resp


async def _enrich_many(db, prescriptions: list[Prescription]) -> list[PrescriptionResponse]:
    """Batch-enrich multiple prescriptions."""
    if not prescriptions:
        return []

    # Collect all IDs
    patient_ids = {rx.patient_id for rx in prescriptions}
    user_ids = {rx.prescribed_by for rx in prescriptions}
    med_ids = set()
    for rx in prescriptions:
        for item in rx.items:
            med_ids.add(item.medication_id)

    # Batch fetch
    p_result = await db.execute(select(Patient.id, Patient.full_name).where(Patient.id.in_(patient_ids)))
    patient_names = dict(p_result.all())

    u_result = await db.execute(select(User.id, User.full_name).where(User.id.in_(user_ids)))
    user_names = dict(u_result.all())

    med_names: dict[UUID, str] = {}
    if med_ids:
        m_result = await db.execute(
            select(MedicationMaster.id, MedicationMaster.name).where(MedicationMaster.id.in_(med_ids))
        )
        med_names = dict(m_result.all())

    results = []
    for rx in prescriptions:
        items = []
        for item in sorted(rx.items, key=lambda x: x.sort_order):
            item_dict = PrescriptionItemResponse.model_validate(item).model_dump()
            item_dict["medication_name"] = med_names.get(item.medication_id)
            items.append(PrescriptionItemResponse(**item_dict))

        resp = PrescriptionResponse.model_validate(rx)
        resp.patient_name = patient_names.get(rx.patient_id)
        resp.prescriber_name = user_names.get(rx.prescribed_by)
        resp.items = items
        results.append(resp)

    return results


# ---------------------------------------------------------------------------
# Standalone prescriptions list (all patients)
# ---------------------------------------------------------------------------
@router.get("/api/prescriptions", response_model=dict)
async def list_all_prescriptions(
    db: DbSession,
    current_user: ClinicalStaff,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    patient_id: Optional[UUID] = None,
    search: Optional[str] = None,
):
    """List prescriptions across all patients with pagination."""
    query = select(Prescription).options(selectinload(Prescription.items))

    if status_filter:
        query = query.where(Prescription.status == status_filter)
    if patient_id:
        query = query.where(Prescription.patient_id == patient_id)

    # Count
    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar() or 0

    # Fetch page
    query = query.order_by(Prescription.prescribed_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    prescriptions = list(result.scalars().all())

    enriched = await _enrich_many(db, prescriptions)

    return {
        "items": [r.model_dump(mode="json") for r in enriched],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


# ---------------------------------------------------------------------------
# Blank prescription PDF
# ---------------------------------------------------------------------------
class BlankPdfRequest(BaseModel):
    patient_id: Optional[UUID] = None


@router.post("/api/prescriptions/blank-pdf")
async def generate_blank_pdf(
    db: DbSession,
    current_user: DoctorOnly,
    body: Optional[BlankPdfRequest] = None,
):
    """Generate a blank prescription PDF (letterhead only, for handwriting)."""
    from app.services.pdf import generate_blank_prescription_pdf

    patient_id = body.patient_id if body else None
    try:
        filepath = await generate_blank_prescription_pdf(db, patient_id=patient_id)
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail=str(e))

    return FileResponse(filepath, media_type="application/pdf", filename="prescription_blank.pdf")


# ---------------------------------------------------------------------------
# Patient-scoped endpoints (existing)
# ---------------------------------------------------------------------------
@router.post(
    "/api/patients/{patient_id}/prescriptions",
    response_model=PrescriptionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_prescription(
    patient_id: UUID, data: PrescriptionCreate, db: DbSession, current_user: DoctorOnly, request: Request,
):
    p = await db.execute(select(Patient).where(Patient.id == patient_id, Patient.deleted_at.is_(None)))
    if not p.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    rx = Prescription(patient_id=patient_id, prescribed_by=current_user.id, notes=data.notes)
    db.add(rx)
    await db.flush()

    for item_data in data.items:
        item = PrescriptionItem(**item_data.model_dump(), prescription_id=rx.id)
        db.add(item)

    await db.flush()
    await log_audit(db, user_id=current_user.id, action=AuditAction.create, entity_type="prescriptions",
                    entity_id=rx.id, new_values=data.model_dump(mode="json"),
                    ip_address=request.client.host if request.client else None)
    await db.commit()

    result = await db.execute(
        select(Prescription).where(Prescription.id == rx.id).options(selectinload(Prescription.items))
    )
    rx = result.scalar_one()
    return await _enrich_prescription(db, rx)


@router.get("/api/patients/{patient_id}/prescriptions", response_model=list[PrescriptionResponse])
async def list_prescriptions(patient_id: UUID, db: DbSession, current_user: ClinicalStaff):
    result = await db.execute(
        select(Prescription).where(Prescription.patient_id == patient_id)
        .options(selectinload(Prescription.items))
        .order_by(Prescription.prescribed_at.desc())
    )
    prescriptions = list(result.scalars().all())
    return await _enrich_many(db, prescriptions)


@router.get("/api/patients/{patient_id}/prescriptions/{rx_id}", response_model=PrescriptionResponse)
async def get_prescription(patient_id: UUID, rx_id: UUID, db: DbSession, current_user: ClinicalStaff):
    result = await db.execute(
        select(Prescription).where(Prescription.id == rx_id, Prescription.patient_id == patient_id)
        .options(selectinload(Prescription.items))
    )
    rx = result.scalar_one_or_none()
    if not rx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found")
    return await _enrich_prescription(db, rx)


@router.post("/api/patients/{patient_id}/prescriptions/{rx_id}/finalize", response_model=PrescriptionResponse)
async def finalize_prescription(
    patient_id: UUID, rx_id: UUID, db: DbSession, current_user: DoctorOnly, request: Request,
):
    result = await db.execute(
        select(Prescription).where(Prescription.id == rx_id, Prescription.patient_id == patient_id)
        .options(selectinload(Prescription.items))
    )
    rx = result.scalar_one_or_none()
    if not rx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found")
    if rx.status != PrescriptionStatus.draft:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only draft prescriptions can be finalized")
    if not rx.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot finalize empty prescription")

    rx.status = PrescriptionStatus.finalized
    rx.finalized_at = datetime.now(timezone.utc)
    await db.flush()
    await log_audit(db, user_id=current_user.id, action=AuditAction.update, entity_type="prescriptions",
                    entity_id=rx.id, old_values={"status": "draft"}, new_values={"status": "finalized"},
                    ip_address=request.client.host if request.client else None)
    await db.commit()
    await db.refresh(rx)
    return await _enrich_prescription(db, rx)


class GeneratePdfRequest(BaseModel):
    instruction_ids: list[UUID] = []


@router.post("/api/patients/{patient_id}/prescriptions/{rx_id}/pdf")
async def generate_pdf(
    patient_id: UUID,
    rx_id: UUID,
    db: DbSession,
    current_user: DoctorOnly,
    body: Optional[GeneratePdfRequest] = None,
):
    from app.services.pdf import generate_prescription_pdf

    result = await db.execute(
        select(Prescription).where(Prescription.id == rx_id, Prescription.patient_id == patient_id)
    )
    rx = result.scalar_one_or_none()
    if not rx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found")

    instruction_ids = body.instruction_ids if body else []

    try:
        filepath = await generate_prescription_pdf(db, rx_id, instruction_ids=instruction_ids or None)
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail=str(e))

    return FileResponse(filepath, media_type="application/pdf", filename=f"prescription_{str(rx_id)[:8]}.pdf")


class EmailPrescriptionRequest(BaseModel):
    email_override: Optional[str] = None


@router.post("/api/patients/{patient_id}/prescriptions/{rx_id}/email")
async def email_prescription(
    patient_id: UUID, rx_id: UUID, db: DbSession, current_user: DoctorOnly,
    body: Optional[EmailPrescriptionRequest] = None,
):
    from app.core.config import settings
    from app.services.email import send_prescription_email
    from app.services.pdf import generate_prescription_pdf

    if not settings.SMTP_HOST:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Email not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD, SMTP_FROM_EMAIL in backend/.env",
        )

    result = await db.execute(
        select(Prescription).where(Prescription.id == rx_id, Prescription.patient_id == patient_id)
    )
    rx = result.scalar_one_or_none()
    if not rx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found")

    # Auto-generate PDF if not already generated
    if not rx.pdf_path:
        try:
            await generate_prescription_pdf(db, rx_id)
            await db.refresh(rx)
        except RuntimeError as e:
            raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail=str(e))

    patient_result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = patient_result.scalar_one()

    # Use override email from dialog, or patient's email on file
    to_email = (body.email_override if body and body.email_override else None) or patient.email
    if not to_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No email address provided")

    success = await send_prescription_email(
        db, to_email, patient.full_name, rx.pdf_path, current_user.id,
    )
    if not success:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Failed to send email — check SMTP configuration")

    return {"message": f"Prescription emailed to {to_email}"}


@router.post("/api/patients/{patient_id}/prescriptions/{rx_id}/void", response_model=PrescriptionResponse)
async def void_prescription(
    patient_id: UUID, rx_id: UUID, data: VoidPrescriptionRequest, db: DbSession, current_user: DoctorOnly, request: Request,
):
    result = await db.execute(
        select(Prescription).where(Prescription.id == rx_id, Prescription.patient_id == patient_id)
        .options(selectinload(Prescription.items))
    )
    rx = result.scalar_one_or_none()
    if not rx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found")
    if rx.status == PrescriptionStatus.voided:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Prescription already voided")

    old_status = rx.status.value
    rx.status = PrescriptionStatus.voided
    rx.voided_at = datetime.now(timezone.utc)
    rx.void_reason = data.reason
    await db.flush()
    await log_audit(db, user_id=current_user.id, action=AuditAction.update, entity_type="prescriptions",
                    entity_id=rx.id, old_values={"status": old_status},
                    new_values={"status": "voided", "void_reason": data.reason},
                    ip_address=request.client.host if request.client else None)
    await db.commit()
    await db.refresh(rx)
    return await _enrich_prescription(db, rx)
