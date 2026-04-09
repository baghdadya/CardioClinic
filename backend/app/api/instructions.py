from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, Request, status
from fastapi.responses import FileResponse
from sqlalchemy import select

from app.core.deps import ClinicalStaff, DbSession, DoctorOnly
from app.models.enums import AuditAction
from app.models.instruction import PatientInstruction
from app.schemas.instruction import (
    InstructionCreate,
    InstructionResponse,
    InstructionUpdate,
)
from app.services.audit import log_audit

router = APIRouter(tags=["instructions"])


@router.get("/api/instructions", response_model=list[InstructionResponse])
async def list_instructions(
    db: DbSession,
    current_user: ClinicalStaff,
    category: str | None = Query(None, min_length=1),
):
    query = select(PatientInstruction).where(PatientInstruction.is_active.is_(True))
    if category:
        query = query.where(PatientInstruction.category == category)
    query = query.order_by(PatientInstruction.sort_order, PatientInstruction.title_en)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/api/instructions/{instruction_id}", response_model=InstructionResponse)
async def get_instruction(
    instruction_id: UUID,
    db: DbSession,
    current_user: ClinicalStaff,
):
    result = await db.execute(
        select(PatientInstruction).where(PatientInstruction.id == instruction_id)
    )
    instruction = result.scalar_one_or_none()
    if not instruction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Instruction not found")
    return instruction


@router.post("/api/instructions", response_model=InstructionResponse, status_code=status.HTTP_201_CREATED)
async def create_instruction(
    data: InstructionCreate,
    db: DbSession,
    current_user: DoctorOnly,
    request: Request,
):
    instruction = PatientInstruction(**data.model_dump())
    db.add(instruction)
    await db.flush()
    await log_audit(
        db,
        user_id=current_user.id,
        action=AuditAction.create,
        entity_type="patient_instructions",
        entity_id=instruction.id,
        new_values=data.model_dump(mode="json"),
        ip_address=request.client.host if request.client else None,
    )
    await db.commit()
    await db.refresh(instruction)
    return instruction


@router.patch("/api/instructions/{instruction_id}", response_model=InstructionResponse)
async def update_instruction(
    instruction_id: UUID,
    data: InstructionUpdate,
    db: DbSession,
    current_user: DoctorOnly,
    request: Request,
):
    result = await db.execute(
        select(PatientInstruction).where(PatientInstruction.id == instruction_id)
    )
    instruction = result.scalar_one_or_none()
    if not instruction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Instruction not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(instruction, field, value)
    await db.flush()
    await log_audit(
        db,
        user_id=current_user.id,
        action=AuditAction.update,
        entity_type="patient_instructions",
        entity_id=instruction.id,
        new_values=data.model_dump(exclude_unset=True, mode="json"),
        ip_address=request.client.host if request.client else None,
    )
    await db.commit()
    await db.refresh(instruction)
    return instruction


@router.post("/api/instructions/{instruction_id}/pdf")
async def generate_instruction_pdf_endpoint(
    instruction_id: UUID,
    db: DbSession,
    current_user: ClinicalStaff,
):
    """Generate a PDF of an instruction sheet on clinic letterhead."""
    from app.services.pdf import generate_instruction_pdf

    try:
        filepath = await generate_instruction_pdf(db, instruction_id)
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    return FileResponse(filepath, media_type="application/pdf", filename=f"instruction_{str(instruction_id)[:8]}.pdf")


@router.delete("/api/instructions/{instruction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_instruction(
    instruction_id: UUID,
    db: DbSession,
    current_user: DoctorOnly,
    request: Request,
):
    result = await db.execute(
        select(PatientInstruction).where(PatientInstruction.id == instruction_id)
    )
    instruction = result.scalar_one_or_none()
    if not instruction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Instruction not found")

    instruction.is_active = False
    await db.flush()
    await log_audit(
        db,
        user_id=current_user.id,
        action=AuditAction.delete,
        entity_type="patient_instructions",
        entity_id=instruction.id,
        ip_address=request.client.host if request.client else None,
    )
    await db.commit()
