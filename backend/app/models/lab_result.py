import uuid
from typing import Optional

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import UUIDPrimaryKey


class LabResult(Base, UUIDPrimaryKey):
    __tablename__ = "lab_results"

    investigation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("investigations.id"), nullable=False, index=True
    )
    test_name: Mapped[str] = mapped_column(String(100), nullable=False)
    value: Mapped[str] = mapped_column(String(50), nullable=False)
    unit: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    reference_range: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    is_abnormal: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")

    # Relationships
    investigation = relationship("Investigation", back_populates="lab_results")
