from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import ActivityLevel


class ExaminationCreate(BaseModel):
    pulse_bpm: Optional[int] = Field(None, ge=20, le=300)
    bp_systolic: Optional[int] = Field(None, ge=40, le=300)
    bp_diastolic: Optional[int] = Field(None, ge=20, le=200)
    weight_kg: Optional[Decimal] = Field(None, ge=0.5, le=500)
    height_cm: Optional[Decimal] = Field(None, ge=20, le=300)
    activity_level: Optional[ActivityLevel] = None
    head_neck: Optional[str] = None
    upper_limb: Optional[str] = None
    lower_limb: Optional[str] = None
    abdomen: Optional[str] = None
    chest: Optional[str] = None
    neurology: Optional[str] = None
    cardiac_apex: Optional[str] = Field(None, max_length=50)
    cardiac_s1: bool = True
    cardiac_s2: bool = True
    cardiac_s3: bool = False
    cardiac_s4: bool = False
    cardiac_murmurs: Optional[str] = None
    cardiac_additional_sounds: Optional[str] = None
    remarks: Optional[str] = None


class ExaminationUpdate(ExaminationCreate):
    pass


class ExaminationResponse(BaseModel):
    id: UUID
    patient_id: UUID
    examined_at: datetime
    examined_by: UUID
    pulse_bpm: Optional[int] = None
    bp_systolic: Optional[int] = None
    bp_diastolic: Optional[int] = None
    weight_kg: Optional[Decimal] = None
    height_cm: Optional[Decimal] = None
    bmi: Optional[Decimal] = None
    activity_level: Optional[ActivityLevel] = None
    head_neck: Optional[str] = None
    upper_limb: Optional[str] = None
    lower_limb: Optional[str] = None
    abdomen: Optional[str] = None
    chest: Optional[str] = None
    neurology: Optional[str] = None
    cardiac_apex: Optional[str] = None
    cardiac_s1: bool
    cardiac_s2: bool
    cardiac_s3: bool
    cardiac_s4: bool
    cardiac_murmurs: Optional[str] = None
    cardiac_additional_sounds: Optional[str] = None
    remarks: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
