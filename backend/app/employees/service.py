import os
import uuid
import aiofiles
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.config import settings
from app.employees.models import Employee, EmployeeDocument
from app.employees.schemas import EmployeeCreate, EmployeeUpdate


async def _generate_employee_code(db: AsyncSession) -> str:
    result = await db.execute(
        select(func.count(Employee.id))
    )
    count = result.scalar() or 0
    return f"EMP-{count + 1:03d}"


async def create_employee(db: AsyncSession, data: EmployeeCreate) -> Employee:
    # Check duplicate email
    result = await db.execute(select(Employee).where(Employee.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee with this email already exists",
        )

    employee_data = data.model_dump()

    if not employee_data.get("employee_code"):
        employee_data["employee_code"] = await _generate_employee_code(db)
    else:
        result = await db.execute(
            select(Employee).where(Employee.employee_code == employee_data["employee_code"])
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Employee code already exists",
            )

    employee = Employee(**employee_data)
    db.add(employee)
    await db.flush()

    result = await db.execute(
        select(Employee)
        .options(selectinload(Employee.department), selectinload(Employee.position))
        .where(Employee.id == employee.id)
    )
    return result.scalar_one()


async def get_employees(
    db: AsyncSession,
    search: str | None = None,
    department_id: int | None = None,
    status_filter: str | None = None,
    employment_type: str | None = None,
    skip: int = 0,
    limit: int = 100,
) -> dict:
    query = select(Employee).options(
        selectinload(Employee.department), selectinload(Employee.position)
    )
    count_query = select(func.count(Employee.id))

    if search:
        search_filter = (
            Employee.first_name.ilike(f"%{search}%")
            | Employee.last_name.ilike(f"%{search}%")
            | Employee.email.ilike(f"%{search}%")
            | Employee.employee_code.ilike(f"%{search}%")
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    if department_id:
        query = query.where(Employee.department_id == department_id)
        count_query = count_query.where(Employee.department_id == department_id)

    if status_filter:
        query = query.where(Employee.status == status_filter)
        count_query = count_query.where(Employee.status == status_filter)

    if employment_type:
        query = query.where(Employee.employment_type == employment_type)
        count_query = count_query.where(Employee.employment_type == employment_type)

    total_result = await db.execute(count_query)
    total = total_result.scalar()

    query = query.order_by(Employee.id.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    employees = result.scalars().all()

    return list(employees)


async def get_employee_by_id(db: AsyncSession, employee_id: int) -> Employee:
    result = await db.execute(
        select(Employee)
        .options(selectinload(Employee.department), selectinload(Employee.position))
        .where(Employee.id == employee_id)
    )
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found",
        )
    return employee


async def update_employee(
    db: AsyncSession, employee_id: int, data: EmployeeUpdate
) -> Employee:
    employee = await get_employee_by_id(db, employee_id)

    update_data = data.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    if "email" in update_data and update_data["email"] != employee.email:
        result = await db.execute(
            select(Employee).where(Employee.email == update_data["email"])
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Employee with this email already exists",
            )

    for key, value in update_data.items():
        setattr(employee, key, value)

    await db.flush()

    result = await db.execute(
        select(Employee)
        .options(selectinload(Employee.department), selectinload(Employee.position))
        .where(Employee.id == employee_id)
    )
    return result.scalar_one()


async def delete_employee(db: AsyncSession, employee_id: int) -> None:
    from sqlalchemy import delete as sql_delete
    from app.payroll.models import Payroll

    employee = await get_employee_by_id(db, employee_id)

    await db.execute(sql_delete(Payroll).where(Payroll.employee_id == employee_id))

    doc_result = await db.execute(
        select(EmployeeDocument).where(EmployeeDocument.employee_id == employee_id)
    )
    for doc in doc_result.scalars().all():
        if os.path.exists(doc.file_path):
            os.remove(doc.file_path)

    await db.delete(employee)
    await db.flush()



async def upload_document(
    db: AsyncSession,
    employee_id: int,
    file: UploadFile,
    document_type: str,
    uploaded_by: int | None = None,
) -> EmployeeDocument:

    await get_employee_by_id(db, employee_id)

    if file.content_type not in settings.ALLOWED_FILE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '{file.content_type}' not allowed. Allowed: {settings.ALLOWED_FILE_TYPES}",
        )

    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds maximum of {settings.MAX_FILE_SIZE} bytes",
        )

    upload_dir = os.path.join(settings.UPLOAD_DIR, str(employee_id))
    os.makedirs(upload_dir, exist_ok=True)

    ext = os.path.splitext(file.filename)[1] if file.filename else ""
    stored_filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(upload_dir, stored_filename)

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    document = EmployeeDocument(
        employee_id=employee_id,
        document_type=document_type,
        original_file_name=file.filename or "unknown",
        stored_file_name=stored_filename,
        file_path=file_path,
        file_size=len(content),
        mime_type=file.content_type or "application/octet-stream",
        uploaded_by=uploaded_by,
    )
    db.add(document)
    await db.flush()
    await db.refresh(document)
    return document


async def get_documents(db: AsyncSession, employee_id: int) -> list[EmployeeDocument]:
    await get_employee_by_id(db, employee_id)

    result = await db.execute(
        select(EmployeeDocument)
        .where(EmployeeDocument.employee_id == employee_id)
        .order_by(EmployeeDocument.uploaded_at.desc())
    )
    return list(result.scalars().all())


async def get_document_by_id(db: AsyncSession, document_id: int) -> EmployeeDocument:
    result = await db.execute(
        select(EmployeeDocument).where(EmployeeDocument.id == document_id)
    )
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    return document


async def delete_document(db: AsyncSession, document_id: int) -> None:
    document = await get_document_by_id(db, document_id)

    # Delete file from disk
    if os.path.exists(document.file_path):
        os.remove(document.file_path)

    await db.delete(document)
    await db.flush()
