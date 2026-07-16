from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class PositionCreate(BaseModel):
    department_id: int
    title: str
    description: Optional[str] = None
    is_active: bool = True


class PositionUpdate(BaseModel):
    department_id: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class PositionResponse(BaseModel):
    id: int
    department_id: int
    title: str
    description: Optional[str] = None
    is_active: bool
    department_name: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
