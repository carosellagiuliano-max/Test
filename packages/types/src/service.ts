import { BaseEntity, Status, UUID } from './common';

export interface Service extends BaseEntity {
  name: string;
  description?: string;
  duration_minutes: number;
  price_cents: number;
  category_id?: UUID;
  status: Status;
  requires_consultation: boolean;
  max_advance_booking_days: number;
  min_advance_booking_hours: number;
  staff_ids: UUID[];
  color?: string;
  image_url?: string;
}

export interface ServiceCategory extends BaseEntity {
  name: string;
  description?: string;
  color?: string;
  sort_order: number;
  status: Status;
}

export interface ServiceAvailability {
  service_id: UUID;
  staff_id: UUID;
  day_of_week: number; // 0 = Sunday, 1 = Monday, etc.
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  is_available: boolean;
}

export interface CreateServiceRequest {
  name: string;
  description?: string;
  duration_minutes: number;
  price_cents: number;
  category_id?: UUID;
  requires_consultation?: boolean;
  max_advance_booking_days?: number;
  min_advance_booking_hours?: number;
  staff_ids?: UUID[];
  color?: string;
}

export interface UpdateServiceRequest {
  name?: string;
  description?: string;
  duration_minutes?: number;
  price_cents?: number;
  category_id?: UUID;
  status?: Status;
  requires_consultation?: boolean;
  max_advance_booking_days?: number;
  min_advance_booking_hours?: number;
  staff_ids?: UUID[];
  color?: string;
}