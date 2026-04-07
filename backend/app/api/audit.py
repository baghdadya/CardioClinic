import enum
from datetime import date, datetime
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, Request, status
from sqlalchemy import and_, func, inspect, select, update

from app.core.deps import DbSession, DoctorOnly
from app.models.audit_log import AuditLog
from app.models.enums import AuditAction
from app.models import (
    Patient, PresentHistory, PastFamilyHistory, Examination,
    Investigation, FollowUp, PatientMedication, Prescription,
    Appointment, User,
)

router = APIRouter(prefix="/api/audit", tags=["audit"])

# Map entity_type strings (as stored in audit_log) to SQLAlchemy model classes
ENTITY_MODEL_MAP = {
    "patients": Patient,
    "present_history": PresentHistory,
    "past_family_history": PastFamilyHistory,
    "examinations": Examination,
    "investigations": Investigation,
    "follow_ups": FollowUp,
    "patient_medications": PatientMedication,
    "prescriptions": Prescription,
    "appointments": Appointment,
    "users": User,
}

# Fields that must never be overwritten by a restore
PROTECTED_FIELDS = {"id", "created_at", "updated_at"}


@router.get("")
async def list_audit_logs(
    db: DbSession, current_user: DoctorOnly,
    entity_type: str | None = None,
    entity_id: UUID | None = None,
    action: AuditAction | None = None,
    user_id: UUID | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
):
    query = select(AuditLog)
    filters = []

    if entity_type:
        filters.append(AuditLog.entity_type == entity_type)
    if entity_id:
        filters.append(AuditLog.entity_id == entity_id)
    if action:
        filters.append(AuditLog.action == action)
    if user_id:
        filters.append(AuditLog.user_id == user_id)
    if date_from:
        filters.append(AuditLog.created_at >= date_from)
    if date_to:
        filters.append(AuditLog.created_at <= date_to)

    if filters:
        query = query.where(and_(*filters))

    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar_one()

    offset = (page - 1) * page_size
    result = await db.execute(query.order_by(AuditLog.created_at.desc()).offset(offset).limit(page_size))
    logs = result.scalars().all()

    return {"items": logs, "total": total, "page": page, "page_size": page_size}


@router.post("/{entry_id}/restore")
async def restore_audit_entry(
    entry_id: UUID,
    db: DbSession,
    current_user: DoctorOnly,
    request: Request,
):
    """Restore a clinical record to the state captured in an audit log entry's old_values."""

    # 1. Load the audit log entry
    result = await db.execute(select(AuditLog).where(AuditLog.id == entry_id))
    audit_entry = result.scalar_one_or_none()

    if audit_entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audit log entry not found",
        )

    if audit_entry.action not in (AuditAction.update, AuditAction.delete):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only update or delete entries can be restored",
        )

    if not audit_entry.old_values:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No old values to restore from this entry",
        )

    if audit_entry.entity_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Audit entry has no associated entity ID",
        )

    # 2. Resolve target model
    model_cls = ENTITY_MODEL_MAP.get(audit_entry.entity_type)
    if model_cls is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Entity type '{audit_entry.entity_type}' is not restorable",
        )

    # 3. Verify the target record exists
    target_result = await db.execute(
        select(model_cls).where(model_cls.id == audit_entry.entity_id)
    )
    target_record = target_result.scalar_one_or_none()

    if target_record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{audit_entry.entity_type} record with id {audit_entry.entity_id} not found",
        )

    # 4. Build the set of fields to restore (skip protected fields and unknown columns)
    valid_columns = {c.key for c in model_cls.__table__.columns}
    restore_fields = {
        k: v
        for k, v in audit_entry.old_values.items()
        if k not in PROTECTED_FIELDS and k in valid_columns
    }

    if not restore_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No restorable fields found in old values",
        )

    # 5. Coerce restore values to match column types
    mapper = inspect(model_cls)
    for k, v in list(restore_fields.items()):
        if v is None:
            continue
        col = mapper.columns.get(k)
        if col is None:
            continue
        col_type = col.type

        # Date columns: "2024-01-15" -> date object
        if hasattr(col_type, "impl"):
            col_type = col_type.impl
        type_name = type(col_type).__name__
        if type_name == "Date" and isinstance(v, str):
            restore_fields[k] = date.fromisoformat(v)
        elif type_name == "DateTime" and isinstance(v, str):
            restore_fields[k] = datetime.fromisoformat(v)
        # Enum columns: "Sex.male" or "male" -> enum value
        elif hasattr(col_type, "enum_class") and isinstance(v, str):
            enum_cls = col_type.enum_class
            # Handle "Sex.male" format
            if "." in v:
                v = v.split(".")[-1]
            try:
                restore_fields[k] = enum_cls(v)
            except ValueError:
                pass
        # UUID columns
        elif type_name == "UUID" and isinstance(v, str):
            restore_fields[k] = UUID(v)

    # 6. Capture current values before overwrite (for the new audit trail)
    current_values = {
        k: getattr(target_record, k)
        for k in restore_fields
    }
    # Serialize any non-JSON-native types to strings
    for k, v in current_values.items():
        if isinstance(v, (UUID, datetime, date)):
            current_values[k] = str(v)
        elif isinstance(v, enum.Enum):
            current_values[k] = v.value

    # 7. Apply the restore
    await db.execute(
        update(model_cls)
        .where(model_cls.id == audit_entry.entity_id)
        .values(**restore_fields)
    )

    # 8. Create an audit log entry for the restore action
    restore_log = AuditLog(
        user_id=current_user.id,
        action=AuditAction.restore,
        entity_type=audit_entry.entity_type,
        entity_id=audit_entry.entity_id,
        old_values=current_values,
        new_values=restore_fields,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    db.add(restore_log)

    await db.commit()

    return {
        "success": True,
        "restored_entity_type": audit_entry.entity_type,
        "restored_entity_id": str(audit_entry.entity_id),
        "restored_fields": list(restore_fields.keys()),
    }
