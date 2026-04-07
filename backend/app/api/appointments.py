from datetime import datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, Request, status
from sqlalchemy import and_, func, select

from app.core.deps import AnyStaff, DbSession
from app.models.appointment import Appointment
from app.models.enums import AppointmentStatus, AuditAction
from app.models.patient import Patient
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentListResponse,
    AppointmentResponse,
    AppointmentUpdate,
)
from app.services.audit import log_audit

router = APIRouter(prefix="/api/appointments", tags=["appointments"])


@router.post("", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def create_appointment(data: AppointmentCreate, db: DbSession, current_user: AnyStaff, request: Request):
    p = await db.execute(select(Patient).where(Patient.id == data.patient_id, Patient.deleted_at.is_(None)))
    if not p.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    appt = Appointment(**data.model_dump(), created_by=current_user.id)
    db.add(appt)
    await db.flush()
    await log_audit(db, user_id=current_user.id, action=AuditAction.create, entity_type="appointments",
                    entity_id=appt.id, new_values=data.model_dump(mode="json"),
                    ip_address=request.client.host if request.client else None)
    await db.commit()
    await db.refresh(appt)
    return appt


@router.get("", response_model=AppointmentListResponse)
async def list_appointments(
    db: DbSession, current_user: AnyStaff,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    status_filter: AppointmentStatus | None = Query(None, alias="status"),
    patient_id: UUID | None = None,
):
    query = select(Appointment)
    filters = []

    if date_from:
        filters.append(Appointment.scheduled_at >= date_from)
    if date_to:
        filters.append(Appointment.scheduled_at <= date_to)
    if status_filter:
        filters.append(Appointment.status == status_filter)
    if patient_id:
        filters.append(Appointment.patient_id == patient_id)

    if filters:
        query = query.where(and_(*filters))

    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar_one()

    result = await db.execute(query.order_by(Appointment.scheduled_at))
    return AppointmentListResponse(items=result.scalars().all(), total=total)


@router.get("/{appt_id}", response_model=AppointmentResponse)
async def get_appointment(appt_id: UUID, db: DbSession, current_user: AnyStaff):
    result = await db.execute(select(Appointment).where(Appointment.id == appt_id))
    appt = result.scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    return appt


@router.patch("/{appt_id}", response_model=AppointmentResponse)
async def update_appointment(
    appt_id: UUID, data: AppointmentUpdate, db: DbSession, current_user: AnyStaff, request: Request,
):
    result = await db.execute(select(Appointment).where(Appointment.id == appt_id))
    appt = result.scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")

    update_data = data.model_dump(exclude_unset=True)
    old_values = {k: str(getattr(appt, k)) for k in update_data}
    for field, value in update_data.items():
        setattr(appt, field, value)
    await db.flush()
    await log_audit(db, user_id=current_user.id, action=AuditAction.update, entity_type="appointments",
                    entity_id=appt.id, old_values=old_values,
                    new_values=data.model_dump(exclude_unset=True, mode="json"),
                    ip_address=request.client.host if request.client else None)
    await db.commit()
    await db.refresh(appt)
    return appt


@router.get("/today/summary")
async def today_summary(db: DbSession, current_user: AnyStaff):
    now = datetime.utcnow()
    start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end = start + timedelta(days=1)

    result = await db.execute(
        select(Appointment).where(
            Appointment.scheduled_at >= start,
            Appointment.scheduled_at < end,
        ).order_by(Appointment.scheduled_at)
    )
    appointments = result.scalars().all()

    return {
        "date": start.date().isoformat(),
        "total": len(appointments),
        "scheduled": sum(1 for a in appointments if a.status == AppointmentStatus.scheduled),
        "confirmed": sum(1 for a in appointments if a.status == AppointmentStatus.confirmed),
        "arrived": sum(1 for a in appointments if a.status == AppointmentStatus.arrived),
        "completed": sum(1 for a in appointments if a.status == AppointmentStatus.completed),
        "cancelled": sum(1 for a in appointments if a.status == AppointmentStatus.cancelled),
        "no_show": sum(1 for a in appointments if a.status == AppointmentStatus.no_show),
    }
