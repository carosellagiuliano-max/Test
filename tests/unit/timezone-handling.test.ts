import { describe, it, expect, beforeEach } from 'vitest'
import { addHours, addDays, format, parseISO } from 'date-fns'
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz'

/**
 * Swiss Timezone Manager for handling Europe/Zurich timezone
 */
export class SwissTimezoneManager {
  static readonly TIMEZONE = 'Europe/Zurich'

  /**
   * Convert local Swiss time to UTC
   */
  static toUTC(localTime: Date | string): Date {
    const date = typeof localTime === 'string' ? parseISO(localTime) : localTime
    return zonedTimeToUtc(date, this.TIMEZONE)
  }

  /**
   * Convert UTC to Swiss local time
   */
  static toLocal(utcTime: Date | string): Date {
    const date = typeof utcTime === 'string' ? parseISO(utcTime) : utcTime
    return utcToZonedTime(date, this.TIMEZONE)
  }

  /**
   * Check if date is during daylight saving time in Switzerland
   */
  static isDST(date: Date): boolean {
    const year = date.getFullYear()

    // DST in Switzerland: Last Sunday in March to last Sunday in October
    const march = new Date(year, 2, 31) // March 31st
    const lastSundayMarch = new Date(march.setDate(march.getDate() - march.getDay()))

    const october = new Date(year, 9, 31) // October 31st
    const lastSundayOctober = new Date(october.setDate(october.getDate() - october.getDay()))

    return date >= lastSundayMarch && date < lastSundayOctober
  }

  /**
   * Get offset from UTC in hours for Switzerland at given date
   */
  static getUTCOffset(date: Date): number {
    return this.isDST(date) ? 2 : 1 // +2 hours DST, +1 hour standard
  }

  /**
   * Format date for Swiss display (dd.MM.yyyy HH:mm)
   */
  static formatSwiss(date: Date): string {
    return format(this.toLocal(date), 'dd.MM.yyyy HH:mm')
  }

  /**
   * Parse Swiss date format to UTC
   */
  static parseSwiss(dateString: string): Date {
    // Assume format: dd.MM.yyyy HH:mm
    const [datePart, timePart] = dateString.split(' ')
    const [day, month, year] = datePart.split('.')
    const [hours, minutes] = timePart.split(':')

    const localDate = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours),
      parseInt(minutes)
    )

    return this.toUTC(localDate)
  }

  /**
   * Check if two dates are the same day in Swiss timezone
   */
  static isSameDaySwiss(date1: Date, date2: Date): boolean {
    const local1 = this.toLocal(date1)
    const local2 = this.toLocal(date2)

    return (
      local1.getFullYear() === local2.getFullYear() &&
      local1.getMonth() === local2.getMonth() &&
      local1.getDate() === local2.getDate()
    )
  }

  /**
   * Get business day boundaries in Swiss timezone
   */
  static getBusinessDayBounds(date: Date): { start: Date; end: Date } {
    const localDate = this.toLocal(date)

    const startLocal = new Date(localDate)
    startLocal.setHours(8, 0, 0, 0) // 8:00 AM

    const endLocal = new Date(localDate)
    endLocal.setHours(18, 0, 0, 0) // 6:00 PM

    return {
      start: this.toUTC(startLocal),
      end: this.toUTC(endLocal)
    }
  }
}

describe('Swiss Timezone Handling', () => {
  describe('UTC Conversion', () => {
    it('should convert Swiss winter time to UTC correctly', () => {
      // January 15, 2024 10:00 AM Swiss time (UTC+1)
      const swissWinter = new Date('2024-01-15T10:00:00')
      const utc = SwissTimezoneManager.toUTC(swissWinter)

      // Should be 9:00 AM UTC
      expect(utc.getHours()).toBe(9)
    })

    it('should convert Swiss summer time to UTC correctly', () => {
      // July 15, 2024 10:00 AM Swiss time (UTC+2)
      const swissSummer = new Date('2024-07-15T10:00:00')
      const utc = SwissTimezoneManager.toUTC(swissSummer)

      // Should be 8:00 AM UTC
      expect(utc.getHours()).toBe(8)
    })

    it('should convert UTC to Swiss local time correctly', () => {
      // 9:00 AM UTC in January (should be 10:00 AM Swiss time)
      const utcWinter = new Date('2024-01-15T09:00:00Z')
      const swissLocal = SwissTimezoneManager.toLocal(utcWinter)

      expect(swissLocal.getHours()).toBe(10)
    })
  })

  describe('Daylight Saving Time Detection', () => {
    it('should correctly identify DST periods', () => {
      // Summer - should be DST
      expect(SwissTimezoneManager.isDST(new Date('2024-07-15'))).toBe(true)
      expect(SwissTimezoneManager.isDST(new Date('2024-06-21'))).toBe(true) // Summer solstice

      // Winter - should not be DST
      expect(SwissTimezoneManager.isDST(new Date('2024-01-15'))).toBe(false)
      expect(SwissTimezoneManager.isDST(new Date('2024-12-21'))).toBe(false) // Winter solstice
    })

    it('should handle DST transition dates', () => {
      // Last Sunday in March 2024 was March 31st
      expect(SwissTimezoneManager.isDST(new Date('2024-03-30'))).toBe(false) // Day before
      expect(SwissTimezoneManager.isDST(new Date('2024-04-01'))).toBe(true)  // Day after

      // Last Sunday in October 2024 was October 27th
      expect(SwissTimezoneManager.isDST(new Date('2024-10-26'))).toBe(true)  // Day before
      expect(SwissTimezoneManager.isDST(new Date('2024-10-28'))).toBe(false) // Day after
    })
  })

  describe('UTC Offset Calculation', () => {
    it('should return correct UTC offsets', () => {
      // Winter: UTC+1
      expect(SwissTimezoneManager.getUTCOffset(new Date('2024-01-15'))).toBe(1)
      expect(SwissTimezoneManager.getUTCOffset(new Date('2024-12-15'))).toBe(1)

      // Summer: UTC+2
      expect(SwissTimezoneManager.getUTCOffset(new Date('2024-07-15'))).toBe(2)
      expect(SwissTimezoneManager.getUTCOffset(new Date('2024-08-15'))).toBe(2)
    })
  })

  describe('Swiss Date Formatting', () => {
    it('should format dates in Swiss format', () => {
      const date = new Date('2024-07-15T14:30:00Z') // 2:30 PM UTC
      const formatted = SwissTimezoneManager.formatSwiss(date)

      // Should be 4:30 PM Swiss time (UTC+2 in summer)
      expect(formatted).toBe('15.07.2024 16:30')
    })

    it('should parse Swiss format dates', () => {
      const swissDate = '15.07.2024 16:30'
      const parsed = SwissTimezoneManager.parseSwiss(swissDate)

      // Should convert to UTC
      expect(parsed.getUTCHours()).toBe(14) // 4:30 PM Swiss = 2:30 PM UTC in summer
    })
  })

  describe('Same Day Comparison', () => {
    it('should correctly identify same days in Swiss timezone', () => {
      // Two times on the same Swiss day but different UTC days
      const morning = new Date('2024-07-15T06:00:00Z') // 8:00 AM Swiss time
      const evening = new Date('2024-07-15T22:00:00Z') // 12:00 AM Swiss time (next day)

      expect(SwissTimezoneManager.isSameDaySwiss(morning, evening)).toBe(false)

      // Same Swiss day
      const noon = new Date('2024-07-15T10:00:00Z')    // 12:00 PM Swiss time
      const afternoon = new Date('2024-07-15T14:00:00Z') // 4:00 PM Swiss time

      expect(SwissTimezoneManager.isSameDaySwiss(noon, afternoon)).toBe(true)
    })
  })

  describe('Business Hours', () => {
    it('should calculate correct business day boundaries', () => {
      const testDate = new Date('2024-07-15') // Summer day
      const bounds = SwissTimezoneManager.getBusinessDayBounds(testDate)

      // Should be 8:00 AM to 6:00 PM Swiss time
      // In summer (UTC+2): 6:00 AM to 4:00 PM UTC
      expect(bounds.start.getUTCHours()).toBe(6)
      expect(bounds.end.getUTCHours()).toBe(16)
    })

    it('should handle winter business hours', () => {
      const testDate = new Date('2024-01-15') // Winter day
      const bounds = SwissTimezoneManager.getBusinessDayBounds(testDate)

      // Should be 8:00 AM to 6:00 PM Swiss time
      // In winter (UTC+1): 7:00 AM to 5:00 PM UTC
      expect(bounds.start.getUTCHours()).toBe(7)
      expect(bounds.end.getUTCHours()).toBe(17)
    })
  })

  describe('Edge Cases', () => {
    it('should handle New Year transition', () => {
      const newYearEve = new Date('2023-12-31T23:30:00')
      const newYearDay = new Date('2024-01-01T00:30:00')

      expect(SwissTimezoneManager.isSameDaySwiss(newYearEve, newYearDay)).toBe(false)
    })

    it('should handle leap year dates', () => {
      const leapDay = new Date('2024-02-29T12:00:00')
      const formatted = SwissTimezoneManager.formatSwiss(leapDay)

      expect(formatted).toContain('29.02.2024')
    })

    it('should handle string date inputs', () => {
      const isoString = '2024-07-15T14:30:00Z'
      const utc = SwissTimezoneManager.toUTC(isoString)
      const local = SwissTimezoneManager.toLocal(isoString)

      expect(utc).toBeInstanceOf(Date)
      expect(local).toBeInstanceOf(Date)
    })
  })
})