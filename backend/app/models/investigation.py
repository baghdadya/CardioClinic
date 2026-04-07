import uuid
from datetime import date
from decimal import Decimal
from typing import Optional

from sqlalchemy import Date, ForeignKey, Numeric, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKey


class Investigation(Base, UUIDPrimaryKey, TimestampMixin):
    __tablename__ = "investigations"

    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False, index=True
    )
    investigation_date: Mapped[date] = mapped_column(Date, nullable=False)
    recorded_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )

    # Non-echo investigations
    ecg_result: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    stress_test: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cardiac_cath: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Echo measurements
    echo_lvedd: Mapped[Optional[Decimal]] = mapped_column(Numeric(4, 1), nullable=True)  # cm
    echo_lvesd: Mapped[Optional[Decimal]] = mapped_column(Numeric(4, 1), nullable=True)  # cm
    echo_ivs: Mapped[Optional[Decimal]] = mapped_column(Numeric(4, 1), nullable=True)    # cm
    echo_pwt: Mapped[Optional[Decimal]] = mapped_column(Numeric(4, 1), nullable=True)    # cm
    echo_fs: Mapped[Optional[Decimal]] = mapped_column(Numeric(4, 1), nullable=True)     # %
    echo_ef: Mapped[Optional[Decimal]] = mapped_column(Numeric(4, 1), nullable=True)     # %
    echo_ao: Mapped[Optional[Decimal]] = mapped_column(Numeric(4, 1), nullable=True)     # cm
    echo_la: Mapped[Optional[Decimal]] = mapped_column(Numeric(4, 1), nullable=True)     # cm

    # Valve assessments
    echo_ao_valve: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    echo_mit_valve: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    echo_pulm_valve: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    echo_tric_valve: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    diagnosis: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    remarks: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    patient = relationship("Patient", back_populates="investigations")
    recorder = relationship("User", lazy="selectin")
    lab_results = relationship("LabResult", back_populates="investigation", lazy="selectin", cascade="all, delete-orphan")
    images = relationship("Image", back_populates="investigation", lazy="selectin")
