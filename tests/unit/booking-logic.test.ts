import { describe, it, expect, vi } from 'vitest'
import { addDays, format, parseISO, isWeekend } from 'date-fns'

// Swiss business logic for appointment booking
export class BookingLogic {
  static readonly BUSINESS_HOURS = {
    monday: { start: '09:00', end: '17:00' },
    tuesday: { start: '09:00', end: '17:00' },
    wednesday: { start: '09:00', end: '17:00' },
    thursday: { start: '09:00', end: '17:00' },
    friday: { start: '09:00', end: '17:00' },
    saturday: { start: '09:00', end: '15:00' },
    sunday: null
  }

  static readonly VAT_RATE = 0.077 // 7.7% Swiss VAT
  static readonly SLOT_DURATION = 30 // minutes
  static readonly MAX_ADVANCE_BOOKING_DAYS = 90

  static calculateTotalPrice(servicePrice: number, includeVAT = true): number {
    if (!includeVAT) return servicePrice
    const vatAmount = Math.round(servicePrice * this.VAT_RATE)
    return servicePrice + vatAmount
  }

  static calculateVATAmount(netPrice: number): number {
    return Math.round(netPrice * this.VAT_RATE)
  }

  static isValidBookingDate(date: Date): boolean {
    const today = new Date()
    const maxDate = addDays(today, this.MAX_ADVANCE_BOOKING_DAYS)

    // Can't book in the past
    if (date < today) return false

    // Can't book too far in advance
    if (date > maxDate) return false

    // Check if salon is open on this day
    const dayName = format(date, 'EEEE').toLowerCase()
    return this.BUSINESS_HOURS[dayName] !== null
  }

  static isValidBookingTime(time: string, date: Date): boolean {
    const dayName = format(date, 'EEEE').toLowerCase()
    const businessHours = this.BUSINESS_HOURS[dayName]

    if (!businessHours) return false

    const timeValue = time.replace(':', '')
    const startValue = businessHours.start.replace(':', '')
    const endValue = businessHours.end.replace(':', '')

    return timeValue >= startValue && timeValue < endValue
  }

  static generateTimeSlots(date: Date, serviceDuration: number): string[] {
    const dayName = format(date, 'EEEE').toLowerCase()
    const businessHours = this.BUSINESS_HOURS[dayName]

    if (!businessHours) return []

    const slots: string[] = []
    const [startHour, startMinute] = businessHours.start.split(':').map(Number)
    const [endHour, endMinute] = businessHours.end.split(':').map(Number)

    let currentHour = startHour
    let currentMinute = startMinute

    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
      // Check if there's enough time for the service before closing
      const slotEndMinutes = currentHour * 60 + currentMinute + serviceDuration
      const businessEndMinutes = endHour * 60 + endMinute

      if (slotEndMinutes <= businessEndMinutes) {
        const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`
        slots.push(timeString)
      }

      currentMinute += this.SLOT_DURATION
      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60)
        currentMinute = currentMinute % 60
      }
    }

    return slots
  }

  static validateAppointmentConflict(
    newStart: Date,
    newDuration: number,
    existingAppointments: Array<{ start: Date; duration: number }>
  ): boolean {
    const newEnd = new Date(newStart.getTime() + newDuration * 60000)

    return existingAppointments.some(appointment => {
      const existingEnd = new Date(appointment.start.getTime() + appointment.duration * 60000)

      // Check for overlap
      return (newStart < existingEnd && newEnd > appointment.start)
    })
  }

  static formatSwissPrice(priceInCents: number): string {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF'
    }).format(priceInCents / 100)
  }

  static isValidSwissPhone(phone: string): boolean {
    // Swiss phone number formats: +41, 0041, or 0 followed by 9 digits
    const swissPhoneRegex = /^(\+41|0041|0)([1-9]\d{8})$/
    return swissPhoneRegex.test(phone.replace(/\s/g, ''))
  }
}

describe('BookingLogic', () => {
  describe('calculateTotalPrice', () => {
    it('should calculate price with VAT correctly', () => {
      const servicePrice = 10000 // 100.00 CHF in cents
      const totalPrice = BookingLogic.calculateTotalPrice(servicePrice)
      const expectedVAT = Math.round(servicePrice * 0.077)

      expect(totalPrice).toBe(servicePrice + expectedVAT)
      expect(totalPrice).toBe(10770) // 107.70 CHF
    })

    it('should return net price when VAT excluded', () => {
      const servicePrice = 10000
      const totalPrice = BookingLogic.calculateTotalPrice(servicePrice, false)

      expect(totalPrice).toBe(servicePrice)
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
      const pastDate = new Date('2023-01-01')
      expect(BookingLogic.isValidBookingDate(pastDate)).toBe(false)
    })

    it('should reject dates too far in future', () => {
      const farFutureDate = addDays(new Date(), 100)
      expect(BookingLogic.isValidBookingDate(farFutureDate)).toBe(false)
    })

    it('should accept valid weekdays', () => {
      const nextMonday = addDays(new Date(), 7) // Assuming we find a Monday
      expect(BookingLogic.isValidBookingDate(nextMonday)).toBe(true)
    })

    it('should reject Sundays', () => {
      const date = new Date('2024-01-14') // A Sunday
      expect(BookingLogic.isValidBookingDate(date)).toBe(false)
    })
  })

  describe('isValidBookingTime', () => {
    it('should accept time within business hours', () => {
      const monday = new Date('2024-01-15') // A Monday
      expect(BookingLogic.isValidBookingTime('10:00', monday)).toBe(true)
      expect(BookingLogic.isValidBookingTime('16:30', monday)).toBe(true)
    })

    it('should reject time outside business hours', () => {
      const monday = new Date('2024-01-15')
      expect(BookingLogic.isValidBookingTime('08:00', monday)).toBe(false)
      expect(BookingLogic.isValidBookingTime('18:00', monday)).toBe(false)
    })

    it('should reject time on closed days', () => {
      const sunday = new Date('2024-01-14')
      expect(BookingLogic.isValidBookingTime('10:00', sunday)).toBe(false)
    })

    it('should handle Saturday shorter hours', () => {
      const saturday = new Date('2024-01-13')
      expect(BookingLogic.isValidBookingTime('14:00', saturday)).toBe(true)
      expect(BookingLogic.isValidBookingTime('16:00', saturday)).toBe(false)
    })
  })

  describe('generateTimeSlots', () => {
    it('should generate correct slots for a weekday', () => {
      const monday = new Date('2024-01-15')
      const serviceDuration = 60 // 1 hour service
      const slots = BookingLogic.generateTimeSlots(monday, serviceDuration)

      expect(slots).toContain('09:00')
      expect(slots).toContain('16:00') // Last slot that allows 1 hour service
      expect(slots).not.toContain('17:00') // Would end after business hours
    })

    it('should generate correct slots for Saturday', () => {
      const saturday = new Date('2024-01-13')
      const serviceDuration = 60
      const slots = BookingLogic.generateTimeSlots(saturday, serviceDuration)

      expect(slots).toContain('09:00')
      expect(slots).toContain('14:00') // Last slot that allows 1 hour service
      expect(slots).not.toContain('15:00') // Would end after Saturday closing
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

      expect(slots).toContain('09:00')
      expect(slots).toContain('15:00') // Last slot that allows 2 hour service
      expect(slots).not.toContain('16:00') // Would end after business hours
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
        newStart,
        newDuration,
        existingAppointments
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
        newStart,
        newDuration,
        existingAppointments
      )

      expect(hasConflict).toBe(false)
    })

    it('should handle adjacent appointments correctly', () => {
      const newStart = new Date('2024-01-15T10:00:00')
      const newDuration = 60

      const existingAppointments = [
        { start: new Date('2024-01-15T09:00:00'), duration: 60 }
      ]

      const hasConflict = BookingLogic.validateAppointmentConflict(
        newStart,
        newDuration,
        existingAppointments
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
      expect(BookingLogic.isValidSwissPhone('+41123456789')).toBe(false) // Too many digits
      expect(BookingLogic.isValidSwissPhone('+4179123456')).toBe(false) // Too few digits
      expect(BookingLogic.isValidSwissPhone('+49791234567')).toBe(false) // German number
      expect(BookingLogic.isValidSwissPhone('791234567')).toBe(false) // Missing prefix
    })

    it('should handle phone numbers with spaces', () => {
      expect(BookingLogic.isValidSwissPhone('+41 79 123 45 67')).toBe(true)
      expect(BookingLogic.isValidSwissPhone('079 123 45 67')).toBe(true)
    })
  })
})