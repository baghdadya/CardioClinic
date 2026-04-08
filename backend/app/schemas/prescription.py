from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import PrescriptionStatus


class PrescriptionItemCreate(BaseModel):
    medication_id: UUID
    dosage: str = Field(max_length=100)
    frequency: str = Field(max_length=100)
    duration: Optional[str] = Field(None, max_length=100)
    instructions: Optional[str] = None
    instructions_ar: Optional[str] = None
    sort_order: int = 0


class PrescriptionItemResponse(BaseModel):
    id: UUID
    prescription_id: UUID
    medication_id: UUID
    medication_name: Optional[str] = None
    dosage: str
    frequency: str
    duration: Optional[str] = None
    instructions: Optional[str] = None
    instructions_ar: Optional[str] = None
    sort_order: int

    model_config = {"from_attributes": True}


class PrescriptionCreate(BaseModel):
    notes: Optional[str] = None
    items: list[PrescriptionItemCreate] = []


class PrescriptionResponse(BaseModel):
    id: UUID
    patient_id: UUID
    prescribed_by: UUID
    patient_name: Optional[str] = None
    prescriber_name: Optional[str] = None
    prescribed_at: datetime
    status: PrescriptionStatus
    finalized_at: Optional[datetime] = None
    voided_at: Optional[datetime] = None
    void_reason: Optional[str] = None
    notes: Optional[str] = None
    pdf_path: Optional[str] = None
    items: list[PrescriptionItemResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class VoidPrescriptionRequest(BaseModel):
    reason: str = Field(min_length=1)
