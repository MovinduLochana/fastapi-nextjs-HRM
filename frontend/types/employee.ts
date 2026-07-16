export interface Employee {
  id: number;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  department_id: number | null;
  position_id: number | null;
  department_name?: string;
  position_title?: string;
  joining_date: string;
  employment_type: string;
  basic_salary: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeFormData {
  employee_code?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  department_id?: number;
  position_id?: number;
  joining_date: string;
  employment_type: string;
  basic_salary: number;
  status?: string;
}

export interface EmployeeDocument {
  id: number;
  employee_id: number;
  document_type: string;
  original_file_name: string;
  stored_file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: number | null;
  uploaded_at: string;
}
