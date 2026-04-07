from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import AppointmentStatus, AppointmentType


class AppointmentCreate(BaseModel):
    patient_id: UUID
    scheduled_at: datetime
    duration_minutes: int = Field(30, ge=5, le=240)
    type: AppointmentType = AppointmentType.follow_up
    notes: Optional[str] = None


class AppointmentUpdate(BaseModel):
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = Field(None, ge=5, le=240)
    type: Optional[AppointmentType] = None
    status: Optional[AppointmentStatus] = None
    notes: Optional[str] = None


class AppointmentResponse(BaseModel):
    id: UUID
    patient_id: UUID
    scheduled_at: datetime
    duration_minutes: int
    type: AppointmentType
    status: AppointmentStatus
    notes: Optional[str] = None
    reminder_sent: bool
    created_by: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AppointmentListResponse(BaseModel):
    items: list[AppointmentResponse]
    total: int
