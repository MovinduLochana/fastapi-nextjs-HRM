import { Employee } from "./employee";
import { Payroll } from "./payroll";

export interface DashboardStats {
  total_employees: number;
  total_departments: number;
  total_positions: number;
  monthly_payroll_total: number;
  recent_employees: Employee[];
  pending_payrolls: Payroll[];
}
