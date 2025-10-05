import { describe, it, expect } from 'vitest'
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
  createPaymentQRData
} from '../payment-utils'

describe('payment-utils', () => {
  const mockServices = [
    {
      id: 'service-1',
      name: 'Haarschnitt',
      price: 5000,
      vatRate: 'STANDARD' as const,
      description: 'Standard Haarschnitt',
      duration: 60
    },
    {
      id: 'service-2',
      name: 'Föhnen',
      price: 2500,
      vatRate: 'STANDARD' as const,
      description: 'Föhnen und Styling',
      duration: 30
    }
  ]

  const mockCustomerInfo = {
    email: 'test@example.com',
    name: 'Max Mustermann',
    phone: '+41791234567',
    address: {
      line1: 'Musterstrasse 123',
      city: 'Zürich',
      postalCode: '8001',
      country: 'CH'
    }
  }

  describe('calculateSwissVAT', () => {
    it('computes VAT for different rate categories', () => {
      expect(calculateSwissVAT(10000, 'STANDARD')).toBe(810)
      expect(calculateSwissVAT(10000, 'REDUCED')).toBe(260)
      expect(calculateSwissVAT(10000, 'SPECIAL')).toBe(380)
    })
  })

  describe('calculatePaymentBreakdown', () => {
    it('aggregates service totals and VAT breakdown', () => {
      const result = calculatePaymentBreakdown(mockServices)

      expect(result.subtotal).toBe(7500)
      expect(result.totalVAT).toBe(608)
      expect(result.grandTotal).toBe(8108)
      expect(result.services).toHaveLength(2)
      expect(result.vatBreakdown.STANDARD?.baseAmount).toBe(7500)
      expect(result.vatBreakdown.STANDARD?.vatAmount).toBe(608)
      expect(result.vatBreakdown.STANDARD?.rate).toBe(0.081)
    })
  })

  describe('validateServices', () => {
    it('accepts valid service definitions', () => {
      expect(() => validateServices(mockServices)).not.toThrow()
    })

    it('rejects empty arrays', () => {
      expect(() => validateServices([])).toThrowError(/Services array is required/)
    })

    it('rejects invalid price values', () => {
      const invalid = [{ ...mockServices[0], price: -100 }]
      expect(() => validateServices(invalid)).toThrowError(/Price must be a positive number/)
    })

    it('rejects invalid VAT rates', () => {
      const invalid = [{ ...mockServices[0], vatRate: 'INVALID' as any }]
      expect(() => validateServices(invalid)).toThrowError(/VAT rate must be one of/)
    })
  })

  describe('validateCustomerInfo', () => {
    it('accepts valid customer data', () => {
      expect(() => validateCustomerInfo(mockCustomerInfo)).not.toThrow()
    })

    it('validates email format', () => {
      const invalid = { ...mockCustomerInfo, email: 'invalid' }
      expect(() => validateCustomerInfo(invalid)).toThrowError(/Valid email address is required/)
    })

    it('validates name presence', () => {
      const invalid = { ...mockCustomerInfo, name: '' }
      expect(() => validateCustomerInfo(invalid)).toThrowError(/Customer name is required/)
    })

    it('validates phone format when provided', () => {
      const invalid = { ...mockCustomerInfo, phone: '123' }
      expect(() => validateCustomerInfo(invalid)).toThrowError(/Phone number format is invalid/)
    })

    it('validates postal code and country', () => {
      const invalidPostal = {
        ...mockCustomerInfo,
        address: { ...mockCustomerInfo.address!, postalCode: '12' }
      }
      const invalidCountry = {
        ...mockCustomerInfo,
        address: { ...mockCustomerInfo.address!, country: 'DE' }
      }

      expect(() => validateCustomerInfo(invalidPostal)).toThrowError(/Valid Swiss postal code is required/)
      expect(() => validateCustomerInfo(invalidCountry)).toThrowError(/Country must be CH/)
    })
  })

  describe('validateAppointmentId', () => {
    it('accepts valid UUIDs', () => {
      expect(() =>
        validateAppointmentId('550e8400-e29b-41d4-a716-446655440000')
      ).not.toThrow()
    })

    it('rejects invalid identifiers', () => {
      expect(() => validateAppointmentId('invalid-id')).toThrowError(/valid UUID/)
    })
  })

  describe('generateIdempotencyKey', () => {
    it('creates unique keys with predictable prefix', () => {
      const key = generateIdempotencyKey('stripe', 'appointment-id', 'retry')
      expect(key.startsWith('stripe_appointment-id')).toBe(true)
      expect(key).toContain('retry')
    })
  })

  describe('formatting helpers', () => {
    it('formats Swiss Franc amounts', () => {
      expect(formatSwissFrancs(8108)).toBe('CHF 81.08')
    })

    it('converts francs to cents safely', () => {
      expect(toSwissCents(81.08)).toBe(8108)
    })
  })

  describe('metadata sanitisation', () => {
    it('removes sensitive keys and truncates long values', () => {
      const sanitized = sanitizeMetadata({
        password: 'secret',
        token: 'abc',
        description: 'a'.repeat(1200)
      })

      expect(sanitized.password).toBeUndefined()
      expect(sanitized.token).toBeUndefined()
      expect(sanitized.description.length).toBeLessThanOrEqual(1003)
    })
  })

  describe('retry and timing helpers', () => {
    it('identifies retryable errors', () => {
      expect(isRetryableError({ name: 'TypeError', message: 'fetch failed' })).toBe(true)
      expect(isRetryableError({ status: 500 })).toBe(true)
      expect(isRetryableError({ statusCode: 429 })).toBe(true)
      expect(isRetryableError({ type: 'api_error' })).toBe(true)
      expect(isRetryableError({ message: 'other' })).toBe(false)
    })

    it('calculates reservation expiries', () => {
      const expiry = calculateReservationExpiry(30)
      expect(typeof expiry).toBe('string')
      expect(new Date(expiry).getTime()).toBeGreaterThan(Date.now())
    })
  })

  describe('external helper builders', () => {
    it('creates SumUp deep links', () => {
      const link = createSumUpDeepLink('checkout', 'https://example.com/callback')
      expect(link).toContain('sumupmerchant://pay/1.0?checkout-id=checkout')
    })

    it('creates payment QR data URLs', () => {
      expect(createPaymentQRData('sumup', 'checkout')).toBe('https://api.sumup.com/v0.1/checkouts/checkout')
      expect(createPaymentQRData('stripe', 'session')).toBe('https://checkout.stripe.com/pay/session')
      expect(() => createPaymentQRData('other', 'id')).toThrow()
    })
  })
})
