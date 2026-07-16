from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.config import settings
from app.auth.router import router as auth_router
from app.departments.router import router as departments_router
from app.positions.router import router as positions_router
from app.employees.router import router as employees_router
from app.payroll.router import router as payroll_router
from app.dashboard.router import router as dashboard_router

app = FastAPI(
    title="HRM System API",
    description="Human Resource Management System API built with FastAPI",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(departments_router, prefix="/departments", tags=["Departments"])
app.include_router(positions_router, prefix="/positions", tags=["Positions"])
app.include_router(employees_router, prefix="/employees", tags=["Employees"])
app.include_router(payroll_router, prefix="/payrolls", tags=["Payroll"])
app.include_router(dashboard_router, prefix="/dashboard", tags=["Dashboard"])

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


@app.get("/", tags=["Root"])
async def root():
    return {"message": "HRM System API", "docs": "/docs"}
