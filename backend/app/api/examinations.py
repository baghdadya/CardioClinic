from uuid import UUID

from fastapi import APIRouter, HTTPException, Request, status
from sqlalchemy import select

from app.core.deps import ClinicalStaff, DbSession
from app.models.enums import AuditAction
from app.models.examination import Examination
from app.models.patient import Patient
from app.schemas.examination import ExaminationCreate, ExaminationResponse, ExaminationUpdate
from app.services.audit import log_audit

router = APIRouter(prefix="/api/patients/{patient_id}/examinations", tags=["examinations"])


@router.post("", response_model=ExaminationResponse, status_code=status.HTTP_201_CREATED)
async def create_examination(
    patient_id: UUID, data: ExaminationCreate, db: DbSession, current_user: ClinicalStaff, request: Request,
):
    p = await db.execute(select(Patient).where(Patient.id == patient_id, Patient.deleted_at.is_(None)))
    if not p.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    record = Examination(**data.model_dump(), patient_id=patient_id, examined_by=current_user.id)
    db.add(record)
    await db.flush()
    await log_audit(db, user_id=current_user.id, action=AuditAction.create, entity_type="examinations",
                    entity_id=record.id, new_values=data.model_dump(mode="json"),
                    ip_address=request.client.host if request.client else None)
    await db.commit()
    await db.refresh(record)
    return record


@router.get("", response_model=list[ExaminationResponse])
async def list_examinations(patient_id: UUID, db: DbSession, current_user: ClinicalStaff):
    result = await db.execute(
        select(Examination).where(Examination.patient_id == patient_id)
        .order_by(Examination.examined_at.desc())
    )
    return result.scalars().all()


@router.get("/{record_id}", response_model=ExaminationResponse)
async def get_examination(patient_id: UUID, record_id: UUID, db: DbSession, current_user: ClinicalStaff):
    result = await db.execute(
        select(Examination).where(Examination.id == record_id, Examination.patient_id == patient_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")
    return record


@router.patch("/{record_id}", response_model=ExaminationResponse)
async def update_examination(
    patient_id: UUID, record_id: UUID, data: ExaminationUpdate, db: DbSession, current_user: ClinicalStaff, request: Request,
):
    result = await db.execute(
        select(Examination).where(Examination.id == record_id, Examination.patient_id == patient_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(record, field, value)
    await db.flush()
    await log_audit(db, user_id=current_user.id, action=AuditAction.update, entity_type="examinations",
                    entity_id=record.id, new_values=data.model_dump(exclude_unset=True, mode="json"),
                    ip_address=request.client.host if request.client else None)
    await db.commit()
    await db.refresh(record)
    return record
