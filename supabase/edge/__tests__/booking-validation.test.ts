import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest'
import { validateBookingData } from '../booking-validation/validation'
import { createClient } from '@supabase/supabase-js'

vi.mock('@supabase/supabase-js')

describe('Booking Validation Edge Function', () => {
  const mockSupabaseClient = {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      single: vi.fn(),
      order: vi.fn().mockReturnThis()
    })),
    rpc: vi.fn()
  }

  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-10T09:00:00Z'))
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    ;(createClient as any).mockReturnValue(mockSupabaseClient)
  })

  describe('validateBookingData', () => {
    const validBookingData = {
      service_id: '123e4567-e89b-12d3-a456-426614174000',
      staff_id: '223e4567-e89b-12d3-a456-426614174001',
      customer_id: '323e4567-e89b-12d3-a456-426614174002',
      appointment_date: '2024-02-15',
      start_time: '10:00',
      end_time: '11:00',
      customer_name: 'John Doe',
      customer_email: 'john@example.com',
      customer_phone: '+41791234567',
      notes: 'First appointment'
    }

    it('should validate correct booking data', () => {
      const result = validateBookingData(validBookingData)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid email format', () => {
      const invalidData = {
        ...validBookingData,
        customer_email: 'invalid-email'
      }
      const result = validateBookingData(invalidData)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid email format')
    })

    it('should reject invalid phone format', () => {
      const invalidData = {
        ...validBookingData,
        customer_phone: '123'
      }
      const result = validateBookingData(invalidData)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid phone format')
    })

    it('should reject past appointment dates', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const invalidData = {
        ...validBookingData,
        appointment_date: yesterday.toISOString().split('T')[0]
      }
      const result = validateBookingData(invalidData)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Cannot book appointments in the past')
    })

    it('should reject appointments too far in future', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      const invalidData = {
        ...validBookingData,
        appointment_date: futureDate.toISOString().split('T')[0]
      }
      const result = validateBookingData(invalidData)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Cannot book appointments more than 6 months in advance')
    })

    it('should reject invalid time format', () => {
      const invalidData = {
        ...validBookingData,
        start_time: '25:00'
      }
      const result = validateBookingData(invalidData)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid time format')
    })

    it('should reject when end time is before start time', () => {
      const invalidData = {
        ...validBookingData,
        start_time: '14:00',
        end_time: '13:00'
      }
      const result = validateBookingData(invalidData)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('End time must be after start time')
    })

    it('should reject appointments shorter than 15 minutes', () => {
      const invalidData = {
        ...validBookingData,
        start_time: '10:00',
        end_time: '10:10'
      }
      const result = validateBookingData(invalidData)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Appointment must be at least 15 minutes long')
    })

    it('should reject appointments longer than 4 hours', () => {
      const invalidData = {
        ...validBookingData,
        start_time: '10:00',
        end_time: '15:00'
      }
      const result = validateBookingData(invalidData)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Appointment cannot be longer than 4 hours')
    })

    it('should validate Swiss phone numbers', () => {
      const swissNumbers = [
        '+41791234567',
        '0791234567',
        '+41 79 123 45 67',
        '079 123 45 67'
      ]

      swissNumbers.forEach(phone => {
        const data = { ...validBookingData, customer_phone: phone }
        const result = validateBookingData(data)
        expect(result.isValid).toBe(true)
      })
    })

    it('should reject invalid UUID formats', () => {
      const invalidData = {
        ...validBookingData,
        service_id: 'not-a-uuid'
      }
      const result = validateBookingData(invalidData)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid service ID format')
    })

    it('should handle missing required fields', () => {
      const requiredFields = [
        'service_id',
        'staff_id',
        'customer_id',
        'appointment_date',
        'start_time',
        'end_time',
        'customer_email',
        'customer_name',
        'customer_phone'
      ]

      requiredFields.forEach(field => {
        const invalidData = { ...validBookingData }
        delete invalidData[field]
        const result = validateBookingData(invalidData)
        expect(result.isValid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(0)
      })
    })

    it('should sanitize customer notes', () => {
      const dataWithXSS = {
        ...validBookingData,
        notes: '<script>alert("XSS")</script>Normal text'
      }
      const result = validateBookingData(dataWithXSS)
      expect(result.isValid).toBe(true)
      expect(result.sanitizedData?.notes).toBe('Normal text')
    })

    it('should trim whitespace from string fields', () => {
      const dataWithWhitespace = {
        ...validBookingData,
        customer_name: '  John Doe  ',
        customer_email: ' john@example.com ',
        customer_phone: '  +41 79 123 45 67  ',
        notes: '  First appointment  '
      }
      const result = validateBookingData(dataWithWhitespace)
      expect(result.isValid).toBe(true)
      expect(result.sanitizedData?.customer_name).toBe('John Doe')
      expect(result.sanitizedData?.customer_email).toBe('john@example.com')
      expect(result.sanitizedData?.customer_phone).toBe('+41791234567')
      expect(result.sanitizedData?.notes).toBe('First appointment')
    })

    it('should validate business hours (8:00 - 20:00)', () => {
      const outsideHours = [
        { start_time: '07:00', end_time: '08:00' },
        { start_time: '20:30', end_time: '21:00' },
        { start_time: '22:00', end_time: '23:00' }
      ]

      outsideHours.forEach(times => {
        const data = { ...validBookingData, ...times }
        const result = validateBookingData(data)
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Appointments must be between 08:00 and 20:00')
      })
    })

    it('should handle concurrent booking validation', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        validateBookingData({
          ...validBookingData,
          customer_id: `323e4567-e89b-12d3-a456-42661417400${i}`
        })
      )

      const results = await Promise.all(promises)
      results.forEach(result => {
        expect(result.isValid).toBe(true)
      })
    })
  })
})