import { describe, it, expect } from 'vitest'
import { SwissTimezoneManager } from '../../lib/swiss-timezone'

describe('Swiss Timezone Handling', () => {
  describe('UTC Conversion', () => {
    it('should convert Swiss winter time to UTC correctly', () => {
      const swissWinter = new Date('2024-01-15T10:00:00')
      const utc = SwissTimezoneManager.toUTC(swissWinter)
      expect(utc.getUTCHours()).toBe(9)
    })

    it('should convert Swiss summer time to UTC correctly', () => {
      const swissSummer = new Date('2024-07-15T10:00:00')
      const utc = SwissTimezoneManager.toUTC(swissSummer)
      expect(utc.getUTCHours()).toBe(8)
    })

    it('should convert UTC to Swiss local time correctly', () => {
      const utcWinter = new Date('2024-01-15T09:00:00Z')
      const swissLocal = SwissTimezoneManager.toLocal(utcWinter)
      expect(swissLocal.getHours()).toBe(10)
    })
  })

  describe('Daylight Saving Time Detection', () => {
    it('should correctly identify DST periods', () => {
      expect(SwissTimezoneManager.isDST(new Date('2024-07-15'))).toBe(true)
      expect(SwissTimezoneManager.isDST(new Date('2024-06-21'))).toBe(true)
      expect(SwissTimezoneManager.isDST(new Date('2024-01-15'))).toBe(false)
      expect(SwissTimezoneManager.isDST(new Date('2024-12-21'))).toBe(false)
    })

    it('should handle DST transition dates', () => {
      expect(SwissTimezoneManager.isDST(new Date('2024-03-30'))).toBe(false)
      expect(SwissTimezoneManager.isDST(new Date('2024-04-01'))).toBe(true)
      expect(SwissTimezoneManager.isDST(new Date('2024-10-26'))).toBe(true)
      expect(SwissTimezoneManager.isDST(new Date('2024-10-28'))).toBe(false)
    })
  })

  describe('UTC Offset Calculation', () => {
    it('should return correct UTC offsets', () => {
      expect(SwissTimezoneManager.getUTCOffset(new Date('2024-01-15'))).toBe(1)
      expect(SwissTimezoneManager.getUTCOffset(new Date('2024-12-15'))).toBe(1)
      expect(SwissTimezoneManager.getUTCOffset(new Date('2024-07-15'))).toBe(2)
      expect(SwissTimezoneManager.getUTCOffset(new Date('2024-08-15'))).toBe(2)
    })
  })

  describe('Swiss Date Formatting', () => {
    it('should format dates in Swiss format', () => {
      const date = new Date('2024-07-15T14:30:00Z')
      const formatted = SwissTimezoneManager.formatSwiss(date)
      expect(formatted).toBe('15.07.2024 16:30')
    })

    it('should parse Swiss format dates', () => {
      const swissDate = '15.07.2024 16:30'
      const parsed = SwissTimezoneManager.parseSwiss(swissDate)
      expect(parsed.getUTCHours()).toBe(14)
    })
  })

  describe('Same Day Comparison', () => {
    it('should correctly identify same days in Swiss timezone', () => {
      const morning = new Date('2024-07-15T06:00:00Z')
      const evening = new Date('2024-07-15T22:00:00Z')
      expect(SwissTimezoneManager.isSameDaySwiss(morning, evening)).toBe(false)

      const noon = new Date('2024-07-15T10:00:00Z')
      const afternoon = new Date('2024-07-15T14:00:00Z')
      expect(SwissTimezoneManager.isSameDaySwiss(noon, afternoon)).toBe(true)
    })
  })

  describe('Business Hours', () => {
    it('should calculate correct business day boundaries', () => {
      const testDate = new Date('2024-07-15')
      const bounds = SwissTimezoneManager.getBusinessDayBounds(testDate)
      expect(bounds.start.getUTCHours()).toBe(6)
      expect(bounds.end.getUTCHours()).toBe(16)
    })

    it('should handle winter business hours', () => {
      const testDate = new Date('2024-01-15')
      const bounds = SwissTimezoneManager.getBusinessDayBounds(testDate)
      expect(bounds.start.getUTCHours()).toBe(7)
      expect(bounds.end.getUTCHours()).toBe(17)
    })
  })

  describe('Edge Cases', () => {
    it('should handle New Year transition', () => {
      const newYearEve = SwissTimezoneManager.toUTC('2023-12-31T23:30:00')
      const newYearDay = SwissTimezoneManager.toUTC('2024-01-01T00:30:00')
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
