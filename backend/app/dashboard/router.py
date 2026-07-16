from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime
from app.database import get_db
from app.dependencies import get_current_user
from app.auth.models import User
from app.departments.models import Department
from app.positions.models import Position
from app.employees.models import Employee
from app.payroll.models import Payroll

router = APIRouter()


@router.get("/stats")
async def get_dashboard_stats(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):

    emp_count = await db.execute(select(func.count(Employee.id)))
    dept_count = await db.execute(select(func.count(Department.id)))
    pos_count = await db.execute(select(func.count(Position.id)))

    now = datetime.now()
    payroll_total = await db.execute(
        select(func.coalesce(func.sum(Payroll.net_salary), 0))
        .where(Payroll.month == now.month, Payroll.year == now.year)
    )

    recent_emps = await db.execute(
        select(Employee).order_by(Employee.created_at.desc()).limit(5)
    )

    pending = await db.execute(
        select(Payroll).where(Payroll.payment_status == "PENDING")
        .order_by(Payroll.created_at.desc()).limit(5)
    )

    recent_employees = recent_emps.scalars().all()
    pending_payrolls = pending.scalars().all()

    return {
        "total_employees": emp_count.scalar() or 0,
        "total_departments": dept_count.scalar() or 0,
        "total_positions": pos_count.scalar() or 0,
        "monthly_payroll_total": float(payroll_total.scalar() or 0),
        "recent_employees": [
            {
                "id": e.id,
                "employee_code": e.employee_code,
                "first_name": e.first_name,
                "last_name": e.last_name,
                "email": e.email,
                "status": e.status,
                "joining_date": str(e.joining_date) if e.joining_date else None,
                "employment_type": e.employment_type,
                "basic_salary": float(e.basic_salary) if e.basic_salary else 0,
                "created_at": e.created_at.isoformat() if e.created_at else None,
            }
            for e in recent_employees
        ],
        "pending_payrolls": [
            {
                "id": p.id,
                "employee_id": p.employee_id,
                "month": p.month,
                "year": p.year,
                "basic_salary": float(p.basic_salary) if p.basic_salary else 0,
                "allowances": float(p.allowances) if p.allowances else 0,
                "deductions": float(p.deductions) if p.deductions else 0,
                "net_salary": float(p.net_salary) if p.net_salary else 0,
                "payment_status": p.payment_status,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in pending_payrolls
        ],
    }
