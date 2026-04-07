import uuid
from datetime import date
from typing import Optional

from sqlalchemy import Date, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKey


class PatientMedication(Base, UUIDPrimaryKey, TimestampMixin):
    __tablename__ = "patient_medications"

    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False, index=True
    )
    medication_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("medications_master.id"), nullable=False
    )
    dosage: Mapped[str] = mapped_column(String(100), nullable=False)
    frequency: Mapped[str] = mapped_column(String(100), nullable=False)
    instructions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    instructions_ar: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    started_at: Mapped[date] = mapped_column(Date, nullable=False)
    ended_at: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    prescribed_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    reason_stopped: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    patient = relationship("Patient", back_populates="patient_medications")
    medication = relationship("MedicationMaster", back_populates="patient_medications")
    prescriber = relationship("User", lazy="selectin")
