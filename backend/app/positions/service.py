from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from app.positions.models import Position
from app.positions.schemas import PositionCreate, PositionUpdate


async def create_position(db: AsyncSession, data: PositionCreate) -> Position:
    position = Position(**data.model_dump())
    db.add(position)
    await db.flush()

    result = await db.execute(
        select(Position).options(selectinload(Position.department)).where(Position.id == position.id)
    )
    return result.scalar_one()


async def get_positions(
    db: AsyncSession,
    department_id: int | None = None,
    search: str | None = None,
    skip: int = 0,
    limit: int = 100,
) -> dict:
    query = select(Position).options(selectinload(Position.department))
    count_query = select(func.count(Position.id))

    if department_id:
        query = query.where(Position.department_id == department_id)
        count_query = count_query.where(Position.department_id == department_id)

    if search:
        query = query.where(Position.title.ilike(f"%{search}%"))
        count_query = count_query.where(Position.title.ilike(f"%{search}%"))

    total_result = await db.execute(count_query)
    total = total_result.scalar()

    query = query.order_by(Position.id.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    positions = result.scalars().all()

    return list(positions)


async def get_position_by_id(db: AsyncSession, position_id: int) -> Position:
    result = await db.execute(
        select(Position).options(selectinload(Position.department)).where(Position.id == position_id)
    )
    position = result.scalar_one_or_none()
    if not position:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Position not found",
        )
    return position


async def update_position(
    db: AsyncSession, position_id: int, data: PositionUpdate
) -> Position:
    position = await get_position_by_id(db, position_id)

    update_data = data.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    for key, value in update_data.items():
        setattr(position, key, value)

    await db.flush()

    # Reload with department relationship
    result = await db.execute(
        select(Position).options(selectinload(Position.department)).where(Position.id == position_id)
    )
    return result.scalar_one()


async def delete_position(db: AsyncSession, position_id: int) -> None:
    position = await get_position_by_id(db, position_id)
    await db.delete(position)
    await db.flush()
