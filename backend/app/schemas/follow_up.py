from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class FollowUpCreate(BaseModel):
    complaint: Optional[str] = None
    present_history: Optional[str] = None
    pulse_bpm: Optional[int] = Field(None, ge=20, le=300)
    bp_systolic: Optional[int] = Field(None, ge=40, le=300)
    bp_diastolic: Optional[int] = Field(None, ge=20, le=200)
    examination: Optional[str] = None
    investigation: Optional[str] = None
    diagnosis: Optional[str] = None
    plan: Optional[str] = None
    next_follow_up: Optional[date] = None


class FollowUpUpdate(FollowUpCreate):
    pass


class FollowUpResponse(BaseModel):
    id: UUID
    patient_id: UUID
    visit_date: datetime
    seen_by: UUID
    complaint: Optional[str] = None
    present_history: Optional[str] = None
    pulse_bpm: Optional[int] = None
    bp_systolic: Optional[int] = None
    bp_diastolic: Optional[int] = None
    examination: Optional[str] = None
    investigation: Optional[str] = None
    diagnosis: Optional[str] = None
    plan: Optional[str] = None
    next_follow_up: Optional[date] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
