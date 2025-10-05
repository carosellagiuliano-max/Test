// Unit tests for payment utilities
import { assertEquals, assertThrows } from 'https://deno.land/std@0.177.0/testing/asserts.ts';
import {
  calculateSwissVAT,
  calculatePaymentBreakdown,
  validateServices,
  validateCustomerInfo,
  validateAppointmentId,
  generateIdempotencyKey,
  formatSwissFrancs,
  toSwissCents,
  sanitizeMetadata,
  isRetryableError,
  calculateReservationExpiry,
  createSumUpDeepLink,
  createPaymentQRData,
} from '../payment-utils.ts';

// Mock service items for testing
const mockServices = [
  {
    id: 'service-1',
    name: 'Haarschnitt',
    price: 5000, // 50.00 CHF in cents
    vatRate: 'STANDARD' as const,
    description: 'Standard Haarschnitt',
    duration: 60,
  },
  {
    id: 'service-2',
    name: 'Föhnen',
    price: 2500, // 25.00 CHF in cents
    vatRate: 'STANDARD' as const,
    description: 'Föhnen und Styling',
    duration: 30,
  },
];

const mockCustomerInfo = {
  email: 'test@example.com',
  name: 'Max Mustermann',
  phone: '+41791234567',
  address: {
    line1: 'Musterstrasse 123',
    city: 'Zürich',
    postalCode: '8001',
    country: 'CH',
  },
};

Deno.test('calculateSwissVAT - Standard rate', () => {
  const result = calculateSwissVAT(10000, 'STANDARD'); // 100.00 CHF
  assertEquals(result, 810); // 8.10 CHF (8.1%)
});

Deno.test('calculateSwissVAT - Reduced rate', () => {
  const result = calculateSwissVAT(10000, 'REDUCED'); // 100.00 CHF
  assertEquals(result, 260); // 2.60 CHF (2.6%)
});

Deno.test('calculateSwissVAT - Special rate', () => {
  const result = calculateSwissVAT(10000, 'SPECIAL'); // 100.00 CHF
  assertEquals(result, 380); // 3.80 CHF (3.8%)
});

Deno.test('calculatePaymentBreakdown - Multiple services', () => {
  const result = calculatePaymentBreakdown(mockServices);

  // Service 1: 50.00 + 4.05 VAT = 54.05
  // Service 2: 25.00 + 2.03 VAT = 27.03
  // Total: 75.00 + 6.08 VAT = 81.08

  assertEquals(result.subtotal, 7500); // 75.00 CHF
  assertEquals(result.totalVAT, 608); // 6.08 CHF (405 + 203)
  assertEquals(result.grandTotal, 8108); // 81.08 CHF

  assertEquals(result.services.length, 2);
  assertEquals(result.services[0].baseAmount, 5000);
  assertEquals(result.services[0].vatAmount, 405);
  assertEquals(result.services[0].totalAmount, 5405);

  // Check VAT breakdown
  assertEquals(result.vatBreakdown.STANDARD?.baseAmount, 7500);
  assertEquals(result.vatBreakdown.STANDARD?.vatAmount, 608);
  assertEquals(result.vatBreakdown.STANDARD?.rate, 0.081);
});

Deno.test('validateServices - Valid services', () => {
  // Should not throw
  validateServices(mockServices);
});

Deno.test('validateServices - Empty array', () => {
  assertThrows(
    () => validateServices([]),
    Error,
    'Services array is required and must not be empty'
  );
});

Deno.test('validateServices - Invalid service price', () => {
  const invalidServices = [
    {
      id: 'service-1',
      name: 'Test Service',
      price: -100, // Invalid negative price
      vatRate: 'STANDARD' as const,
    },
  ];

  assertThrows(
    () => validateServices(invalidServices),
    Error,
    'Price must be a positive number'
  );
});

Deno.test('validateServices - Invalid VAT rate', () => {
  const invalidServices = [
    {
      id: 'service-1',
      name: 'Test Service',
      price: 1000,
      vatRate: 'INVALID' as any,
    },
  ];

  assertThrows(
    () => validateServices(invalidServices),
    Error,
    'VAT rate must be one of'
  );
});

Deno.test('validateCustomerInfo - Valid customer', () => {
  // Should not throw
  validateCustomerInfo(mockCustomerInfo);
});

Deno.test('validateCustomerInfo - Invalid email', () => {
  const invalidCustomer = {
    ...mockCustomerInfo,
    email: 'invalid-email',
  };

  assertThrows(
    () => validateCustomerInfo(invalidCustomer),
    Error,
    'Valid email address is required'
  );
});

Deno.test('validateCustomerInfo - Missing name', () => {
  const invalidCustomer = {
    ...mockCustomerInfo,
    name: '',
  };

  assertThrows(
    () => validateCustomerInfo(invalidCustomer),
    Error,
    'Customer name is required'
  );
});

Deno.test('validateCustomerInfo - Invalid Swiss postal code', () => {
  const invalidCustomer = {
    ...mockCustomerInfo,
    address: {
      ...mockCustomerInfo.address!,
      postalCode: '123', // Invalid: too short
    },
  };

  assertThrows(
    () => validateCustomerInfo(invalidCustomer),
    Error,
    'Valid Swiss postal code is required'
  );
});

Deno.test('validateAppointmentId - Valid UUID', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440000';
  // Should not throw
  validateAppointmentId(validUUID);
});

Deno.test('validateAppointmentId - Invalid UUID', () => {
  assertThrows(
    () => validateAppointmentId('invalid-uuid'),
    Error,
    'Appointment ID must be a valid UUID'
  );
});

Deno.test('generateIdempotencyKey', () => {
  const key1 = generateIdempotencyKey('stripe', 'apt-123');
  const key2 = generateIdempotencyKey('stripe', 'apt-123');

  // Keys should be different (contain timestamp and random)
  assertEquals(key1 !== key2, true);
  assertEquals(key1.startsWith('stripe_apt-123_'), true);
});

Deno.test('formatSwissFrancs', () => {
  assertEquals(formatSwissFrancs(12345), 'CHF 123.45');
  assertEquals(formatSwissFrancs(100), 'CHF 1.00');
  assertEquals(formatSwissFrancs(0), 'CHF 0.00');
});

Deno.test('toSwissCents', () => {
  assertEquals(toSwissCents(123.45), 12345);
  assertEquals(toSwissCents(1.00), 100);
  assertEquals(toSwissCents(0.01), 1);
  assertEquals(toSwissCents(0.005), 1); // Rounds to nearest cent
});

Deno.test('sanitizeMetadata - Remove sensitive fields', () => {
  const metadata = {
    username: 'test',
    password: 'secret123', // Should be removed
    token: 'abc123', // Should be removed
    description: 'Normal field',
    creditCard: '1234-5678-9012-3456', // Should be removed
  };

  const sanitized = sanitizeMetadata(metadata);

  assertEquals(sanitized.username, 'test');
  assertEquals(sanitized.description, 'Normal field');
  assertEquals(sanitized.password, undefined);
  assertEquals(sanitized.token, undefined);
  assertEquals(sanitized.creditCard, undefined);
});

Deno.test('sanitizeMetadata - Truncate long strings', () => {
  const longString = 'a'.repeat(1500);
  const metadata = { longField: longString };

  const sanitized = sanitizeMetadata(metadata);

  assertEquals(sanitized.longField.length, 1003); // 1000 + '...'
  assertEquals(sanitized.longField.endsWith('...'), true);
});

Deno.test('isRetryableError - Network errors', () => {
  const networkError = new TypeError('fetch failed');
  assertEquals(isRetryableError(networkError), true);
});

Deno.test('isRetryableError - HTTP 500 errors', () => {
  const serverError = { status: 500 };
  assertEquals(isRetryableError(serverError), true);
});

Deno.test('isRetryableError - HTTP 429 rate limit', () => {
  const rateLimitError = { statusCode: 429 };
  assertEquals(isRetryableError(rateLimitError), true);
});

Deno.test('isRetryableError - HTTP 400 not retryable', () => {
  const clientError = { status: 400 };
  assertEquals(isRetryableError(clientError), false);
});

Deno.test('isRetryableError - Stripe retryable types', () => {
  const stripeError = { type: 'api_connection_error' };
  assertEquals(isRetryableError(stripeError), true);
});

Deno.test('calculateReservationExpiry', () => {
  const now = Date.now();
  const expiry = calculateReservationExpiry(30); // 30 minutes
  const expiryTime = new Date(expiry).getTime();

  // Should be approximately 30 minutes from now (allowing 1 second tolerance)
  const expectedTime = now + 30 * 60 * 1000;
  assertEquals(Math.abs(expiryTime - expectedTime) < 1000, true);
});

Deno.test('createSumUpDeepLink', () => {
  const checkoutId = 'checkout-123';
  const callbackUrl = 'https://example.com/callback?param=value';

  const deepLink = createSumUpDeepLink(checkoutId, callbackUrl);

  assertEquals(
    deepLink,
    'sumupmerchant://pay/1.0?checkout-id=checkout-123&callback=https%3A%2F%2Fexample.com%2Fcallback%3Fparam%3Dvalue'
  );
});

Deno.test('createPaymentQRData - SumUp', () => {
  const result = createPaymentQRData('sumup', 'checkout-123');
  assertEquals(result, 'https://api.sumup.com/v0.1/checkouts/checkout-123');
});

Deno.test('createPaymentQRData - Stripe', () => {
  const result = createPaymentQRData('stripe', 'cs_123');
  assertEquals(result, 'https://checkout.stripe.com/pay/cs_123');
});

Deno.test('createPaymentQRData - Unsupported provider', () => {
  assertThrows(
    () => createPaymentQRData('unknown', 'id-123'),
    Error,
    'Unsupported provider for QR code: unknown'
  );
});