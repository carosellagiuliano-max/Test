import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { addDays } from 'date-fns'
import { BookingLogic } from '../../lib/booking-logic'

const FIXED_NOW = new Date('2024-01-10T09:00:00Z')

beforeAll(() => {
  vi.useFakeTimers()
  vi.setSystemTime(FIXED_NOW)
})

afterAll(() => {
  vi.useRealTimers()
})

describe('BookingLogic', () => {
  describe('calculateTotalPrice', () => {
    it('should calculate price with VAT correctly', () => {
      const servicePrice = 10000 // 100.00 CHF in cents
      const totalPrice = BookingLogic.calculatePriceWithVAT(servicePrice)
      const expectedVAT = Math.round(servicePrice * 0.077)

      expect(totalPrice.total).toBe(servicePrice + expectedVAT)
      expect(totalPrice.vat).toBe(expectedVAT)
      expect(totalPrice.subtotal).toBe(servicePrice)
    })

    it('should return net price when VAT excluded', () => {
      const servicePrice = 10000
      const totalPrice = BookingLogic.calculatePriceWithVAT(servicePrice, false)

      expect(totalPrice.total).toBe(servicePrice)
      expect(totalPrice.vat).toBe(0)
    })
  })

  describe('calculateVATAmount', () => {
    it('should calculate Swiss VAT correctly', () => {
      const netPrice = 10000 // 100.00 CHF
      const vatAmount = BookingLogic.calculateVATAmount(netPrice)

      expect(vatAmount).toBe(770) // 7.70 CHF
    })

    it('should round VAT to nearest cent', () => {
      const netPrice = 3333 // 33.33 CHF
      const vatAmount = BookingLogic.calculateVATAmount(netPrice)

      expect(vatAmount).toBe(257) // 2.57 CHF (rounded from 2.56641)
    })
  })

  describe('isValidBookingDate', () => {
    it('should reject past dates', () => {
      const pastDate = addDays(FIXED_NOW, -1)
      expect(BookingLogic.isValidBookingDate(pastDate)).toBe(false)
    })

    it('should reject dates too far in future', () => {
      const farFutureDate = addDays(FIXED_NOW, 200)
      expect(BookingLogic.isValidBookingDate(farFutureDate)).toBe(false)
    })

    it('should accept valid weekdays', () => {
      const monday = new Date('2024-01-15T10:00:00Z')
      const friday = new Date('2024-01-19T10:00:00Z')
      const saturday = new Date('2024-01-20T10:00:00Z')

      expect(BookingLogic.isValidBookingDate(monday)).toBe(true)
      expect(BookingLogic.isValidBookingDate(friday)).toBe(true)
      expect(BookingLogic.isValidBookingDate(saturday)).toBe(true)
    })

    it('should reject Sundays', () => {
      const sunday = new Date('2024-01-14T10:00:00Z')
      expect(BookingLogic.isValidBookingDate(sunday)).toBe(false)
    })
  })

  describe('isValidBookingTime', () => {
    it('should accept time within business hours', () => {
      const monday = new Date('2024-01-15T00:00:00Z')
      expect(BookingLogic.isValidBookingTime('10:00', monday)).toBe(true)
      expect(BookingLogic.isValidBookingTime('16:30', monday)).toBe(true)
    })

    it('should reject time outside business hours', () => {
      const monday = new Date('2024-01-15T00:00:00Z')
      expect(BookingLogic.isValidBookingTime('07:59', monday)).toBe(false)
      expect(BookingLogic.isValidBookingTime('18:00', monday)).toBe(false)
    })

    it('should reject time on closed days', () => {
      const sunday = new Date('2024-01-14T00:00:00Z')
      expect(BookingLogic.isValidBookingTime('10:00', sunday)).toBe(false)
    })

    it('should handle Saturday shorter hours', () => {
      const saturday = new Date('2024-01-20T00:00:00Z')
      expect(BookingLogic.isValidBookingTime('14:00', saturday)).toBe(true)
      expect(BookingLogic.isValidBookingTime('16:00', saturday)).toBe(false)
    })
  })

  describe('generateTimeSlots', () => {
    it('should generate correct slots for weekday', () => {
      const monday = new Date('2024-01-15T00:00:00Z')
      const serviceDuration = 60
      const slots = BookingLogic.generateTimeSlots(monday, serviceDuration)

      expect(slots).toContain('08:00')
      expect(slots).toContain('12:00')
      expect(slots).toContain('16:30')
      expect(slots).not.toContain('17:30')
    })

    it('should generate correct slots for Saturday', () => {
      const saturday = new Date('2024-01-20T00:00:00Z')
      const serviceDuration = 60
      const slots = BookingLogic.generateTimeSlots(saturday, serviceDuration)

      expect(slots).toContain('09:00')
      expect(slots).toContain('14:30')
      expect(slots).not.toContain('15:30')
    })

    it('should return empty array for Sunday', () => {
      const sunday = new Date('2024-01-14T00:00:00Z')
      const slots = BookingLogic.generateTimeSlots(sunday, 60)

      expect(slots).toHaveLength(0)
    })

    it('should account for service duration', () => {
      const monday = new Date('2024-01-15T00:00:00Z')
      const longServiceDuration = 120
      const slots = BookingLogic.generateTimeSlots(monday, longServiceDuration)

      expect(slots).toContain('08:00')
      expect(slots).toContain('15:30')
      expect(slots).not.toContain('16:30')
    })
  })

  describe('validateAppointmentConflict', () => {
    it('should detect overlapping appointments', () => {
      const newStart = new Date('2024-01-15T10:00:00Z')
      const newDuration = 60

      const existingAppointments = [
        { start: new Date('2024-01-15T09:30:00Z'), duration: 60 }
      ]

      const hasConflict = BookingLogic.validateAppointmentConflict(
        newStart, newDuration, existingAppointments
      )

      expect(hasConflict).toBe(true)
    })

    it('should allow non-overlapping appointments', () => {
      const newStart = new Date('2024-01-15T11:00:00Z')
      const newDuration = 60

      const existingAppointments = [
        { start: new Date('2024-01-15T09:00:00Z'), duration: 60 }
      ]

      const hasConflict = BookingLogic.validateAppointmentConflict(
        newStart, newDuration, existingAppointments
      )

      expect(hasConflict).toBe(false)
    })

    it('should detect exact time conflicts', () => {
      const newStart = new Date('2024-01-15T10:00:00Z')
      const newDuration = 60

      const existingAppointments = [
        { start: new Date('2024-01-15T10:00:00Z'), duration: 60 }
      ]

      const hasConflict = BookingLogic.validateAppointmentConflict(
        newStart, newDuration, existingAppointments
      )

      expect(hasConflict).toBe(true)
    })

    it('should handle back-to-back appointments', () => {
      const newStart = new Date('2024-01-15T11:00:00Z')
      const newDuration = 60

      const existingAppointments = [
        { start: new Date('2024-01-15T10:00:00Z'), duration: 60 }
      ]

      const hasConflict = BookingLogic.validateAppointmentConflict(
        newStart, newDuration, existingAppointments
      )

      expect(hasConflict).toBe(false)
    })
  })

  describe('formatSwissPrice', () => {
    it('should format prices correctly in Swiss Francs', () => {
      expect(BookingLogic.formatSwissPrice(10000)).toBe('CHF 100.00')
      expect(BookingLogic.formatSwissPrice(12345)).toBe('CHF 123.45')
      expect(BookingLogic.formatSwissPrice(500)).toBe('CHF 5.00')
    })
  })

  describe('isValidSwissPhone', () => {
    it('should validate Swiss phone numbers', () => {
      expect(BookingLogic.isValidSwissPhone('+41791234567')).toBe(true)
      expect(BookingLogic.isValidSwissPhone('0041791234567')).toBe(true)
      expect(BookingLogic.isValidSwissPhone('0791234567')).toBe(true)
    })

    it('should reject invalid phone numbers', () => {
      expect(BookingLogic.isValidSwissPhone('+41751234567')).toBe(false)
      expect(BookingLogic.isValidSwissPhone('+49791234567')).toBe(false)
      expect(BookingLogic.isValidSwissPhone('791234567')).toBe(false)
    })

    it('should handle phone numbers with spaces', () => {
      expect(BookingLogic.isValidSwissPhone('+41 79 123 45 67')).toBe(true)
      expect(BookingLogic.isValidSwissPhone('079 123 45 67')).toBe(true)
    })
  })
})
