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

// Enhanced booking types for comprehensive booking engine
export interface StaffAvailability {
  id: UUID;
  staff_id: UUID;
  day_of_week: number; // 0 = Sunday, 1 = Monday, etc.
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  timezone: string;
  effective_from: string; // YYYY-MM-DD
  effective_until?: string; // YYYY-MM-DD
}

export interface StaffTimeOff {
  id: UUID;
  staff_id: UUID;
  start_time: string; // ISO datetime
  end_time: string; // ISO datetime
  reason?: string;
  type: 'vacation' | 'sick' | 'personal' | 'training';
  approved_by?: UUID;
  approved_at?: string;
  notes?: string;
}

export interface BookingBuffer {
  id: UUID;
  staff_id?: UUID;
  service_id?: UUID;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
}

export interface BookingSetting {
  id: UUID;
  setting_key: string;
  setting_value: any;
  description?: string;
}

export interface BookingValidationResult {
  valid: boolean;
  errors: string[];
  suggested_times?: TimeSlot[];
  alternative_staff?: Array<{
    staff_id: UUID;
    staff_name: string;
    available_slots: TimeSlot[];
  }>;
}

export interface CreateBookingRequest {
  customer_id: UUID;
  staff_id: UUID;
  service_id: UUID;
  start_time: string; // ISO datetime
  notes?: string;
  send_confirmation?: boolean;
  payment_method?: 'deposit' | 'full' | 'cash';
  idempotency_key?: string;
}

export interface CancelBookingRequest {
  appointment_id: UUID;
  reason?: string;
  refund_type?: 'full' | 'partial' | 'none';
  notify_customer?: boolean;
}

export interface BookingAttempt {
  id: UUID;
  customer_id?: UUID;
  service_id: UUID;
  staff_id?: UUID;
  requested_start_time: string;
  requested_end_time: string;
  success: boolean;
  error_code?: string;
  error_message?: string;
  idempotency_key?: string;
  user_agent?: string;
  ip_address?: string;
  created_at: string;
}

export interface AvailabilitySlot {
  staff_id: UUID;
  staff_name: string;
  start_time: string; // ISO datetime
  end_time: string; // ISO datetime
  available: boolean;
  reason?: string;
  service_duration_minutes: number;
  buffer_minutes: number;
}

export interface AvailabilityResponse {
  date: string; // YYYY-MM-DD
  service_id: UUID;
  service_name: string;
  service_duration_minutes: number;
  slots: AvailabilitySlot[];
  next_available?: {
    date: string;
    time: string;
    staff_id: UUID;
    staff_name: string;
  };
}

export interface BookingCalendarEvent {
  id: UUID;
  title: string;
  start: string; // ISO datetime
  end: string; // ISO datetime
  description?: string;
  location?: string;
  url?: string;
  // iCal specific properties
  uid: string;
  dtstamp: string;
  sequence: number;
  status: 'CONFIRMED' | 'TENTATIVE' | 'CANCELLED';
}

export interface BookingWizardStep {
  step: number;
  title: string;
  description?: string;
  completed: boolean;
  valid: boolean;
  data?: any;
}

export interface BookingWizardState {
  steps: BookingWizardStep[];
  current_step: number;
  service?: {
    id: UUID;
    name: string;
    duration_minutes: number;
    price_cents: number;
    description?: string;
  };
  staff?: {
    id: UUID;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  date_time?: {
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
    timezone: string;
  };
  customer?: {
    id: UUID;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  payment?: {
    method: 'deposit' | 'full' | 'cash';
    amount_cents: number;
    stripe_session_id?: string;
  };
  total_duration_minutes: number;
  total_price_cents: number;
  booking_validated: boolean;
  validation_errors: string[];
}

export interface BookingConfirmation {
  appointment_id: UUID;
  booking_reference: string;
  customer: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  service: {
    name: string;
    duration_minutes: number;
    price_cents: number;
  };
  staff: {
    first_name: string;
    last_name: string;
  };
  date_time: {
    start_time: string; // ISO datetime
    end_time: string; // ISO datetime
    timezone: string;
    display_time: string; // Formatted for display
  };
  payment: {
    status: PaymentStatus;
    amount_cents: number;
    method?: string;
    stripe_session_url?: string;
  };
  calendar_event: BookingCalendarEvent;
  cancellation_policy: {
    hours_before: number;
    refund_policy: string;
  };
}