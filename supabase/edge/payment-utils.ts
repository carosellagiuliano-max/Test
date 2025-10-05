// Shared payment utilities for Edge Functions
import type {
  ServiceItem,
  VATRateType,
  PaymentCalculation,
  CustomerInfo,
  ValidationError,
} from '../../../packages/types/src/payment-types.ts';

// Swiss VAT rates
export const SWISS_VAT_RATES = {
  STANDARD: 0.081, // 8.1%
  REDUCED: 0.026,  // 2.6%
  SPECIAL: 0.038,  // 3.8%
} as const;

/**
 * Calculate Swiss VAT for a given amount and rate
 */
export function calculateSwissVAT(baseAmount: number, vatRate: VATRateType): number {
  const rate = SWISS_VAT_RATES[vatRate];
  return Math.round(baseAmount * rate);
}

/**
 * Calculate total payment breakdown with Swiss VAT
 */
export function calculatePaymentBreakdown(services: ServiceItem[]): PaymentCalculation {
  const serviceCalculations = services.map(service => {
    const vatAmount = calculateSwissVAT(service.price, service.vatRate);
    const totalAmount = service.price + vatAmount;

    return {
      serviceId: service.id,
      serviceName: service.name,
      baseAmount: service.price,
      vatRate: service.vatRate,
      vatAmount,
      totalAmount,
    };
  });

  const subtotal = serviceCalculations.reduce((sum, calc) => sum + calc.baseAmount, 0);
  const totalVAT = serviceCalculations.reduce((sum, calc) => sum + calc.vatAmount, 0);
  const grandTotal = subtotal + totalVAT;

  // Create VAT breakdown by rate
  const vatBreakdown: PaymentCalculation['vatBreakdown'] = {};

  for (const calc of serviceCalculations) {
    const rateKey = calc.vatRate;
    if (!vatBreakdown[rateKey]) {
      vatBreakdown[rateKey] = {
        baseAmount: 0,
        vatAmount: 0,
        rate: SWISS_VAT_RATES[rateKey],
      };
    }

    vatBreakdown[rateKey]!.baseAmount += calc.baseAmount;
    vatBreakdown[rateKey]!.vatAmount += calc.vatAmount;
  }

  return {
    services: serviceCalculations,
    subtotal,
    totalVAT,
    grandTotal,
    vatBreakdown,
  };
}

/**
 * Validate service items
 */
export function validateServices(services: ServiceItem[]): void {
  if (!Array.isArray(services) || services.length === 0) {
    throw new ValidationError('Services array is required and must not be empty');
  }

  for (const [index, service] of services.entries()) {
    if (!service.id) {
      throw new ValidationError(`Service ${index}: ID is required`, 'services');
    }

    if (!service.name || service.name.trim().length === 0) {
      throw new ValidationError(`Service ${index}: Name is required`, 'services');
    }

    if (typeof service.price !== 'number' || service.price <= 0) {
      throw new ValidationError(`Service ${index}: Price must be a positive number`, 'services');
    }

    if (!service.vatRate || !Object.keys(SWISS_VAT_RATES).includes(service.vatRate)) {
      throw new ValidationError(
        `Service ${index}: VAT rate must be one of: ${Object.keys(SWISS_VAT_RATES).join(', ')}`,
        'services'
      );
    }
  }
}

/**
 * Validate customer information
 */
export function validateCustomerInfo(customerInfo: CustomerInfo): void {
  if (!customerInfo) {
    throw new ValidationError('Customer information is required');
  }

  if (!customerInfo.email || !isValidEmail(customerInfo.email)) {
    throw new ValidationError('Valid email address is required', 'customerInfo.email');
  }

  if (!customerInfo.name || customerInfo.name.trim().length === 0) {
    throw new ValidationError('Customer name is required', 'customerInfo.name');
  }

  // Validate phone if provided
  if (customerInfo.phone && !isValidPhone(customerInfo.phone)) {
    throw new ValidationError('Phone number format is invalid', 'customerInfo.phone');
  }

  // Validate address if provided
  if (customerInfo.address) {
    const { address } = customerInfo;

    if (!address.line1 || address.line1.trim().length === 0) {
      throw new ValidationError('Address line 1 is required', 'customerInfo.address.line1');
    }

    if (!address.city || address.city.trim().length === 0) {
      throw new ValidationError('City is required', 'customerInfo.address.city');
    }

    if (!address.postalCode || !isValidSwissPostalCode(address.postalCode)) {
      throw new ValidationError('Valid Swiss postal code is required', 'customerInfo.address.postalCode');
    }

    if (!address.country || address.country.toLowerCase() !== 'ch') {
      throw new ValidationError('Country must be CH (Switzerland)', 'customerInfo.address.country');
    }
  }
}

/**
 * Validate appointment ID format
 */
export function validateAppointmentId(appointmentId: string): void {
  if (!appointmentId || appointmentId.trim().length === 0) {
    throw new ValidationError('Appointment ID is required');
  }

  // Check if it's a valid UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(appointmentId)) {
    throw new ValidationError('Appointment ID must be a valid UUID');
  }
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format (international format)
 */
function isValidPhone(phone: string): boolean {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Check if it's a valid international format (7-15 digits)
  return digits.length >= 7 && digits.length <= 15;
}

/**
 * Validate Swiss postal code format
 */
function isValidSwissPostalCode(postalCode: string): boolean {
  // Swiss postal codes are 4 digits
  const postalCodeRegex = /^[1-9][0-9]{3}$/;
  return postalCodeRegex.test(postalCode);
}

/**
 * Generate idempotency key
 */
export function generateIdempotencyKey(
  provider: string,
  appointmentId: string,
  suffix?: string
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const parts = [provider, appointmentId, timestamp, random];

  if (suffix) {
    parts.push(suffix);
  }

  return parts.join('_');
}

/**
 * Format amount for display (Swiss Francs)
 */
export function formatSwissFrancs(amountInCents: number): string {
  const amount = amountInCents / 100;
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Convert amount to cents (safe integer conversion)
 */
export function toSwissCents(amountInFrancs: number): number {
  return Math.round(amountInFrancs * 100);
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Sanitize metadata to remove sensitive information
 */
export function sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
  const sanitized = { ...metadata };

  // Remove potentially sensitive fields
  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'key',
    'creditCard',
    'ccNumber',
    'cvv',
    'pin',
  ];

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      delete sanitized[field];
    }
  }

  // Truncate long strings
  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'string' && value.length > 1000) {
      sanitized[key] = value.substring(0, 1000) + '...';
    }
  }

  return sanitized;
}

/**
 * Create audit log entry data
 */
export function createAuditLogData(
  eventType: string,
  provider: string,
  data: Record<string, any>,
  userId?: string,
  request?: Request
): any {
  return {
    event_type: eventType,
    provider,
    event_data: sanitizeMetadata(data),
    created_by: userId,
    ip_address: request?.headers.get('x-forwarded-for') ||
                request?.headers.get('cf-connecting-ip') ||
                'unknown',
    user_agent: request?.headers.get('user-agent') || 'unknown',
    created_at: new Date().toISOString(),
  };
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: any): boolean {
  // Network errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return true;
  }

  // HTTP status codes that are retryable
  if (error.status || error.statusCode) {
    const code = error.status || error.statusCode;
    return code >= 500 || code === 429; // Server errors or rate limiting
  }

  // Provider-specific retryable errors
  if (error.type) {
    const retryableTypes = [
      'card_error', // Stripe
      'rate_limit_error',
      'api_connection_error',
      'api_error',
    ];
    return retryableTypes.includes(error.type);
  }

  return false;
}

/**
 * Calculate stock reservation expiry
 */
export function calculateReservationExpiry(ttlMinutes: number = 30): string {
  const expiryTime = new Date(Date.now() + ttlMinutes * 60 * 1000);
  return expiryTime.toISOString();
}

/**
 * Validate webhook signature timing (prevent replay attacks)
 */
export function validateWebhookTiming(timestamp: string, toleranceSeconds: number = 300): boolean {
  const now = Math.floor(Date.now() / 1000);
  const webhookTime = parseInt(timestamp, 10);

  return Math.abs(now - webhookTime) <= toleranceSeconds;
}

/**
 * Create deep link URL for SumUp
 */
export function createSumUpDeepLink(checkoutId: string, callbackUrl: string): string {
  const encodedCallback = encodeURIComponent(callbackUrl);
  return `sumupmerchant://pay/1.0?checkout-id=${checkoutId}&callback=${encodedCallback}`;
}

/**
 * Create QR code data for payment
 */
export function createPaymentQRData(provider: string, checkoutId: string): string {
  switch (provider) {
    case 'sumup':
      return `https://api.sumup.com/v0.1/checkouts/${checkoutId}`;
    case 'stripe':
      return `https://checkout.stripe.com/pay/${checkoutId}`;
    default:
      throw new Error(`Unsupported provider for QR code: ${provider}`);
  }
}