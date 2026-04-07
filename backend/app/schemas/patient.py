from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import MaritalStatus, Sex, SmokingStatus


class PatientCreate(BaseModel):
    full_name: str = Field(min_length=1, max_length=255)
    full_name_ar: Optional[str] = Field(None, max_length=255)
    date_of_birth: date
    sex: Sex
    marital_status: Optional[MaritalStatus] = None
    phone: Optional[str] = Field(None, max_length=20)
    phone_alt: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=255)
    address: Optional[str] = None
    smoking_status: Optional[SmokingStatus] = None
    smoking_packs_day: Optional[Decimal] = Field(None, ge=0, le=99.9)
    notes: Optional[str] = None


class PatientUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    full_name_ar: Optional[str] = Field(None, max_length=255)
    date_of_birth: Optional[date] = None
    sex: Optional[Sex] = None
    marital_status: Optional[MaritalStatus] = None
    phone: Optional[str] = Field(None, max_length=20)
    phone_alt: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=255)
    address: Optional[str] = None
    smoking_status: Optional[SmokingStatus] = None
    smoking_packs_day: Optional[Decimal] = Field(None, ge=0, le=99.9)
    notes: Optional[str] = None


class PatientResponse(BaseModel):
    id: UUID
    legacy_id: Optional[int] = None
    full_name: str
    full_name_ar: Optional[str] = None
    date_of_birth: date
    sex: Sex
    marital_status: Optional[MaritalStatus] = None
    phone: Optional[str] = None
    phone_alt: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    smoking_status: Optional[SmokingStatus] = None
    smoking_packs_day: Optional[Decimal] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PatientListResponse(BaseModel):
    items: list[PatientResponse]
    total: int
    page: int
    page_size: int
