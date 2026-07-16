from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user
from app.auth.models import User
from app.positions.schemas import PositionCreate, PositionUpdate, PositionResponse
from app.positions import service

router = APIRouter()


def _to_response(position) -> PositionResponse:
    return PositionResponse(
        id=position.id,
        department_id=position.department_id,
        title=position.title,
        description=position.description,
        is_active=position.is_active,
        department_name=position.department.name if position.department else None,
        created_at=position.created_at,
        updated_at=position.updated_at,
    )


@router.post("/", response_model=PositionResponse, status_code=status.HTTP_201_CREATED)
async def create_position(
    data: PositionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    position = await service.create_position(db, data)
    return _to_response(position)


@router.get("/")
async def get_positions(
    department_id: int | None = None,
    search: str | None = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await service.get_positions(
        db, department_id=department_id, search=search, skip=skip, limit=limit
    )
    return [_to_response(p) for p in result]


@router.get("/{position_id}", response_model=PositionResponse)
async def get_position(
    position_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    position = await service.get_position_by_id(db, position_id)
    return _to_response(position)


@router.patch("/{position_id}", response_model=PositionResponse)
async def update_position(
    position_id: int,
    data: PositionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    position = await service.update_position(db, position_id, data)
    return _to_response(position)


@router.delete("/{position_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_position(
    position_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await service.delete_position(db, position_id)
