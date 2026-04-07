from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, Request, status
from sqlalchemy import func, or_, select

from app.core.deps import AnyStaff, DbSession
from app.models.enums import AuditAction
from app.models.patient import Patient
from app.schemas.patient import (
    PatientCreate,
    PatientListResponse,
    PatientResponse,
    PatientUpdate,
)
from app.services.audit import log_audit

router = APIRouter(prefix="/api/patients", tags=["patients"])


@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
async def create_patient(
    data: PatientCreate,
    db: DbSession,
    current_user: AnyStaff,
    request: Request,
):
    patient = Patient(**data.model_dump())
    db.add(patient)
    await db.flush()

    await log_audit(
        db,
        user_id=current_user.id,
        action=AuditAction.create,
        entity_type="patients",
        entity_id=patient.id,
        new_values=data.model_dump(mode="json"),
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    await db.commit()
    await db.refresh(patient)
    return patient


@router.get("", response_model=PatientListResponse)
async def list_patients(
    db: DbSession,
    current_user: AnyStaff,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None, min_length=1),
):
    base_query = select(Patient).where(Patient.deleted_at.is_(None))

    if search:
        search_filter = or_(
            Patient.full_name.ilike(f"%{search}%"),
            Patient.full_name_ar.ilike(f"%{search}%"),
            Patient.phone.ilike(f"%{search}%"),
            Patient.email.ilike(f"%{search}%"),
        )
        base_query = base_query.where(search_filter)

    # Count total
    count_query = select(func.count()).select_from(base_query.subquery())
    total = (await db.execute(count_query)).scalar_one()

    # Paginate
    offset = (page - 1) * page_size
    results = await db.execute(
        base_query.order_by(Patient.full_name).offset(offset).limit(page_size)
    )
    patients = results.scalars().all()

    return PatientListResponse(
        items=patients,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(
    patient_id: UUID,
    db: DbSession,
    current_user: AnyStaff,
):
    result = await db.execute(
        select(Patient).where(Patient.id == patient_id, Patient.deleted_at.is_(None))
    )
    patient = result.scalar_one_or_none()
    if patient is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return patient


@router.patch("/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: UUID,
    data: PatientUpdate,
    db: DbSession,
    current_user: AnyStaff,
    request: Request,
):
    result = await db.execute(
        select(Patient).where(Patient.id == patient_id, Patient.deleted_at.is_(None))
    )
    patient = result.scalar_one_or_none()
    if patient is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    update_data = data.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")

    # Capture old values for audit
    old_values = {k: getattr(patient, k) for k in update_data}
    old_values_serializable = {}
    for k, v in old_values.items():
        if v is None:
            old_values_serializable[k] = None
        elif hasattr(v, "isoformat"):
            old_values_serializable[k] = v.isoformat()
        elif hasattr(v, "value"):  # enum
            old_values_serializable[k] = v.value
        else:
            old_values_serializable[k] = str(v)

    for field, value in update_data.items():
        setattr(patient, field, value)

    await db.flush()

    await log_audit(
        db,
        user_id=current_user.id,
        action=AuditAction.update,
        entity_type="patients",
        entity_id=patient.id,
        old_values=old_values_serializable,
        new_values=data.model_dump(exclude_unset=True, mode="json"),
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    await db.commit()
    await db.refresh(patient)
    return patient


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def soft_delete_patient(
    patient_id: UUID,
    db: DbSession,
    current_user: AnyStaff,
    request: Request,
):
    result = await db.execute(
        select(Patient).where(Patient.id == patient_id, Patient.deleted_at.is_(None))
    )
    patient = result.scalar_one_or_none()
    if patient is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    patient.deleted_at = func.now()
    await db.flush()

    await log_audit(
        db,
        user_id=current_user.id,
        action=AuditAction.delete,
        entity_type="patients",
        entity_id=patient.id,
        old_values={"deleted_at": None},
        new_values={"deleted_at": "soft_deleted"},
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    await db.commit()
