export interface Position {
  id: number;
  department_id: number;
  title: string;
  description: string | null;
  is_active: boolean;
  department_name?: string;
  created_at: string;
  updated_at: string;
}

export interface PositionFormData {
  department_id: number;
  title: string;
  description?: string;
  is_active?: boolean;
}
