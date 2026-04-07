import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import UUIDPrimaryKey


class MedicationMaster(Base, UUIDPrimaryKey):
    __tablename__ = "medications_master"

    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    name_ar: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    generic_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    default_dosage: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    contraindications: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    interactions: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    rxcui: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    interactions_synced_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    patient_medications = relationship("PatientMedication", back_populates="medication", lazy="selectin")
    prescription_items = relationship("PrescriptionItem", back_populates="medication", lazy="selectin")
