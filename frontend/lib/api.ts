import axios from "axios";
import { getToken, removeToken } from "./auth";
import type { TokenResponse, User, LoginRequest, RegisterRequest } from "@/types/auth";
import type { Department, DepartmentFormData } from "@/types/department";
import type { Position, PositionFormData } from "@/types/position";
import type { Employee, EmployeeFormData, EmployeeDocument } from "@/types/employee";
import type { Payroll, PayrollFormData } from "@/types/payroll";
import type { DashboardStats } from "@/types/dashboard";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor — attach JWT token
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401 (skip for auth endpoints)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthEndpoint = error.config?.url?.startsWith("/auth/");
    if (
      error.response?.status === 401 &&
      !isAuthEndpoint &&
      typeof window !== "undefined"
    ) {
      removeToken();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ─── Auth API ────────────────────────────────────────────────────────────────

export const authApi = {
  login: async (data: LoginRequest): Promise<TokenResponse> => {
    const formData = new URLSearchParams();
    formData.append("username", data.email);
    formData.append("password", data.password);
    const res = await api.post("/auth/login", formData, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    return res.data;
  },

  register: async (data: RegisterRequest): Promise<User> => {
    const res = await api.post("/auth/register", data);
    return res.data;
  },

  getMe: async (): Promise<User> => {
    const res = await api.get("/auth/me");
    return res.data;
  },
};

// ─── Departments API ─────────────────────────────────────────────────────────

export const departmentsApi = {
  getAll: async (search?: string): Promise<Department[]> => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    const res = await api.get("/departments", { params });
    return res.data;
  },

  getById: async (id: number): Promise<Department> => {
    const res = await api.get(`/departments/${id}`);
    return res.data;
  },

  create: async (data: DepartmentFormData): Promise<Department> => {
    const res = await api.post("/departments", data);
    return res.data;
  },

  update: async (id: number, data: Partial<DepartmentFormData>): Promise<Department> => {
    const res = await api.patch(`/departments/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/departments/${id}`);
  },
};

// ─── Positions API ───────────────────────────────────────────────────────────

export const positionsApi = {
  getAll: async (departmentId?: number, search?: string): Promise<Position[]> => {
    const params: Record<string, string | number> = {};
    if (departmentId) params.department_id = departmentId;
    if (search) params.search = search;
    const res = await api.get("/positions", { params });
    return res.data;
  },

  getById: async (id: number): Promise<Position> => {
    const res = await api.get(`/positions/${id}`);
    return res.data;
  },

  create: async (data: PositionFormData): Promise<Position> => {
    const res = await api.post("/positions", data);
    return res.data;
  },

  update: async (id: number, data: Partial<PositionFormData>): Promise<Position> => {
    const res = await api.patch(`/positions/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/positions/${id}`);
  },
};

// ─── Employees API ───────────────────────────────────────────────────────────

export const employeesApi = {
  getAll: async (params?: {
    department_id?: number;
    status?: string;
    search?: string;
  }): Promise<Employee[]> => {
    const res = await api.get("/employees", { params });
    return res.data;
  },

  getById: async (id: number): Promise<Employee> => {
    const res = await api.get(`/employees/${id}`);
    return res.data;
  },

  create: async (data: EmployeeFormData): Promise<Employee> => {
    const res = await api.post("/employees", data);
    return res.data;
  },

  update: async (id: number, data: Partial<EmployeeFormData>): Promise<Employee> => {
    const res = await api.patch(`/employees/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/employees/${id}`);
  },

  uploadDocument: async (
    employeeId: number,
    file: File,
    documentType: string
  ): Promise<EmployeeDocument> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("document_type", documentType);
    const res = await api.post(`/employees/${employeeId}/documents`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  getDocuments: async (employeeId: number): Promise<EmployeeDocument[]> => {
    const res = await api.get(`/employees/${employeeId}/documents`);
    return res.data;
  },

  downloadDocument: (documentId: number): string => {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const token = getToken();
    return `${baseURL}/employees/documents/${documentId}/download${token ? `?token=${token}` : ""}`;
  },

  deleteDocument: async (documentId: number): Promise<void> => {
    await api.delete(`/employees/documents/${documentId}`);
  },
};

// ─── Payroll API ─────────────────────────────────────────────────────────────

export const payrollApi = {
  getAll: async (params?: {
    employee_id?: number;
    month?: number;
    year?: number;
    payment_status?: string;
  }): Promise<Payroll[]> => {
    const res = await api.get("/payrolls", { params });
    return res.data;
  },

  getById: async (id: number): Promise<Payroll> => {
    const res = await api.get(`/payrolls/${id}`);
    return res.data;
  },

  create: async (data: PayrollFormData): Promise<Payroll> => {
    const res = await api.post("/payrolls", data);
    return res.data;
  },

  update: async (id: number, data: Partial<PayrollFormData>): Promise<Payroll> => {
    const res = await api.patch(`/payrolls/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/payrolls/${id}`);
  },

  markAsPaid: async (id: number): Promise<Payroll> => {
    const res = await api.post(`/payrolls/${id}/pay`);
    return res.data;
  },
};

// ─── Dashboard API ───────────────────────────────────────────────────────────

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const res = await api.get("/dashboard/stats");
    return res.data;
  },
};

export default api;
