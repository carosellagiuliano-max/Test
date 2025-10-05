import { describe, it, expect } from 'vitest'
import { BookingLogic } from '../../lib/booking-logic'

describe('BookingLogic', () => {
  describe('calculatePriceWithVAT', () => {
    it('should calculate Swiss VAT correctly', () => {
      const result = BookingLogic.calculatePriceWithVAT(10000) // 100 CHF
      expect(result.vat).toBe(770) // 7.7% of 10000
      expect(result.total).toBe(10770)
      expect(result.subtotal).toBe(10000)
    })

    it('should handle rounding correctly', () => {
      const result = BookingLogic.calculatePriceWithVAT(9999)
      expect(result.vat).toBe(770) // Rounded
      expect(result.total).toBe(10769)
    })
  })

  describe('formatSwissPrice', () => {
    it('should format prices correctly in Swiss Francs', () => {
      expect(BookingLogic.formatSwissPrice(10000)).toBe('CHF 100.00')
      expect(BookingLogic.formatSwissPrice(5550)).toBe('CHF 55.50')
      expect(BookingLogic.formatSwissPrice(999)).toBe('CHF 9.99')
    })
  })

  describe('isValidBookingDate', () => {
    it('should accept valid weekdays', () => {
      const monday = new Date('2024-01-15T10:00:00')
      const friday = new Date('2024-01-19T10:00:00')
      const saturday = new Date('2024-01-20T10:00:00')

      expect(BookingLogic.isValidBookingDate(monday)).toBe(true)
      expect(BookingLogic.isValidBookingDate(friday)).toBe(true)
      expect(BookingLogic.isValidBookingDate(saturday)).toBe(true)
    })

    it('should reject Sundays', () => {
      const sunday = new Date('2024-01-14T10:00:00')
      expect(BookingLogic.isValidBookingDate(sunday)).toBe(false)
    })

    it('should reject past dates', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      expect(BookingLogic.isValidBookingDate(yesterday)).toBe(false)
    })
  })

  describe('isBusinessDay', () => {
    it('should correctly identify business days', () => {
      const monday = new Date('2024-01-15')
      const saturday = new Date('2024-01-20')
      const sunday = new Date('2024-01-14')

      expect(BookingLogic.isBusinessDay(monday)).toBe(true)
      expect(BookingLogic.isBusinessDay(saturday)).toBe(true)
      expect(BookingLogic.isBusinessDay(sunday)).toBe(false)
    })
  })

  describe('generateTimeSlots', () => {
    it('should generate correct slots for weekday', () => {
      const monday = new Date('2024-01-15')
      const serviceDuration = 60
      const slots = BookingLogic.generateTimeSlots(monday, serviceDuration)

      expect(slots).toContain('08:00')
      expect(slots).toContain('12:00')
      expect(slots).toContain('16:30') // Last slot that allows 1 hour service
      expect(slots).not.toContain('17:30') // Would end after business hours
    })

    it('should generate correct slots for Saturday', () => {
      const saturday = new Date('2024-01-20')
      const serviceDuration = 60
      const slots = BookingLogic.generateTimeSlots(saturday, serviceDuration)

      expect(slots).toContain('09:00')
      expect(slots).toContain('14:30') // Last slot that allows 1 hour service
      expect(slots).not.toContain('15:30') // Would end after Saturday closing
    })

    it('should return empty array for Sunday', () => {
      const sunday = new Date('2024-01-14')
      const slots = BookingLogic.generateTimeSlots(sunday, 60)

      expect(slots).toHaveLength(0)
    })

    it('should account for service duration', () => {
      const monday = new Date('2024-01-15')
      const longServiceDuration = 120 // 2 hour service
      const slots = BookingLogic.generateTimeSlots(monday, longServiceDuration)

      expect(slots).toContain('08:00')
      expect(slots).toContain('15:30') // Last slot that allows 2 hour service
      expect(slots).not.toContain('16:30') // Would end after business hours
    })
  })

  describe('validateAppointmentConflict', () => {
    it('should detect overlapping appointments', () => {
      const newStart = new Date('2024-01-15T10:00:00')
      const newDuration = 60

      const existingAppointments = [
        { start: new Date('2024-01-15T09:30:00'), duration: 60 }
      ]

      const hasConflict = BookingLogic.validateAppointmentConflict(
        newStart, newDuration, existingAppointments
      )

      expect(hasConflict).toBe(true)
    })

    it('should allow non-overlapping appointments', () => {
      const newStart = new Date('2024-01-15T11:00:00')
      const newDuration = 60

      const existingAppointments = [
        { start: new Date('2024-01-15T09:00:00'), duration: 60 }
      ]

      const hasConflict = BookingLogic.validateAppointmentConflict(
        newStart, newDuration, existingAppointments
      )

      expect(hasConflict).toBe(false)
    })

    it('should detect exact time conflicts', () => {
      const newStart = new Date('2024-01-15T10:00:00')
      const newDuration = 60

      const existingAppointments = [
        { start: new Date('2024-01-15T10:00:00'), duration: 60 }
      ]

      const hasConflict = BookingLogic.validateAppointmentConflict(
        newStart, newDuration, existingAppointments
      )

      expect(hasConflict).toBe(true)
    })

    it('should handle back-to-back appointments', () => {
      const newStart = new Date('2024-01-15T11:00:00')
      const newDuration = 60

      const existingAppointments = [
        { start: new Date('2024-01-15T10:00:00'), duration: 60 }
      ]

      const hasConflict = BookingLogic.validateAppointmentConflict(
        newStart, newDuration, existingAppointments
      )

      expect(hasConflict).toBe(false) // Back-to-back is allowed
    })
  })

  describe('calculateBookingEndTime', () => {
    it('should calculate end time correctly', () => {
      const start = new Date('2024-01-15T10:00:00')
      const duration = 90

      const end = BookingLogic.calculateBookingEndTime(start, duration)

      expect(end.getHours()).toBe(11)
      expect(end.getMinutes()).toBe(30)
    })
  })

  describe('isValidSwissPhone', () => {
    it('should validate Swiss phone numbers', () => {
      expect(BookingLogic.isValidSwissPhone('+41791234567')).toBe(true)
      expect(BookingLogic.isValidSwissPhone('0041791234567')).toBe(true)
      expect(BookingLogic.isValidSwissPhone('0791234567')).toBe(true)
    })

    it('should reject invalid phone numbers', () => {
      expect(BookingLogic.isValidSwissPhone('+411234567890')).toBe(false) // Too many digits
      expect(BookingLogic.isValidSwissPhone('+4179123456')).toBe(false) // Too few digits
      expect(BookingLogic.isValidSwissPhone('+49791234567')).toBe(false) // German number
      expect(BookingLogic.isValidSwissPhone('791234567')).toBe(false) // Missing prefix
      expect(BookingLogic.isValidSwissPhone('+410791234567')).toBe(false) // Invalid: starts with 0
    })

    it('should handle phone numbers with spaces', () => {
      expect(BookingLogic.isValidSwissPhone('+41 79 123 45 67')).toBe(true)
      expect(BookingLogic.isValidSwissPhone('079 123 45 67')).toBe(true)
    })
  })

  describe('validateSwissPostalCode', () => {
    it('should validate Swiss postal codes', () => {
      expect(BookingLogic.validateSwissPostalCode('8001')).toBe(true)
      expect(BookingLogic.validateSwissPostalCode('1000')).toBe(true)
      expect(BookingLogic.validateSwissPostalCode('9999')).toBe(true)
    })

    it('should reject invalid postal codes', () => {
      expect(BookingLogic.validateSwissPostalCode('999')).toBe(false) // Too short
      expect(BookingLogic.validateSwissPostalCode('10000')).toBe(false) // Too long
      expect(BookingLogic.validateSwissPostalCode('0999')).toBe(false) // Below 1000
    })
  })

  describe('calculateDeposit', () => {
    it('should calculate 30% deposit', () => {
      expect(BookingLogic.calculateDeposit(10000)).toBe(3000)
      expect(BookingLogic.calculateDeposit(15550)).toBe(4665)
    })
  })

  describe('cancellation', () => {
    it('should calculate cancellation deadline correctly', () => {
      const appointment = new Date('2024-01-15T14:00:00')
      const deadline = BookingLogic.getCancellationDeadline(appointment)

      expect(deadline.getDate()).toBe(14) // Day before
      expect(deadline.getHours()).toBe(14)
    })

    it('should allow cancellation before deadline', () => {
      const appointment = new Date()
      appointment.setDate(appointment.getDate() + 2) // 2 days from now

      expect(BookingLogic.canCancelAppointment(appointment)).toBe(true)
    })

    it('should prevent cancellation after deadline', () => {
      const appointment = new Date()
      appointment.setHours(appointment.getHours() + 12) // 12 hours from now

      expect(BookingLogic.canCancelAppointment(appointment)).toBe(false)
    })
  })
})