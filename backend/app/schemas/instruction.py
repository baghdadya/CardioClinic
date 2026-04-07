from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class InstructionCreate(BaseModel):
    title_en: str = Field(max_length=255)
    title_ar: Optional[str] = Field(None, max_length=255)
    content_en: str
    content_ar: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    sort_order: Optional[int] = 0


class InstructionUpdate(BaseModel):
    title_en: Optional[str] = Field(None, max_length=255)
    title_ar: Optional[str] = Field(None, max_length=255)
    content_en: Optional[str] = None
    content_ar: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class InstructionResponse(BaseModel):
    id: UUID
    title_en: str
    title_ar: Optional[str] = None
    content_en: str
    content_ar: Optional[str] = None
    category: Optional[str] = None
    is_active: bool
    sort_order: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
