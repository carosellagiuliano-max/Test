import { format, isWeekend, isSunday, parse, addMinutes, isWithinInterval } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'

const TIMEZONE = 'Europe/Zurich'

export class BookingLogic {
  // Swiss VAT rate
  static readonly VAT_RATE = 0.077

  // Business hours
  static readonly BUSINESS_HOURS = {
    weekday: { start: '08:00', end: '18:00' },
    saturday: { start: '09:00', end: '16:00' },
    sunday: null // Closed
  }

  static calculatePriceWithVAT(basePrice: number): { subtotal: number; vat: number; total: number } {
    const vat = Math.round(basePrice * this.VAT_RATE)
    const total = basePrice + vat
    return { subtotal: basePrice, vat, total }
  }

  static formatSwissPrice(priceCents: number): string {
    const price = priceCents / 100
    return `CHF ${price.toFixed(2).replace('.', '.')}`
  }

  static calculateBookingEndTime(startTime: Date, durationMinutes: number): Date {
    return addMinutes(startTime, durationMinutes)
  }

  static isBusinessDay(date: Date): boolean {
    const zonedDate = toZonedTime(date, TIMEZONE)
    return !isSunday(zonedDate)
  }

  static isValidBookingDate(date: Date): boolean {
    const zonedDate = toZonedTime(date, TIMEZONE)

    // Check if it's a business day
    if (!this.isBusinessDay(zonedDate)) {
      return false
    }

    // Check if it's in the future
    const now = toZonedTime(new Date(), TIMEZONE)
    return zonedDate > now
  }

  static generateTimeSlots(date: Date, serviceDuration: number): string[] {
    const zonedDate = toZonedTime(date, TIMEZONE)

    // Closed on Sunday
    if (isSunday(zonedDate)) {
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
    // Remove all spaces and hyphens
    const cleaned = phone.replace(/[\s-]/g, '')

    // Swiss phone number patterns:
    // +41791234567 (international)
    // 0041791234567 (international alternative)
    // 0791234567 (national)

    // Must match exactly the right number of digits
    const patterns = [
      /^(\+41|0041)[1-9]\d{8}$/, // International format (total 11 or 13 chars)
      /^0[1-9]\d{8}$/ // National format (total 10 digits)
    ]

    return patterns.some(pattern => pattern.test(cleaned))
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