from uuid import UUID

from fastapi import APIRouter, HTTPException, Request, status
from sqlalchemy import select

from app.core.deps import ClinicalStaff, DbSession
from app.models.enums import AuditAction
from app.models.past_family_history import PastFamilyHistory
from app.models.patient import Patient
from app.schemas.past_family_history import PastFamilyHistoryResponse, PastFamilyHistoryUpsert
from app.services.audit import log_audit

router = APIRouter(prefix="/api/patients/{patient_id}/past-family-history", tags=["past-family-history"])


@router.get("", response_model=PastFamilyHistoryResponse | None)
async def get_past_family_history(patient_id: UUID, db: DbSession, current_user: ClinicalStaff):
    result = await db.execute(
        select(PastFamilyHistory).where(PastFamilyHistory.patient_id == patient_id)
    )
    return result.scalar_one_or_none()


@router.put("", response_model=PastFamilyHistoryResponse)
async def upsert_past_family_history(
    patient_id: UUID, data: PastFamilyHistoryUpsert, db: DbSession, current_user: ClinicalStaff, request: Request,
):
    # Verify patient exists
    p = await db.execute(select(Patient).where(Patient.id == patient_id, Patient.deleted_at.is_(None)))
    if not p.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    result = await db.execute(
        select(PastFamilyHistory).where(PastFamilyHistory.patient_id == patient_id)
    )
    record = result.scalar_one_or_none()

    if record:
        old_values = {k: getattr(record, k) for k in data.model_dump()}
        for field, value in data.model_dump().items():
            setattr(record, field, value)
        record.updated_by = current_user.id
        action = AuditAction.update
    else:
        record = PastFamilyHistory(**data.model_dump(), patient_id=patient_id, updated_by=current_user.id)
        db.add(record)
        old_values = None
        action = AuditAction.create

    await db.flush()
    await log_audit(db, user_id=current_user.id, action=action, entity_type="past_family_history",
                    entity_id=record.id,
                    old_values={k: str(v) for k, v in old_values.items()} if old_values else None,
                    new_values=data.model_dump(mode="json"),
                    ip_address=request.client.host if request.client else None)
    await db.commit()
    await db.refresh(record)
    return record
