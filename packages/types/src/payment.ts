import { BaseEntity, UUID } from './common';

export interface Payment extends BaseEntity {
  appointment_id?: UUID;
  order_id?: UUID;
  customer_id: UUID;
  amount_cents: number;
  currency: string;
  status: PaymentStatus;
  payment_method: PaymentMethod;
  provider: PaymentProvider;
  provider_payment_id?: string;
  provider_session_id?: string;
  refund_amount_cents?: number;
  refund_reason?: string;
  refunded_at?: string;
  metadata?: Record<string, any>;
}

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'partially_refunded';

export type PaymentMethod =
  | 'card'
  | 'bank_transfer'
  | 'cash'
  | 'sumup'
  | 'stripe';

export type PaymentProvider = 'stripe' | 'sumup' | 'manual';

export interface PaymentIntent {
  id: string;
  amount_cents: number;
  currency: string;
  customer_id: UUID;
  appointment_id?: UUID;
  order_id?: UUID;
  client_secret?: string;
  status: PaymentStatus;
  payment_method_types: string[];
  metadata?: Record<string, any>;
}

export interface RefundRequest {
  payment_id: UUID;
  amount_cents?: number; // If not provided, full refund
  reason: string;
}

export interface PaymentSettings {
  stripe_enabled: boolean;
  stripe_publishable_key?: string;
  sumup_enabled: boolean;
  sumup_app_id?: string;
  default_currency: string;
  require_deposit: boolean;
  deposit_percentage?: number;
  payment_terms?: string;
}

export interface CheckoutSession {
  id: string;
  url: string;
  appointment_id?: UUID;
  order_id?: UUID;
  amount_cents: number;
  currency: string;
  expires_at: string;
  status: 'open' | 'complete' | 'expired';
  metadata?: Record<string, any>;
}