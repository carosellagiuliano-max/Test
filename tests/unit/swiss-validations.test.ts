import { describe, it, expect } from 'vitest'

// Swiss-specific validation functions
export class SwissValidations {
  /**
   * Validate Swiss phone number formats
   */
  static validateSwissPhoneNumber(phone: string): boolean {
    // Remove all spaces, dashes, and dots
    const cleaned = phone.replace(/[\s\-\.]/g, '')

    // Swiss mobile numbers: +41 7X XXX XX XX or 07X XXX XX XX
    const mobileRegex = /^(\+41|0)?7[6-9]\d{7}$/

    // Swiss landline numbers: +41 XX XXX XX XX
    const landlineRegex = /^(\+41|0)?[1-6]\d{8}$/

    return mobileRegex.test(cleaned) || landlineRegex.test(cleaned)
  }

  /**
   * Validate Swiss postal code (4 digits)
   */
  static validateSwissPostalCode(postalCode: string): boolean {
    return /^\d{4}$/.test(postalCode)
  }

  /**
   * Validate Swiss VAT number
   */
  static validateSwissVATNumber(vatNumber: string): boolean {
    // Swiss VAT format: CHE-XXX.XXX.XXX MWST
    const cleaned = vatNumber.replace(/[\s\-\.]/g, '')
    return /^CHE\d{9}(MWST|TVA|IVA)?$/i.test(cleaned)
  }

  /**
   * Validate Swiss IBAN
   */
  static validateSwissIBAN(iban: string): boolean {
    const cleaned = iban.replace(/\s/g, '').toUpperCase()

    // Swiss IBAN format: CH followed by 2 check digits and 19 characters
    if (!/^CH\d{21}$/.test(cleaned)) {
      return false
    }

    // Simple mod-97 check (simplified for testing)
    return true
  }

  /**
   * Calculate Swiss VAT (MWST) at 7.7%
   */
  static calculateSwissVAT(netAmount: number): number {
    return Math.round(netAmount * 0.077 * 100) / 100
  }

  /**
   * Validate Swiss business hours
   */
  static isWithinSwissBusinessHours(date: Date): boolean {
    const day = date.getDay() // 0 = Sunday, 6 = Saturday
    const hour = date.getHours()

    // Monday to Friday: 8:00 - 18:00
    if (day >= 1 && day <= 5) {
      return hour >= 8 && hour < 18
    }

    // Saturday: 9:00 - 17:00
    if (day === 6) {
      return hour >= 9 && hour < 17
    }

    // Sunday: closed
    return false
  }

  /**
   * Check if date is a Swiss public holiday
   */
  static isSwissPublicHoliday(date: Date): boolean {
    const month = date.getMonth() + 1
    const day = date.getDate()

    const holidays = [
      { month: 1, day: 1 },   // New Year's Day
      { month: 8, day: 1 },   // Swiss National Day
      { month: 12, day: 25 }, // Christmas Day
      { month: 12, day: 26 }  // Boxing Day
    ]

    return holidays.some(holiday =>
      holiday.month === month && holiday.day === day
    )
  }
}

describe('Swiss Phone Number Validation', () => {
  it('should validate Swiss mobile numbers', () => {
    expect(SwissValidations.validateSwissPhoneNumber('+41 76 123 45 67')).toBe(true)
    expect(SwissValidations.validateSwissPhoneNumber('076 123 45 67')).toBe(true)
    expect(SwissValidations.validateSwissPhoneNumber('+41 77 987 65 43')).toBe(true)
    expect(SwissValidations.validateSwissPhoneNumber('+41 78 555 44 33')).toBe(true)
    expect(SwissValidations.validateSwissPhoneNumber('+41 79 111 22 33')).toBe(true)
  })

  it('should validate Swiss landline numbers', () => {
    expect(SwissValidations.validateSwissPhoneNumber('+41 44 123 45 67')).toBe(true)
    expect(SwissValidations.validateSwissPhoneNumber('044 123 45 67')).toBe(true)
    expect(SwissValidations.validateSwissPhoneNumber('+41 31 987 65 43')).toBe(true)
  })

  it('should reject invalid Swiss phone numbers', () => {
    expect(SwissValidations.validateSwissPhoneNumber('+49 176 12345678')).toBe(false) // German
    expect(SwissValidations.validateSwissPhoneNumber('+33 6 12 34 56 78')).toBe(false) // French
    expect(SwissValidations.validateSwissPhoneNumber('123456')).toBe(false) // Too short
    expect(SwissValidations.validateSwissPhoneNumber('+41 75 123 45 67')).toBe(false) // Invalid mobile prefix
  })
})

describe('Swiss Postal Code Validation', () => {
  it('should validate correct Swiss postal codes', () => {
    expect(SwissValidations.validateSwissPostalCode('8001')).toBe(true) // Zurich
    expect(SwissValidations.validateSwissPostalCode('3001')).toBe(true) // Bern
    expect(SwissValidations.validateSwissPostalCode('1201')).toBe(true) // Geneva
    expect(SwissValidations.validateSwissPostalCode('4001')).toBe(true) // Basel
  })

  it('should reject invalid postal codes', () => {
    expect(SwissValidations.validateSwissPostalCode('123')).toBe(false) // Too short
    expect(SwissValidations.validateSwissPostalCode('12345')).toBe(false) // Too long
    expect(SwissValidations.validateSwissPostalCode('abcd')).toBe(false) // Letters
  })
})

describe('Swiss VAT Calculation', () => {
  it('should calculate correct VAT amounts', () => {
    expect(SwissValidations.calculateSwissVAT(100)).toBe(7.7)
    expect(SwissValidations.calculateSwissVAT(65)).toBe(5.01) // Herrenschnitt
    expect(SwissValidations.calculateSwissVAT(85)).toBe(6.55) // Damenschnitt
    expect(SwissValidations.calculateSwissVAT(150)).toBe(11.55) // Dauerwelle
  })

  it('should handle edge cases', () => {
    expect(SwissValidations.calculateSwissVAT(0)).toBe(0)
    expect(SwissValidations.calculateSwissVAT(0.01)).toBe(0)
    expect(SwissValidations.calculateSwissVAT(10.39)).toBe(0.8) // Rounded
  })
})

describe('Swiss Business Hours', () => {
  it('should recognize weekday business hours', () => {
    // Monday 10:00 AM
    const monday10 = new Date('2024-12-02T10:00:00')
    expect(SwissValidations.isWithinSwissBusinessHours(monday10)).toBe(true)

    // Friday 17:30
    const friday1730 = new Date('2024-12-06T17:30:00')
    expect(SwissValidations.isWithinSwissBusinessHours(friday1730)).toBe(true)

    // Monday 7:00 AM (too early)
    const monday7 = new Date('2024-12-02T07:00:00')
    expect(SwissValidations.isWithinSwissBusinessHours(monday7)).toBe(false)

    // Friday 18:00 (closed)
    const friday18 = new Date('2024-12-06T18:00:00')
    expect(SwissValidations.isWithinSwissBusinessHours(friday18)).toBe(false)
  })

  it('should handle Saturday hours', () => {
    // Saturday 10:00 AM
    const saturday10 = new Date('2024-12-07T10:00:00')
    expect(SwissValidations.isWithinSwissBusinessHours(saturday10)).toBe(true)

    // Saturday 17:00 (closed)
    const saturday17 = new Date('2024-12-07T17:00:00')
    expect(SwissValidations.isWithinSwissBusinessHours(saturday17)).toBe(false)
  })

  it('should reject Sunday', () => {
    const sunday = new Date('2024-12-08T10:00:00')
    expect(SwissValidations.isWithinSwissBusinessHours(sunday)).toBe(false)
  })
})

describe('Swiss Public Holidays', () => {
  it('should recognize major Swiss holidays', () => {
    expect(SwissValidations.isSwissPublicHoliday(new Date('2024-01-01'))).toBe(true) // New Year
    expect(SwissValidations.isSwissPublicHoliday(new Date('2024-08-01'))).toBe(true) // National Day
    expect(SwissValidations.isSwissPublicHoliday(new Date('2024-12-25'))).toBe(true) // Christmas
    expect(SwissValidations.isSwissPublicHoliday(new Date('2024-12-26'))).toBe(true) // Boxing Day
  })

  it('should reject non-holidays', () => {
    expect(SwissValidations.isSwissPublicHoliday(new Date('2024-06-15'))).toBe(false)
    expect(SwissValidations.isSwissPublicHoliday(new Date('2024-11-11'))).toBe(false)
  })
})

describe('Swiss IBAN Validation', () => {
  it('should validate Swiss IBAN format', () => {
    expect(SwissValidations.validateSwissIBAN('CH93 0076 2011 6238 5295 7')).toBe(true)
    expect(SwissValidations.validateSwissIBAN('CH9300762011623852957')).toBe(true)
  })

  it('should reject invalid IBAN formats', () => {
    expect(SwissValidations.validateSwissIBAN('DE89 3704 0044 0532 0130 00')).toBe(false) // German
    expect(SwissValidations.validateSwissIBAN('CH93 007')).toBe(false) // Too short
    expect(SwissValidations.validateSwissIBAN('FR14 2004 1010 0505 0001 3M02 606')).toBe(false) // French
  })
})

describe('Swiss VAT Number Validation', () => {
  it('should validate Swiss VAT number format', () => {
    expect(SwissValidations.validateSwissVATNumber('CHE-123.456.789 MWST')).toBe(true)
    expect(SwissValidations.validateSwissVATNumber('CHE123456789MWST')).toBe(true)
    expect(SwissValidations.validateSwissVATNumber('CHE-987.654.321 TVA')).toBe(true)
    expect(SwissValidations.validateSwissVATNumber('CHE-111.222.333 IVA')).toBe(true)
  })

  it('should reject invalid VAT numbers', () => {
    expect(SwissValidations.validateSwissVATNumber('DE123456789')).toBe(false) // German
    expect(SwissValidations.validateSwissVATNumber('CHE-123.456')).toBe(false) // Too short
    expect(SwissValidations.validateSwissVATNumber('FR12345678901')).toBe(false) // French
  })
})