export interface Payroll {
  id: number;
  employee_id: number;
  employee_name?: string;
  month: number;
  year: number;
  basic_salary: number;
  allowances: number;
  deductions: number;
  net_salary: number;
  payment_status: string;
  created_at: string;
  updated_at: string;
}

export interface PayrollFormData {
  employee_id: number;
  month: number;
  year: number;
  basic_salary: number;
  allowances?: number;
  deductions?: number;
  payment_status?: string;
}
