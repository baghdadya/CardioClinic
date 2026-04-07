import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKey
from app.models.enums import ChestPainType, PalpitationFrequency, SyncopeType


class PresentHistory(Base, UUIDPrimaryKey, TimestampMixin):
    __tablename__ = "present_history"

    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False, index=True
    )
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    recorded_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )

    # Chest pain
    chest_pain: Mapped[Optional[ChestPainType]] = mapped_column(
        Enum(ChestPainType, name="chest_pain_type"), nullable=True
    )
    chest_pain_remarks: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Dyspnea
    dyspnea_exertional: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    dyspnea_pnd: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    dyspnea_orthopnea: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    dyspnea_grade: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # NYHA 1-4

    # Cardiac symptoms
    palpitations: Mapped[Optional[PalpitationFrequency]] = mapped_column(
        Enum(PalpitationFrequency, name="palpitation_frequency"), nullable=True
    )
    syncope: Mapped[Optional[SyncopeType]] = mapped_column(
        Enum(SyncopeType, name="syncope_type"), nullable=True
    )
    lower_limb_edema: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    abdominal_swelling: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")

    # Low cardiac output
    low_cardiac_output_dizziness: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    low_cardiac_output_blurring: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    low_cardiac_output_fatigue: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")

    # Other systems
    neurological_symptoms: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    git_symptoms: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    urinary_symptoms: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    chest_symptoms: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    remarks: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    patient = relationship("Patient", back_populates="present_histories")
    recorder = relationship("User", lazy="selectin")
