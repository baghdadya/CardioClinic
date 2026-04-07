from datetime import date

from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import func, select

from app.core.deps import CurrentUser, DbSession
from app.models.appointment import Appointment
from app.models.patient import Patient
from app.models.prescription import Prescription

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


class DashboardStats(BaseModel):
    todays_appointments: int
    total_patients: int
    pending_prescriptions: int


@router.get("/stats", response_model=DashboardStats)
async def get_stats(db: DbSession, current_user: CurrentUser):
    today = date.today()

    # Count of appointments scheduled today
    appt_count = (
        await db.execute(
            select(func.count())
            .select_from(Appointment)
            .where(func.date(Appointment.scheduled_at) == today)
        )
    ).scalar_one()

    # Count of all patients
    patient_count = (
        await db.execute(select(func.count()).select_from(Patient))
    ).scalar_one()

    # Count of prescriptions with draft status
    rx_count = (
        await db.execute(
            select(func.count())
            .select_from(Prescription)
            .where(Prescription.status == "draft")
        )
    ).scalar_one()

    return DashboardStats(
        todays_appointments=appt_count,
        total_patients=patient_count,
        pending_prescriptions=rx_count,
    )
