import {
  format,
  addMinutes,
  startOfDay,
  addMonths,
  isBefore,
  isAfter
} from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

const TIMEZONE = 'Europe/Zurich'

export class BookingLogic {
  // Swiss VAT rate
  static readonly VAT_RATE = 0.077
  static readonly MAX_ADVANCE_MONTHS = 6

  // Business hours
  static readonly BUSINESS_HOURS = {
    weekday: { start: '08:00', end: '18:00' },
    saturday: { start: '09:00', end: '16:00' },
    sunday: null as { start: string; end: string } | null
  }

  static calculatePriceWithVAT(
    basePrice: number,
    includeVAT: boolean = true
  ): { subtotal: number; vat: number; total: number } {
    const vat = includeVAT ? Math.round(basePrice * this.VAT_RATE) : 0
    const total = includeVAT ? basePrice + vat : basePrice
    return { subtotal: basePrice, vat, total }
  }

  static calculateVATAmount(amount: number): number {
    return Math.round(amount * this.VAT_RATE)
  }

  static formatSwissPrice(priceCents: number): string {
    const formatter = new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })

    // Replace non-breaking spaces with regular spaces for consistency in tests/UI
    return formatter.format(priceCents / 100).replace(/\u00a0/g, ' ')
  }

  static calculateBookingEndTime(startTime: Date, durationMinutes: number): Date {
    return addMinutes(startTime, durationMinutes)
  }

  static isBusinessDay(date: Date): boolean {
    const zonedDate = toZonedTime(date, TIMEZONE)
    const day = zonedDate.getDay()
    return day !== 0
  }

  static isValidBookingDate(date: Date): boolean {
    const zonedDate = toZonedTime(date, TIMEZONE)
    const bookingDayStart = startOfDay(zonedDate)

    if (!this.isBusinessDay(zonedDate)) {
      return false
    }

    const today = toZonedTime(new Date(), TIMEZONE)
    const todayStart = startOfDay(today)

    if (isBefore(bookingDayStart, todayStart)) {
      return false
    }

    const maxDate = addMonths(todayStart, this.MAX_ADVANCE_MONTHS)
    if (isAfter(bookingDayStart, maxDate)) {
      return false
    }

    return true
  }

  static generateTimeSlots(date: Date, serviceDuration: number): string[] {
    const zonedDate = toZonedTime(date, TIMEZONE)

    // Closed on Sunday
    if (!this.isBusinessDay(zonedDate)) {
      return []
    }

    const hours = zonedDate.getDay() === 6
      ? this.BUSINESS_HOURS.saturday
      : this.BUSINESS_HOURS.weekday

    if (!hours) return []

    const slots: string[] = []
    const [startHour, startMin] = hours.start.split(':').map(Number)
    const [endHour, endMin] = hours.end.split(':').map(Number)

    let currentTime = new Date(zonedDate)
    currentTime.setHours(startHour, startMin, 0, 0)

    const endTime = new Date(zonedDate)
    endTime.setHours(endHour, endMin, 0, 0)

    // Generate slots every 30 minutes
    while (currentTime < endTime) {
      // Check if service can be completed before closing
      const serviceEndTime = addMinutes(currentTime, serviceDuration)
      if (serviceEndTime <= endTime) {
        slots.push(format(currentTime, 'HH:mm'))
      }
      // Move to next 30-minute slot
      currentTime = addMinutes(currentTime, 30)
    }

    return slots
  }

  static isValidBookingTime(time: string, date: Date): boolean {
    const zonedDate = toZonedTime(date, TIMEZONE)

    if (!this.isBusinessDay(zonedDate)) {
      return false
    }

    const hours = zonedDate.getDay() === 6
      ? this.BUSINESS_HOURS.saturday
      : this.BUSINESS_HOURS.weekday

    if (!hours) {
      return false
    }

    const [hour, minute] = time.split(':').map(Number)
    if (Number.isNaN(hour) || Number.isNaN(minute)) {
      return false
    }

    const [startHour, startMinute] = hours.start.split(':').map(Number)
    const [endHour, endMinute] = hours.end.split(':').map(Number)

    const totalMinutes = hour * 60 + minute
    const startMinutes = startHour * 60 + startMinute
    const endMinutes = endHour * 60 + endMinute

    return totalMinutes >= startMinutes && totalMinutes < endMinutes
  }

  static validateAppointmentConflict(
    newStart: Date,
    newDuration: number,
    existingAppointments: { start: Date; duration: number }[]
  ): boolean {
    const newEnd = this.calculateBookingEndTime(newStart, newDuration)

    for (const existing of existingAppointments) {
      const existingEnd = this.calculateBookingEndTime(existing.start, existing.duration)

      // Check for overlap
      const overlaps = (
        (newStart >= existing.start && newStart < existingEnd) || // New starts during existing
        (newEnd > existing.start && newEnd <= existingEnd) || // New ends during existing
        (newStart <= existing.start && newEnd >= existingEnd) // New encompasses existing
      )

      if (overlaps) {
        return true // Conflict detected
      }
    }

    return false // No conflict
  }

  static isValidSwissPhone(phone: string): boolean {
    const cleaned = phone.replace(/[\s-]/g, '')

    const international = cleaned.startsWith('+41') || cleaned.startsWith('0041')
    const national = cleaned.startsWith('0')

    if (!international && !national) {
      return false
    }

    let digits = cleaned
    if (international) {
      digits = cleaned.replace(/^\+41/, '').replace(/^0041/, '')
    } else {
      digits = cleaned.substring(1)
    }

    if (digits.length !== 9) {
      return false
    }

    const prefix = digits.substring(0, 2)
    const firstDigit = digits[0]

    if (firstDigit === '7') {
      return /^7[6-9]/.test(prefix)
    }

    return /^[1-6]\d$/.test(prefix)
  }

  static validateSwissPostalCode(code: string): boolean {
    // Swiss postal codes are 4 digits from 1000 to 9999
    const num = parseInt(code, 10)
    return /^\d{4}$/.test(code) && num >= 1000 && num <= 9999
  }

  static calculateDeposit(totalAmount: number): number {
    // 30% deposit for bookings
    return Math.round(totalAmount * 0.3)
  }

  static getCancellationDeadline(appointmentDate: Date): Date {
    // 24 hours before appointment
    const deadline = new Date(appointmentDate)
    deadline.setHours(deadline.getHours() - 24)
    return deadline
  }

  static canCancelAppointment(appointmentDate: Date): boolean {
    const now = new Date()
    const deadline = this.getCancellationDeadline(appointmentDate)
    return now < deadline
  }
}