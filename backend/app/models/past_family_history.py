import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import UUIDPrimaryKey


class PastFamilyHistory(Base, UUIDPrimaryKey):
    __tablename__ = "past_family_history"

    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("patients.id"), unique=True, nullable=False
    )

    # Past medical history
    diabetes: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    hypertension: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    rheumatic_heart_disease: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    ischemic_heart_disease: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    cabg: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    valve_replacement: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    other_conditions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Family history
    family_consanguinity: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    family_hypertension: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    family_diabetes: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    family_ihd: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    family_other: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    comments: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    updated_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )

    # Relationships
    patient = relationship("Patient", back_populates="past_family_history")
    updater = relationship("User", lazy="selectin")
