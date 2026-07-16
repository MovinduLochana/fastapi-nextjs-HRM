from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class PayrollCreate(BaseModel):
    employee_id: int
    month: int
    year: int
    basic_salary: float
    allowances: float = 0
    deductions: float = 0
    payment_status: str = "PENDING"


class PayrollUpdate(BaseModel):
    employee_id: Optional[int] = None
    month: Optional[int] = None
    year: Optional[int] = None
    basic_salary: Optional[float] = None
    allowances: Optional[float] = None
    deductions: Optional[float] = None
    payment_status: Optional[str] = None


class PayrollResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    month: int
    year: int
    basic_salary: float
    allowances: float
    deductions: float
    net_salary: float
    payment_status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
