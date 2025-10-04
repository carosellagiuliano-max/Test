export type UUID = string;

export interface BaseEntity {
  id: UUID;
  created_at: string;
  updated_at: string;
}

export interface TimestampEntity {
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export type Status = 'active' | 'inactive' | 'deleted';

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export type Role = 'customer' | 'staff' | 'admin' | 'super_admin';

export interface UserPermissions {
  canManageUsers: boolean;
  canManageServices: boolean;
  canManageAppointments: boolean;
  canManageProducts: boolean;
  canViewReports: boolean;
  canManageSettings: boolean;
}