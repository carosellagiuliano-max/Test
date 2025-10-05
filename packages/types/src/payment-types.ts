// Shared payment types for the platform

export type PaymentProvider = 'stripe' | 'sumup';

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'refunded';

export type VATRateType = 'STANDARD' | 'REDUCED' | 'SPECIAL';

export type StockReservationStatus = 'active' | 'completed' | 'expired' | 'cancelled';

export type AuditEventType =
  | 'checkout_session_created'
  | 'payment_intent_created'
  | 'payment_completed'
  | 'payment_failed'
  | 'payment_cancelled'
  | 'refund_initiated'
  | 'refund_completed'
  | 'sumup_checkout_created'
  | 'checkout_status_changed'
  | 'stock_reserved'
  | 'stock_released';

// Swiss VAT rates (as of 2024)
export const SWISS_VAT_RATES = {
  STANDARD: 0.081, // 8.1% - Standard rate for most goods and services
  REDUCED: 0.026,  // 2.6% - Reduced rate for accommodation
  SPECIAL: 0.038,  // 3.8% - Special rate for water, food, books, medicine, etc.
} as const;

// Payment interfaces
export interface BasePayment {
  id: string;
  appointmentId: string;
  customerId: string;
  provider: PaymentProvider;
  amount: number; // in cents
  currency: string;
  status: PaymentStatus;
  idempotencyKey?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  failedAt?: string;
  expiresAt?: string;
  errorMessage?: string;
  retryCount: number;
}

export interface StripePayment extends BasePayment {
  provider: 'stripe';
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  stripeCustomerId?: string;
}

export interface SumUpPayment extends BasePayment {
  provider: 'sumup';
  sumupCheckoutId?: string;
  sumupCheckoutReference?: string;
  sumupTransactionId?: string;
}

export type Payment = StripePayment | SumUpPayment;

// Service with pricing
export interface ServiceItem {
  id: string;
  name: string;
  price: number; // in cents
  vatRate: VATRateType;
  description?: string;
  duration?: number; // in minutes
}

// VAT breakdown for compliance
export interface VATBreakdown {
  id: string;
  paymentId: string;
  serviceId?: string;
  serviceName: string;
  baseAmount: number; // in cents
  vatRate: VATRateType;
  vatAmount: number; // in cents
  totalAmount: number; // in cents
}

// Stock reservation for in-store payments
export interface StockReservation {
  id: string;
  serviceId: string;
  appointmentId: string;
  customerId: string;
  quantity: number;
  status: StockReservationStatus;
  createdAt: string;
  expiresAt: string;
  completedAt?: string;
  expiredAt?: string;
  cancelledAt?: string;
}

// Payment audit log entry
export interface PaymentAuditLog {
  id: string;
  paymentId?: string;
  eventType: AuditEventType;
  provider: PaymentProvider;
  eventData: Record<string, any>;
  createdBy?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// Webhook event for deduplication
export interface WebhookEvent {
  id: string;
  provider: PaymentProvider;
  eventId: string;
  eventType: string;
  processed: boolean;
  eventData: Record<string, any>;
  processedAt?: string;
  retryCount: number;
  errorMessage?: string;
  createdAt: string;
}

// Refund
export interface Refund {
  id: string;
  paymentId: string;
  provider: PaymentProvider;
  amount: number; // in cents
  currency: string;
  reason?: string;
  status: PaymentStatus;
  stripeRefundId?: string;
  sumupRefundId?: string;
  transactionId?: string;
  refundData?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  refundedAt?: string;
}

// Customer information
export interface CustomerInfo {
  email: string;
  name: string;
  phone?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    postalCode: string;
    country: string;
  };
}

// Payment request interfaces
export interface CreatePaymentRequest {
  appointmentId: string;
  services: ServiceItem[];
  customerInfo: CustomerInfo;
  metadata?: Record<string, string>;
}

export interface StripeCheckoutRequest extends CreatePaymentRequest {
  mode: 'payment' | 'setup';
  successUrl: string;
  cancelUrl: string;
}

export interface SumUpPaymentRequest extends CreatePaymentRequest {
  paymentType: 'in_store' | 'remote';
  reservationTtlMinutes?: number;
}

// Payment response interfaces
export interface PaymentResponse {
  success: boolean;
  paymentId: string;
  error?: string;
  code?: string;
}

export interface StripeCheckoutResponse extends PaymentResponse {
  sessionId?: string;
  sessionUrl?: string;
}

export interface SumUpPaymentResponse extends PaymentResponse {
  checkoutId?: string;
  checkoutReference?: string;
  deepLink?: string;
  qrCodeData?: string;
  amount?: number;
  currency?: string;
  expiresAt?: string;
  reservationExpiresAt?: string;
}

// Payment calculation utilities
export interface PaymentCalculation {
  services: Array<{
    serviceId: string;
    serviceName: string;
    baseAmount: number;
    vatRate: VATRateType;
    vatAmount: number;
    totalAmount: number;
  }>;
  subtotal: number; // Total before VAT
  totalVAT: number;
  grandTotal: number; // Total including VAT
  vatBreakdown: {
    [K in VATRateType]?: {
      baseAmount: number;
      vatAmount: number;
      rate: number;
    };
  };
}

// Error types
export class PaymentError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider?: PaymentProvider,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

export class ValidationError extends PaymentError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', undefined, false);
    this.name = 'ValidationError';
  }
}

export class IdempotencyError extends PaymentError {
  constructor(message: string, public existingPaymentId?: string) {
    super(message, 'IDEMPOTENCY_ERROR', undefined, false);
    this.name = 'IdempotencyError';
  }
}

export class ProviderError extends PaymentError {
  constructor(
    message: string,
    provider: PaymentProvider,
    public statusCode?: number,
    retryable: boolean = false
  ) {
    super(message, 'PROVIDER_ERROR', provider, retryable);
    this.name = 'ProviderError';
  }
}

// Utility type for payment method detection
export type PaymentMethodPreference = {
  stripe: boolean;
  sumup: boolean;
  defaultProvider?: PaymentProvider;
};

// Configuration types
export interface PaymentConfig {
  providers: {
    stripe: {
      enabled: boolean;
      publicKey: string;
      mode: 'test' | 'live';
    };
    sumup: {
      enabled: boolean;
      merchantCode: string;
      mode: 'test' | 'live';
    };
  };
  currency: string;
  defaultProvider: PaymentProvider;
  vatRates: typeof SWISS_VAT_RATES;
  reservationTtlMinutes: number;
  webhookRetryAttempts: number;
}