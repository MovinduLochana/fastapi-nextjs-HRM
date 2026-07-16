import os
from fastapi import APIRouter, Depends, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user
from app.auth.models import User
from app.employees.schemas import (
    EmployeeCreate,
    EmployeeUpdate,
    EmployeeResponse,
    EmployeeDocumentResponse,
)
from app.employees import service

router = APIRouter()


def _to_response(employee) -> EmployeeResponse:
    return EmployeeResponse(
        id=employee.id,
        employee_code=employee.employee_code,
        first_name=employee.first_name,
        last_name=employee.last_name,
        email=employee.email,
        phone=employee.phone,
        address=employee.address,
        department_id=employee.department_id,
        position_id=employee.position_id,
        department_name=employee.department.name if employee.department else None,
        position_title=employee.position.title if employee.position else None,
        joining_date=employee.joining_date,
        employment_type=employee.employment_type,
        basic_salary=employee.basic_salary,
        status=employee.status,
        created_at=employee.created_at,
        updated_at=employee.updated_at,
    )


@router.post("/", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
async def create_employee(
    data: EmployeeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = await service.create_employee(db, data)
    return _to_response(employee)


@router.get("/")
async def get_employees(
    search: str | None = None,
    department_id: int | None = None,
    status: str | None = None,
    employment_type: str | None = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await service.get_employees(
        db,
        search=search,
        department_id=department_id,
        status_filter=status,
        employment_type=employment_type,
        skip=skip,
        limit=limit,
    )
    return [_to_response(e) for e in result]


@router.get("/{employee_id}", response_model=EmployeeResponse)
async def get_employee(
    employee_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = await service.get_employee_by_id(db, employee_id)
    return _to_response(employee)


@router.patch("/{employee_id}", response_model=EmployeeResponse)
async def update_employee(
    employee_id: int,
    data: EmployeeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = await service.update_employee(db, employee_id, data)
    return _to_response(employee)


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_employee(
    employee_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await service.delete_employee(db, employee_id)


# --- Document endpoints ---

@router.post(
    "/{employee_id}/documents",
    response_model=EmployeeDocumentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_document(
    employee_id: int,
    file: UploadFile = File(...),
    document_type: str = Form(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = await service.upload_document(
        db, employee_id, file, document_type, uploaded_by=current_user.id
    )
    return document


@router.get(
    "/{employee_id}/documents",
    response_model=list[EmployeeDocumentResponse],
)
async def get_documents(
    employee_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await service.get_documents(db, employee_id)


@router.get("/documents/{document_id}/download")
async def download_document(
    document_id: int,
    token: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    if token:
        import jwt as pyjwt
        from app.config import settings
        try:
            payload = pyjwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            user_id_raw = payload.get("sub")
            if user_id_raw is None:
                from fastapi import HTTPException
                raise HTTPException(status_code=401, detail="Invalid token")
        except pyjwt.PyJWTError:
            from fastapi import HTTPException
            raise HTTPException(status_code=401, detail="Invalid token")
    # else:
        # Fallback to standard auth header
        from fastapi import Request
        # from app.dependencies import get_current_user
        # Will raise 401 if not authenticated
        # pass

    document = await service.get_document_by_id(db, document_id)
    if not os.path.exists(document.file_path):
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="File not found on disk")
    return FileResponse(
        path=document.file_path,
        filename=document.original_file_name,
        media_type=document.mime_type,
    )


@router.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await service.delete_document(db, document_id)
