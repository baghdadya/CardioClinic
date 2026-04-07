from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import ChestPainType, PalpitationFrequency, SyncopeType


class PresentHistoryCreate(BaseModel):
    chest_pain: Optional[ChestPainType] = None
    chest_pain_remarks: Optional[str] = None
    dyspnea_exertional: bool = False
    dyspnea_pnd: bool = False
    dyspnea_orthopnea: bool = False
    dyspnea_grade: Optional[int] = Field(None, ge=1, le=4)
    palpitations: Optional[PalpitationFrequency] = None
    syncope: Optional[SyncopeType] = None
    lower_limb_edema: bool = False
    abdominal_swelling: bool = False
    low_cardiac_output_dizziness: bool = False
    low_cardiac_output_blurring: bool = False
    low_cardiac_output_fatigue: bool = False
    neurological_symptoms: Optional[str] = None
    git_symptoms: bool = False
    urinary_symptoms: bool = False
    chest_symptoms: bool = False
    remarks: Optional[str] = None


class PresentHistoryUpdate(PresentHistoryCreate):
    pass


class PresentHistoryResponse(BaseModel):
    id: UUID
    patient_id: UUID
    recorded_at: datetime
    recorded_by: UUID
    chest_pain: Optional[ChestPainType] = None
    chest_pain_remarks: Optional[str] = None
    dyspnea_exertional: bool
    dyspnea_pnd: bool
    dyspnea_orthopnea: bool
    dyspnea_grade: Optional[int] = None
    palpitations: Optional[PalpitationFrequency] = None
    syncope: Optional[SyncopeType] = None
    lower_limb_edema: bool
    abdominal_swelling: bool
    low_cardiac_output_dizziness: bool
    low_cardiac_output_blurring: bool
    low_cardiac_output_fatigue: bool
    neurological_symptoms: Optional[str] = None
    git_symptoms: bool
    urinary_symptoms: bool
    chest_symptoms: bool
    remarks: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
