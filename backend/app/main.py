from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.appointments import router as appointments_router
from app.api.calculators import router as calculators_router
from app.api.instructions import router as instructions_router
from app.api.interactions import router as interactions_router
from app.api.audit import router as audit_router
from app.api.auth import router as auth_router
from app.api.examinations import router as examinations_router
from app.api.follow_ups import router as follow_ups_router
from app.api.investigations import router as investigations_router
from app.api.medications import router as medications_router
from app.api.past_family_history import router as past_family_history_router
from app.api.patients import router as patients_router
from app.api.prescriptions import router as prescriptions_router
from app.api.present_history import router as present_history_router
from app.api.dashboard import router as dashboard_router
from app.api.users import router as users_router
from app.core.config import settings

app = FastAPI(
    title="CardioClinic API",
    version=settings.VERSION,
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(patients_router)
app.include_router(present_history_router)
app.include_router(past_family_history_router)
app.include_router(examinations_router)
app.include_router(investigations_router)
app.include_router(follow_ups_router)
app.include_router(medications_router)
app.include_router(prescriptions_router)
app.include_router(appointments_router)
app.include_router(audit_router)
app.include_router(calculators_router)
app.include_router(interactions_router)
app.include_router(instructions_router)
app.include_router(dashboard_router)
app.include_router(users_router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "version": settings.VERSION}
