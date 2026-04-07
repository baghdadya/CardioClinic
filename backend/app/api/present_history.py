from uuid import UUID

from fastapi import APIRouter, HTTPException, Request, status
from sqlalchemy import select

from app.core.deps import ClinicalStaff, DbSession
from app.models.enums import AuditAction
from app.models.patient import Patient
from app.models.present_history import PresentHistory
from app.schemas.present_history import (
    PresentHistoryCreate,
    PresentHistoryResponse,
    PresentHistoryUpdate,
)
from app.services.audit import log_audit

router = APIRouter(prefix="/api/patients/{patient_id}/present-history", tags=["present-history"])


async def _get_patient_or_404(db, patient_id: UUID) -> Patient:
    result = await db.execute(
        select(Patient).where(Patient.id == patient_id, Patient.deleted_at.is_(None))
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return patient


@router.post("", response_model=PresentHistoryResponse, status_code=status.HTTP_201_CREATED)
async def create_present_history(
    patient_id: UUID, data: PresentHistoryCreate, db: DbSession, current_user: ClinicalStaff, request: Request,
):
    await _get_patient_or_404(db, patient_id)
    record = PresentHistory(**data.model_dump(), patient_id=patient_id, recorded_by=current_user.id)
    db.add(record)
    await db.flush()
    await log_audit(db, user_id=current_user.id, action=AuditAction.create, entity_type="present_history",
                    entity_id=record.id, new_values=data.model_dump(mode="json"),
                    ip_address=request.client.host if request.client else None)
    await db.commit()
    await db.refresh(record)
    return record


@router.get("", response_model=list[PresentHistoryResponse])
async def list_present_history(patient_id: UUID, db: DbSession, current_user: ClinicalStaff):
    await _get_patient_or_404(db, patient_id)
    result = await db.execute(
        select(PresentHistory).where(PresentHistory.patient_id == patient_id)
        .order_by(PresentHistory.recorded_at.desc())
    )
    return result.scalars().all()


@router.get("/{record_id}", response_model=PresentHistoryResponse)
async def get_present_history(patient_id: UUID, record_id: UUID, db: DbSession, current_user: ClinicalStaff):
    result = await db.execute(
        select(PresentHistory).where(PresentHistory.id == record_id, PresentHistory.patient_id == patient_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")
    return record


@router.patch("/{record_id}", response_model=PresentHistoryResponse)
async def update_present_history(
    patient_id: UUID, record_id: UUID, data: PresentHistoryUpdate, db: DbSession, current_user: ClinicalStaff, request: Request,
):
    result = await db.execute(
        select(PresentHistory).where(PresentHistory.id == record_id, PresentHistory.patient_id == patient_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")

    update_data = data.model_dump(exclude_unset=True)
    old_values = {k: getattr(record, k) for k in update_data}
    for field, value in update_data.items():
        setattr(record, field, value)
    await db.flush()
    await log_audit(db, user_id=current_user.id, action=AuditAction.update, entity_type="present_history",
                    entity_id=record.id, old_values={k: str(v) for k, v in old_values.items()},
                    new_values=data.model_dump(exclude_unset=True, mode="json"),
                    ip_address=request.client.host if request.client else None)
    await db.commit()
    await db.refresh(record)
    return record
