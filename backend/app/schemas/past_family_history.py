from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class PastFamilyHistoryUpsert(BaseModel):
    diabetes: bool = False
    hypertension: bool = False
    rheumatic_heart_disease: bool = False
    ischemic_heart_disease: bool = False
    cabg: Optional[str] = None
    valve_replacement: Optional[str] = None
    other_conditions: Optional[str] = None
    family_consanguinity: bool = False
    family_hypertension: bool = False
    family_diabetes: bool = False
    family_ihd: bool = False
    family_other: Optional[str] = None
    comments: Optional[str] = None


class PastFamilyHistoryResponse(BaseModel):
    id: UUID
    patient_id: UUID
    diabetes: bool
    hypertension: bool
    rheumatic_heart_disease: bool
    ischemic_heart_disease: bool
    cabg: Optional[str] = None
    valve_replacement: Optional[str] = None
    other_conditions: Optional[str] = None
    family_consanguinity: bool
    family_hypertension: bool
    family_diabetes: bool
    family_ihd: bool
    family_other: Optional[str] = None
    comments: Optional[str] = None
    updated_at: datetime
    updated_by: UUID

    model_config = {"from_attributes": True}
