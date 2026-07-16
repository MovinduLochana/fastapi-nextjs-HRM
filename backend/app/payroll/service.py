from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from app.payroll.models import Payroll
from app.payroll.schemas import PayrollCreate, PayrollUpdate
from app.employees.models import Employee


def _payroll_to_dict(payroll: Payroll) -> dict:
    return {
        "id": payroll.id,
        "employee_id": payroll.employee_id,
        "employee_name": (
            f"{payroll.employee.first_name} {payroll.employee.last_name}"
            if payroll.employee else None
        ),
        "month": payroll.month,
        "year": payroll.year,
        "basic_salary": float(payroll.basic_salary) if payroll.basic_salary else 0,
        "allowances": float(payroll.allowances) if payroll.allowances else 0,
        "deductions": float(payroll.deductions) if payroll.deductions else 0,
        "net_salary": float(payroll.net_salary) if payroll.net_salary else 0,
        "payment_status": payroll.payment_status,
        "created_at": payroll.created_at,
        "updated_at": payroll.updated_at,
    }


async def create_payroll(db: AsyncSession, data: PayrollCreate) -> dict:
    # Verify employee exists
    emp = await db.execute(select(Employee).where(Employee.id == data.employee_id))
    if not emp.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Employee not found")

    net_salary = data.basic_salary + data.allowances - data.deductions
    payroll = Payroll(
        employee_id=data.employee_id,
        month=data.month,
        year=data.year,
        basic_salary=data.basic_salary,
        allowances=data.allowances,
        deductions=data.deductions,
        net_salary=net_salary,
        payment_status=data.payment_status,
    )
    db.add(payroll)
    await db.flush()
    await db.refresh(payroll)

    # Reload with relationship
    result = await db.execute(
        select(Payroll)
        .options(selectinload(Payroll.employee))
        .where(Payroll.id == payroll.id)
    )
    return _payroll_to_dict(result.scalar_one())


async def get_payrolls(
    db: AsyncSession,
    employee_id: int = None,
    month: int = None,
    year: int = None,
    payment_status: str = None,
    skip: int = 0,
    limit: int = 100,
) -> list[dict]:
    query = select(Payroll).options(selectinload(Payroll.employee))

    if employee_id:
        query = query.where(Payroll.employee_id == employee_id)
    if month:
        query = query.where(Payroll.month == month)
    if year:
        query = query.where(Payroll.year == year)
    if payment_status:
        query = query.where(Payroll.payment_status == payment_status)

    query = query.order_by(Payroll.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return [_payroll_to_dict(p) for p in result.scalars().all()]


async def get_payroll_by_id(db: AsyncSession, payroll_id: int) -> dict:
    result = await db.execute(
        select(Payroll)
        .options(selectinload(Payroll.employee))
        .where(Payroll.id == payroll_id)
    )
    payroll = result.scalar_one_or_none()
    if not payroll:
        raise HTTPException(status_code=404, detail="Payroll record not found")
    return _payroll_to_dict(payroll)


async def update_payroll(db: AsyncSession, payroll_id: int, data: PayrollUpdate) -> dict:
    result = await db.execute(select(Payroll).where(Payroll.id == payroll_id))
    payroll = result.scalar_one_or_none()
    if not payroll:
        raise HTTPException(status_code=404, detail="Payroll record not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(payroll, key, value)

    # Recalculate net_salary
    basic = float(payroll.basic_salary) if payroll.basic_salary else 0
    allow = float(payroll.allowances) if payroll.allowances else 0
    deduct = float(payroll.deductions) if payroll.deductions else 0
    payroll.net_salary = basic + allow - deduct

    await db.flush()
    await db.refresh(payroll)

    result = await db.execute(
        select(Payroll)
        .options(selectinload(Payroll.employee))
        .where(Payroll.id == payroll.id)
    )
    return _payroll_to_dict(result.scalar_one())


async def delete_payroll(db: AsyncSession, payroll_id: int) -> None:
    result = await db.execute(select(Payroll).where(Payroll.id == payroll_id))
    payroll = result.scalar_one_or_none()
    if not payroll:
        raise HTTPException(status_code=404, detail="Payroll record not found")
    await db.delete(payroll)


async def mark_as_paid(db: AsyncSession, payroll_id: int) -> dict:
    result = await db.execute(select(Payroll).where(Payroll.id == payroll_id))
    payroll = result.scalar_one_or_none()
    if not payroll:
        raise HTTPException(status_code=404, detail="Payroll record not found")
    if payroll.payment_status == "PAID":
        raise HTTPException(status_code=400, detail="Payroll is already paid")

    payroll.payment_status = "PAID"
    await db.flush()

    result = await db.execute(
        select(Payroll)
        .options(selectinload(Payroll.employee))
        .where(Payroll.id == payroll.id)
    )
    return _payroll_to_dict(result.scalar_one())
