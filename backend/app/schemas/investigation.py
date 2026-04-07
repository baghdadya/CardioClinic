from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class LabResultCreate(BaseModel):
    test_name: str = Field(max_length=100)
    value: str = Field(max_length=50)
    unit: Optional[str] = Field(None, max_length=20)
    reference_range: Optional[str] = Field(None, max_length=50)
    is_abnormal: bool = False


class LabResultResponse(BaseModel):
    id: UUID
    investigation_id: UUID
    test_name: str
    value: str
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    is_abnormal: bool

    model_config = {"from_attributes": True}


class InvestigationCreate(BaseModel):
    investigation_date: date
    ecg_result: Optional[str] = None
    stress_test: Optional[str] = None
    cardiac_cath: Optional[str] = None
    echo_lvedd: Optional[Decimal] = Field(None, ge=0, le=99.9)
    echo_lvesd: Optional[Decimal] = Field(None, ge=0, le=99.9)
    echo_ivs: Optional[Decimal] = Field(None, ge=0, le=99.9)
    echo_pwt: Optional[Decimal] = Field(None, ge=0, le=99.9)
    echo_fs: Optional[Decimal] = Field(None, ge=0, le=99.9)
    echo_ef: Optional[Decimal] = Field(None, ge=0, le=99.9)
    echo_ao: Optional[Decimal] = Field(None, ge=0, le=99.9)
    echo_la: Optional[Decimal] = Field(None, ge=0, le=99.9)
    echo_ao_valve: Optional[str] = None
    echo_mit_valve: Optional[str] = None
    echo_pulm_valve: Optional[str] = None
    echo_tric_valve: Optional[str] = None
    diagnosis: Optional[str] = None
    remarks: Optional[str] = None
    lab_results: list[LabResultCreate] = []


class InvestigationUpdate(BaseModel):
    investigation_date: Optional[date] = None
    ecg_result: Optional[str] = None
    stress_test: Optional[str] = None
    cardiac_cath: Optional[str] = None
    echo_lvedd: Optional[Decimal] = Field(None, ge=0, le=99.9)
    echo_lvesd: Optional[Decimal] = Field(None, ge=0, le=99.9)
    echo_ivs: Optional[Decimal] = Field(None, ge=0, le=99.9)
    echo_pwt: Optional[Decimal] = Field(None, ge=0, le=99.9)
    echo_fs: Optional[Decimal] = Field(None, ge=0, le=99.9)
    echo_ef: Optional[Decimal] = Field(None, ge=0, le=99.9)
    echo_ao: Optional[Decimal] = Field(None, ge=0, le=99.9)
    echo_la: Optional[Decimal] = Field(None, ge=0, le=99.9)
    echo_ao_valve: Optional[str] = None
    echo_mit_valve: Optional[str] = None
    echo_pulm_valve: Optional[str] = None
    echo_tric_valve: Optional[str] = None
    diagnosis: Optional[str] = None
    remarks: Optional[str] = None


class InvestigationResponse(BaseModel):
    id: UUID
    patient_id: UUID
    investigation_date: date
    recorded_by: UUID
    ecg_result: Optional[str] = None
    stress_test: Optional[str] = None
    cardiac_cath: Optional[str] = None
    echo_lvedd: Optional[Decimal] = None
    echo_lvesd: Optional[Decimal] = None
    echo_ivs: Optional[Decimal] = None
    echo_pwt: Optional[Decimal] = None
    echo_fs: Optional[Decimal] = None
    echo_ef: Optional[Decimal] = None
    echo_ao: Optional[Decimal] = None
    echo_la: Optional[Decimal] = None
    echo_ao_valve: Optional[str] = None
    echo_mit_valve: Optional[str] = None
    echo_pulm_valve: Optional[str] = None
    echo_tric_valve: Optional[str] = None
    diagnosis: Optional[str] = None
    remarks: Optional[str] = None
    lab_results: list[LabResultResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
