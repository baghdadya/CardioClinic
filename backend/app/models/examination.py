import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKey
from app.models.enums import ActivityLevel


class Examination(Base, UUIDPrimaryKey, TimestampMixin):
    __tablename__ = "examinations"

    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False, index=True
    )
    examined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    examined_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )

    # Vitals
    pulse_bpm: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    bp_systolic: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    bp_diastolic: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    weight_kg: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2), nullable=True)
    height_cm: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2), nullable=True)
    activity_level: Mapped[Optional[ActivityLevel]] = mapped_column(
        Enum(ActivityLevel, name="activity_level_enum"), nullable=True
    )

    # Body systems
    head_neck: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    upper_limb: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    lower_limb: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    abdomen: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    chest: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    neurology: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Cardiac examination
    cardiac_apex: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    cardiac_s1: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    cardiac_s2: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    cardiac_s3: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    cardiac_s4: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    cardiac_murmurs: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cardiac_additional_sounds: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    remarks: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    patient = relationship("Patient", back_populates="examinations")
    examiner = relationship("User", lazy="selectin")

    @property
    def bmi(self) -> Optional[Decimal]:
        if self.weight_kg and self.height_cm and self.height_cm > 0:
            height_m = self.height_cm / Decimal("100")
            return round(self.weight_kg / (height_m * height_m), 1)
        return None
