from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import Date, DateTime, Enum, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKey
from app.models.enums import MaritalStatus, Sex, SmokingStatus


class Patient(Base, UUIDPrimaryKey, TimestampMixin):
    __tablename__ = "patients"

    legacy_id: Mapped[Optional[int]] = mapped_column(Integer, unique=True, nullable=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    full_name_ar: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=False)
    sex: Mapped[Sex] = mapped_column(Enum(Sex, name="sex_enum"), nullable=False)
    marital_status: Mapped[Optional[MaritalStatus]] = mapped_column(
        Enum(MaritalStatus, name="marital_status_enum"), nullable=True
    )
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True, index=True)
    phone_alt: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    smoking_status: Mapped[Optional[SmokingStatus]] = mapped_column(
        Enum(SmokingStatus, name="smoking_status_enum"), nullable=True
    )
    smoking_packs_day: Mapped[Optional[Decimal]] = mapped_column(Numeric(3, 1), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    present_histories = relationship("PresentHistory", back_populates="patient", lazy="selectin")
    past_family_history = relationship("PastFamilyHistory", back_populates="patient", uselist=False, lazy="selectin")
    examinations = relationship("Examination", back_populates="patient", lazy="selectin")
    investigations = relationship("Investigation", back_populates="patient", lazy="selectin")
    patient_medications = relationship("PatientMedication", back_populates="patient", lazy="selectin")
    prescriptions = relationship("Prescription", back_populates="patient", lazy="selectin")
    follow_ups = relationship("FollowUp", back_populates="patient", lazy="selectin")
    appointments = relationship("Appointment", back_populates="patient", lazy="selectin")
    images = relationship("Image", back_populates="patient", lazy="selectin")
