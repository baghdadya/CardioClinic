from uuid import UUID

from fastapi import APIRouter, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.deps import ClinicalStaff, DbSession
from app.models.enums import AuditAction
from app.models.investigation import Investigation
from app.models.lab_result import LabResult
from app.models.patient import Patient
from app.schemas.investigation import (
    InvestigationCreate,
    InvestigationResponse,
    InvestigationUpdate,
    LabResultCreate,
    LabResultResponse,
)
from app.services.audit import log_audit

router = APIRouter(prefix="/api/patients/{patient_id}/investigations", tags=["investigations"])


@router.post("", response_model=InvestigationResponse, status_code=status.HTTP_201_CREATED)
async def create_investigation(
    patient_id: UUID, data: InvestigationCreate, db: DbSession, current_user: ClinicalStaff, request: Request,
):
    p = await db.execute(select(Patient).where(Patient.id == patient_id, Patient.deleted_at.is_(None)))
    if not p.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    lab_data = data.lab_results
    inv_data = data.model_dump(exclude={"lab_results"})
    record = Investigation(**inv_data, patient_id=patient_id, recorded_by=current_user.id)
    db.add(record)
    await db.flush()

    for lab in lab_data:
        db.add(LabResult(**lab.model_dump(), investigation_id=record.id))

    await db.flush()
    await log_audit(db, user_id=current_user.id, action=AuditAction.create, entity_type="investigations",
                    entity_id=record.id, new_values=data.model_dump(mode="json"),
                    ip_address=request.client.host if request.client else None)
    await db.commit()

    result = await db.execute(
        select(Investigation).where(Investigation.id == record.id).options(selectinload(Investigation.lab_results))
    )
    return result.scalar_one()


@router.get("", response_model=list[InvestigationResponse])
async def list_investigations(patient_id: UUID, db: DbSession, current_user: ClinicalStaff):
    result = await db.execute(
        select(Investigation).where(Investigation.patient_id == patient_id)
        .options(selectinload(Investigation.lab_results))
        .order_by(Investigation.investigation_date.desc())
    )
    return result.scalars().all()


@router.get("/{record_id}", response_model=InvestigationResponse)
async def get_investigation(patient_id: UUID, record_id: UUID, db: DbSession, current_user: ClinicalStaff):
    result = await db.execute(
        select(Investigation).where(Investigation.id == record_id, Investigation.patient_id == patient_id)
        .options(selectinload(Investigation.lab_results))
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")
    return record


@router.patch("/{record_id}", response_model=InvestigationResponse)
async def update_investigation(
    patient_id: UUID, record_id: UUID, data: InvestigationUpdate, db: DbSession, current_user: ClinicalStaff, request: Request,
):
    result = await db.execute(
        select(Investigation).where(Investigation.id == record_id, Investigation.patient_id == patient_id)
        .options(selectinload(Investigation.lab_results))
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(record, field, value)
    await db.flush()
    await log_audit(db, user_id=current_user.id, action=AuditAction.update, entity_type="investigations",
                    entity_id=record.id, new_values=data.model_dump(exclude_unset=True, mode="json"),
                    ip_address=request.client.host if request.client else None)
    await db.commit()
    await db.refresh(record)
    return record


# Lab results sub-endpoints
@router.post("/{investigation_id}/labs", response_model=LabResultResponse, status_code=status.HTTP_201_CREATED)
async def add_lab_result(
    patient_id: UUID, investigation_id: UUID, data: LabResultCreate, db: DbSession, current_user: ClinicalStaff, request: Request,
):
    result = await db.execute(
        select(Investigation).where(Investigation.id == investigation_id, Investigation.patient_id == patient_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Investigation not found")

    lab = LabResult(**data.model_dump(), investigation_id=investigation_id)
    db.add(lab)
    await db.flush()
    await log_audit(db, user_id=current_user.id, action=AuditAction.create, entity_type="lab_results",
                    entity_id=lab.id, new_values=data.model_dump(mode="json"),
                    ip_address=request.client.host if request.client else None)
    await db.commit()
    await db.refresh(lab)
    return lab
