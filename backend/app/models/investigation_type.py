from typing import Optional

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import UUIDPrimaryKey


class InvestigationType(Base, UUIDPrimaryKey):
    __tablename__ = "investigation_types"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # lab, imaging, procedure
    unit: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    reference_range: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
