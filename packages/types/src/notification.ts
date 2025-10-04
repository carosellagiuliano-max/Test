import { BaseEntity, UUID } from './common';

export interface Notification extends BaseEntity {
  user_id: UUID;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  read: boolean;
  read_at?: string;
  action_url?: string;
  metadata?: Record<string, any>;
}

export type NotificationType =
  | 'appointment_reminder'
  | 'appointment_confirmed'
  | 'appointment_cancelled'
  | 'appointment_rescheduled'
  | 'payment_received'
  | 'payment_failed'
  | 'system_update'
  | 'promotion'
  | 'birthday'
  | 'review_request';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface NotificationTemplate extends BaseEntity {
  name: string;
  type: NotificationType;
  subject: string;
  email_template?: string;
  sms_template?: string;
  push_template?: string;
  variables: string[];
  active: boolean;
}

export interface NotificationPreferences {
  user_id: UUID;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  appointment_reminders: boolean;
  appointment_updates: boolean;
  payment_updates: boolean;
  promotions: boolean;
  system_updates: boolean;
  reminder_hours_before: number[];
}

export interface SendNotificationRequest {
  user_id: UUID;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  channels: NotificationChannel[];
  action_url?: string;
  metadata?: Record<string, any>;
  schedule_for?: string; // ISO datetime
}

export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app';

export interface NotificationLog extends BaseEntity {
  notification_id: UUID;
  channel: NotificationChannel;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
  provider?: string;
  provider_id?: string;
  sent_at?: string;
  delivered_at?: string;
  error_message?: string;
  cost_cents?: number;
}