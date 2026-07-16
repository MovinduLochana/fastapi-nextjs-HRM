from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional
from datetime import date, datetime
from decimal import Decimal


class EmployeeCreate(BaseModel):
    employee_code: Optional[str] = None
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    department_id: Optional[int] = None
    position_id: Optional[int] = None
    joining_date: date
    employment_type: str = "FULL_TIME"
    basic_salary: Decimal
    status: str = "ONBOARDING"


class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    department_id: Optional[int] = None
    position_id: Optional[int] = None
    joining_date: Optional[date] = None
    employment_type: Optional[str] = None
    basic_salary: Optional[Decimal] = None
    status: Optional[str] = None


class EmployeeResponse(BaseModel):
    id: int
    employee_code: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    department_id: Optional[int] = None
    position_id: Optional[int] = None
    department_name: Optional[str] = None
    position_title: Optional[str] = None
    joining_date: date
    employment_type: str
    basic_salary: Decimal
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class EmployeeDocumentResponse(BaseModel):
    id: int
    employee_id: int
    document_type: str
    original_file_name: str
    stored_file_name: str
    file_path: str
    file_size: int
    mime_type: str
    uploaded_by: Optional[int] = None
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)
