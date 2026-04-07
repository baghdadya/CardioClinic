from typing import Optional

from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import UUIDPrimaryKey


class DosageInstruction(Base, UUIDPrimaryKey):
    __tablename__ = "dosage_instructions"

    text_en: Mapped[str] = mapped_column(String(255), nullable=False)
    text_ar: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
