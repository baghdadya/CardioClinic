from uuid import UUID

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.deps import ClinicalStaff, DbSession, DoctorOnly
from app.services.drug_interactions import check_interactions, check_prescription_interactions
from app.services.rxnorm_sync import sync_interactions, get_sync_status

router = APIRouter(prefix="/api/interactions", tags=["drug-interactions"])


class InteractionCheckRequest(BaseModel):
    medication_ids: list[UUID]


class PrescriptionInteractionCheckRequest(BaseModel):
    medication_ids: list[UUID]
    patient_current_medication_ids: list[UUID] = []


@router.post("/check")
async def check_drug_interactions(
    data: InteractionCheckRequest, db: DbSession, current_user: ClinicalStaff,
):
    warnings = await check_interactions(db, data.medication_ids)
    return {"interactions": warnings, "count": len(warnings)}


@router.post("/check-prescription")
async def check_prescription_drug_interactions(
    data: PrescriptionInteractionCheckRequest, db: DbSession, current_user: ClinicalStaff,
):
    warnings = await check_prescription_interactions(
        db, data.medication_ids, data.patient_current_medication_ids
    )
    return {"interactions": warnings, "count": len(warnings)}


@router.post("/sync")
async def sync_drug_interactions(db: DbSession, current_user: DoctorOnly):
    """Sync drug interaction data from NLM RxNorm API.  Doctor-only."""
    try:
        result = await sync_interactions(db)
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Sync failed: {exc}") from exc


@router.get("/sync-status")
async def drug_interaction_sync_status(db: DbSession, current_user: DoctorOnly):
    """Return current sync status and medication coverage stats."""
    return await get_sync_status(db)
