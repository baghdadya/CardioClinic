from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class MedicationMasterCreate(BaseModel):
    name: str = Field(max_length=255)
    name_ar: Optional[str] = Field(None, max_length=255)
    generic_name: Optional[str] = Field(None, max_length=255)
    category: Optional[str] = Field(None, max_length=100)
    default_dosage: Optional[str] = Field(None, max_length=100)
    contraindications: Optional[str] = None
    interactions: Optional[dict] = None


class MedicationMasterUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    name_ar: Optional[str] = Field(None, max_length=255)
    generic_name: Optional[str] = Field(None, max_length=255)
    category: Optional[str] = Field(None, max_length=100)
    default_dosage: Optional[str] = Field(None, max_length=100)
    contraindications: Optional[str] = None
    interactions: Optional[dict] = None
    is_active: Optional[bool] = None


class MedicationMasterResponse(BaseModel):
    id: UUID
    name: str
    name_ar: Optional[str] = None
    generic_name: Optional[str] = None
    category: Optional[str] = None
    default_dosage: Optional[str] = None
    contraindications: Optional[str] = None
    interactions: Optional[dict] = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class MedicationListItem(BaseModel):
    """Lightweight response for medication list — excludes heavy interactions JSONB."""
    id: UUID
    name: str
    name_ar: Optional[str] = None
    generic_name: Optional[str] = None
    category: Optional[str] = None
    default_dosage: Optional[str] = None
    is_active: bool

    model_config = {"from_attributes": True}


class FdaBulkImportRequest(BaseModel):
    categories: Optional[list[str]] = None


class FdaBulkImportResponse(BaseModel):
    imported_count: int
    skipped_duplicates: int
    total_found: int
    errors: list[str]


class EgyptianSyncResponse(BaseModel):
    synced_count: int
    new_count: int
    updated_count: int
    total_in_catalog: int


class PatientMedicationCreate(BaseModel):
    medication_id: UUID
    dosage: str = Field(max_length=100)
    frequency: str = Field(max_length=100)
    instructions: Optional[str] = None
    instructions_ar: Optional[str] = None
    started_at: date


class PatientMedicationUpdate(BaseModel):
    dosage: Optional[str] = Field(None, max_length=100)
    frequency: Optional[str] = Field(None, max_length=100)
    instructions: Optional[str] = None
    instructions_ar: Optional[str] = None
    ended_at: Optional[date] = None
    reason_stopped: Optional[str] = None


class PatientMedicationResponse(BaseModel):
    id: UUID
    patient_id: UUID
    medication_id: UUID
    dosage: str
    frequency: str
    instructions: Optional[str] = None
    instructions_ar: Optional[str] = None
    started_at: date
    ended_at: Optional[date] = None
    prescribed_by: UUID
    reason_stopped: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
