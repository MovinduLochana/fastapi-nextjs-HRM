from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import HTTPException, status
from app.departments.models import Department
from app.departments.schemas import DepartmentCreate, DepartmentUpdate


async def create_department(db: AsyncSession, data: DepartmentCreate) -> Department:
    result = await db.execute(select(Department).where(Department.name == data.name))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Department with this name already exists",
        )

    department = Department(**data.model_dump())
    db.add(department)
    await db.flush()
    await db.refresh(department)
    return department


async def get_departments(
    db: AsyncSession,
    search: str | None = None,
    skip: int = 0,
    limit: int = 100,
) -> dict:
    query = select(Department)
    count_query = select(func.count(Department.id))

    if search:
        query = query.where(Department.name.ilike(f"%{search}%"))
        count_query = count_query.where(Department.name.ilike(f"%{search}%"))

    total_result = await db.execute(count_query)
    total = total_result.scalar()

    query = query.order_by(Department.id.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    departments = result.scalars().all()

    return list(departments)


async def get_department_by_id(db: AsyncSession, department_id: int) -> Department:
    result = await db.execute(select(Department).where(Department.id == department_id))
    department = result.scalar_one_or_none()
    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found",
        )
    return department


async def update_department(
    db: AsyncSession, department_id: int, data: DepartmentUpdate
) -> Department:
    department = await get_department_by_id(db, department_id)

    update_data = data.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    if "name" in update_data and update_data["name"] != department.name:
        result = await db.execute(
            select(Department).where(Department.name == update_data["name"])
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Department with this name already exists",
            )

    for key, value in update_data.items():
        setattr(department, key, value)

    await db.flush()
    await db.refresh(department)
    return department


async def delete_department(db: AsyncSession, department_id: int) -> None:
    from sqlalchemy import delete, update
    from app.positions.models import Position
    from app.employees.models import Employee

    department = await get_department_by_id(db, department_id)

    await db.execute(
        update(Employee)
        .where(Employee.department_id == department_id)
        .values(department_id=None, position_id=None)
    )

    await db.execute(delete(Position).where(Position.department_id == department_id))

    await db.delete(department)
    await db.flush()
