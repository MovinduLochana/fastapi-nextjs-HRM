import { z } from "zod/v4";

export const loginSchema = z.object({
  email: z.email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  full_name: z.string().optional(),
  email: z.email("Please enter a valid email address"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});
export type RegisterFormData = z.infer<typeof registerSchema>;

export const departmentSchema = z.object({
  name: z.string().min(1, "Department name is required").max(200, "Name is too long"),
  description: z.string().optional(),
  is_active: z.boolean(),
});
export type DepartmentFormValues = z.infer<typeof departmentSchema>;

export const positionSchema = z.object({
  department_id: z.number().min(1, "Department is required"),
  title: z.string().min(1, "Position title is required").max(200, "Title is too long"),
  description: z.string().optional(),
  is_active: z.boolean(),
});
export type PositionFormValues = z.infer<typeof positionSchema>;

export const employeeSchema = z.object({
  employee_code: z.string().optional(),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.email("Please enter a valid email address"),
  phone: z.e164({ error: "Must include country code (e.g., +94)" }).min(12, "Must be at least 12 digits").optional(),
  address: z.string().optional(),
  department_id: z.number().optional(),
  position_id: z.number().optional(),
  joining_date: z.string().min(1, "Joining date is required"),
  employment_type: z.string().min(1, "Employment type is required"),
  basic_salary: z.coerce.number().min(0, "Basic salary must be positive"),
  status: z.string().optional(),
});
export type EmployeeFormValues = z.infer<typeof employeeSchema>;

export const payrollSchema = z.object({
  employee_id: z.number().min(1, "Employee is required"),
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2100),
  basic_salary: z.number().min(0, "Basic salary must be positive"),
  allowances: z.number().min(0, "Allowances must be positive"),
  deductions: z.number().min(0, "Deductions must be positive"),
  payment_status: z.string().min(1),
});
export type PayrollFormValues = z.infer<typeof payrollSchema>;
