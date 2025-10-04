import { BaseEntity, UUID } from './common';

export interface Appointment extends BaseEntity {
  customer_id: UUID;
  staff_id: UUID;
  service_id: UUID;
  start_time: string; // ISO datetime
  end_time: string; // ISO datetime
  status: AppointmentStatus;
  notes?: string;
  internal_notes?: string;
  price_cents: number;
  deposit_cents?: number;
  duration_minutes: number;
  reminder_sent_at?: string;
  confirmed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  no_show: boolean;
  checkout_session_id?: string;
  payment_status: PaymentStatus;
}

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'partial'
  | 'refunded'
  | 'failed';

export interface AppointmentSlot {
  start_time: string;
  end_time: string;
  available: boolean;
  staff_id: UUID;
  service_id: UUID;
}

export interface BookingRequest {
  customer_id: UUID;
  staff_id: UUID;
  service_id: UUID;
  start_time: string;
  notes?: string;
  send_confirmation?: boolean;
}

export interface AppointmentWithDetails extends Appointment {
  customer: {
    id: UUID;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  staff: {
    id: UUID;
    first_name: string;
    last_name: string;
  };
  service: {
    id: UUID;
    name: string;
    duration_minutes: number;
    price_cents: number;
  };
}

export interface TimeSlot {
  time: string;
  available: boolean;
  staff_id: UUID;
  reason?: string;
}

export interface AvailabilityRequest {
  service_id: UUID;
  staff_id?: UUID;
  date: string; // YYYY-MM-DD
  duration_minutes?: number;
}

export interface RescheduleRequest {
  appointment_id: UUID;
  new_start_time: string;
  new_staff_id?: UUID;
  reason?: string;
}