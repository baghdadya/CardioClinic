from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.deps import ClinicalStaff, DbSession, DoctorOnly
from app.models.enums import AuditAction, PrescriptionStatus
from app.models.patient import Patient
from app.models.prescription import Prescription
from app.models.prescription_item import PrescriptionItem
from app.schemas.prescription import (
    PrescriptionCreate,
    PrescriptionResponse,
    VoidPrescriptionRequest,
)
from app.services.audit import log_audit

router = APIRouter(prefix="/api/patients/{patient_id}/prescriptions", tags=["prescriptions"])


@router.post("", response_model=PrescriptionResponse, status_code=status.HTTP_201_CREATED)
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
    return result.scalar_one()


@router.get("", response_model=list[PrescriptionResponse])
async def list_prescriptions(patient_id: UUID, db: DbSession, current_user: ClinicalStaff):
    result = await db.execute(
        select(Prescription).where(Prescription.patient_id == patient_id)
        .options(selectinload(Prescription.items))
        .order_by(Prescription.prescribed_at.desc())
    )
    return result.scalars().all()


@router.get("/{rx_id}", response_model=PrescriptionResponse)
async def get_prescription(patient_id: UUID, rx_id: UUID, db: DbSession, current_user: ClinicalStaff):
    result = await db.execute(
        select(Prescription).where(Prescription.id == rx_id, Prescription.patient_id == patient_id)
        .options(selectinload(Prescription.items))
    )
    rx = result.scalar_one_or_none()
    if not rx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found")
    return rx


@router.post("/{rx_id}/finalize", response_model=PrescriptionResponse)
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
    return rx


class GeneratePdfRequest(BaseModel):
    """Optional body for PDF generation — allows attaching patient instructions."""
    instruction_ids: list[UUID] = []


@router.post("/{rx_id}/pdf")
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


@router.post("/{rx_id}/email")
async def email_prescription(
    patient_id: UUID, rx_id: UUID, db: DbSession, current_user: DoctorOnly,
):
    from app.services.email import send_prescription_email

    result = await db.execute(
        select(Prescription).where(Prescription.id == rx_id, Prescription.patient_id == patient_id)
    )
    rx = result.scalar_one_or_none()
    if not rx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found")
    if not rx.pdf_path:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Generate PDF first")

    patient_result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = patient_result.scalar_one()
    if not patient.email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Patient has no email on file")

    success = await send_prescription_email(
        db, patient.email, patient.full_name, rx.pdf_path, current_user.id,
    )
    if not success:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Failed to send email")

    return {"message": "Prescription emailed successfully"}


@router.post("/{rx_id}/void", response_model=PrescriptionResponse)
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
    return rx


