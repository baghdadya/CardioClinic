from pydantic import BaseModel, Field
from fastapi import APIRouter

from app.core.deps import ClinicalStaff
from app.services.risk_calculators import (
    calculate_ascvd,
    calculate_cha2ds2_vasc,
    calculate_heart_score,
)

router = APIRouter(prefix="/api/calculators", tags=["calculators"])


class ASCVDRequest(BaseModel):
    age: int = Field(ge=40, le=79)
    sex: str  # male/female
    race: str = "other"  # white, african_american, other
    total_cholesterol: float = Field(ge=100, le=400)
    hdl_cholesterol: float = Field(ge=10, le=150)
    systolic_bp: float = Field(ge=60, le=250)
    on_bp_treatment: bool = False
    diabetes: bool = False
    smoker: bool = False


class CHA2DS2VAScRequest(BaseModel):
    age: int = Field(ge=18, le=120)
    sex: str
    congestive_heart_failure: bool = False
    hypertension: bool = False
    stroke_tia_history: bool = False
    vascular_disease: bool = False
    diabetes: bool = False


class HEARTScoreRequest(BaseModel):
    history: int = Field(ge=0, le=2)
    ecg: int = Field(ge=0, le=2)
    age: int = Field(ge=0, le=2)
    risk_factors: int = Field(ge=0, le=2)
    troponin: int = Field(ge=0, le=2)


@router.post("/ascvd")
async def ascvd_risk(data: ASCVDRequest, current_user: ClinicalStaff):
    return calculate_ascvd(**data.model_dump())


@router.post("/cha2ds2-vasc")
async def cha2ds2_vasc_score(data: CHA2DS2VAScRequest, current_user: ClinicalStaff):
    return calculate_cha2ds2_vasc(**data.model_dump())


@router.post("/heart-score")
async def heart_score(data: HEARTScoreRequest, current_user: ClinicalStaff):
    return calculate_heart_score(**data.model_dump())
