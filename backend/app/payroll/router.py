from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.database import get_db
from app.dependencies import get_current_user
from app.auth.models import User
from app.payroll import service
from app.payroll.schemas import PayrollCreate, PayrollUpdate

router = APIRouter()


@router.post("/", status_code=201)
async def create_payroll(
    data: PayrollCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await service.create_payroll(db, data)


@router.get("/")
async def list_payrolls(
    employee_id: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    payment_status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await service.get_payrolls(db, employee_id, month, year, payment_status, skip, limit)


@router.get("/{payroll_id}")
async def get_payroll(
    payroll_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await service.get_payroll_by_id(db, payroll_id)


@router.patch("/{payroll_id}")
async def update_payroll(
    payroll_id: int,
    data: PayrollUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await service.update_payroll(db, payroll_id, data)


@router.delete("/{payroll_id}", status_code=204)
async def delete_payroll(
    payroll_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await service.delete_payroll(db, payroll_id)


@router.post("/{payroll_id}/pay")
async def mark_as_paid(
    payroll_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a payroll record as PAID. Admin only."""
    if current_user.role != "admin":
        from fastapi import HTTPException, status as http_status
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Only admins can process payments",
        )
    return await service.mark_as_paid(db, payroll_id)
