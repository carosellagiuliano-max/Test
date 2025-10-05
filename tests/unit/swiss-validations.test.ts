import { describe, it, expect } from 'vitest'
import { SwissValidations } from '../../lib/swiss-validations'

describe('Swiss Phone Number Validation', () => {
  it('should accept valid Swiss mobile numbers', () => {
    expect(SwissValidations.validateSwissPhoneNumber('+41 76 123 45 67')).toBe(true)
    expect(SwissValidations.validateSwissPhoneNumber('076 123 45 67')).toBe(true)
    expect(SwissValidations.validateSwissPhoneNumber('+41 77 987 65 43')).toBe(true)
    expect(SwissValidations.validateSwissPhoneNumber('+41 78 555 44 33')).toBe(true)
    expect(SwissValidations.validateSwissPhoneNumber('+41 79 111 22 33')).toBe(true)
  })

  it('should accept valid Swiss landline numbers', () => {
    expect(SwissValidations.validateSwissPhoneNumber('+41 44 123 45 67')).toBe(true)
    expect(SwissValidations.validateSwissPhoneNumber('044 123 45 67')).toBe(true)
    expect(SwissValidations.validateSwissPhoneNumber('+41 31 987 65 43')).toBe(true)
  })

  it('should reject invalid phone numbers', () => {
    expect(SwissValidations.validateSwissPhoneNumber('+49 176 12345678')).toBe(false)
    expect(SwissValidations.validateSwissPhoneNumber('+33 6 12 34 56 78')).toBe(false)
    expect(SwissValidations.validateSwissPhoneNumber('123456')).toBe(false)
    expect(SwissValidations.validateSwissPhoneNumber('+41 75 123 45 67')).toBe(false)
  })
})

describe('Swiss Postal Code Validation', () => {
  it('should accept valid postal codes', () => {
    expect(SwissValidations.validateSwissPostalCode('8001')).toBe(true)
    expect(SwissValidations.validateSwissPostalCode('3001')).toBe(true)
    expect(SwissValidations.validateSwissPostalCode('1201')).toBe(true)
    expect(SwissValidations.validateSwissPostalCode('4001')).toBe(true)
  })

  it('should reject invalid postal codes', () => {
    expect(SwissValidations.validateSwissPostalCode('123')).toBe(false)
    expect(SwissValidations.validateSwissPostalCode('12345')).toBe(false)
    expect(SwissValidations.validateSwissPostalCode('abcd')).toBe(false)
  })
})

describe('Swiss VAT Calculation', () => {
  it('should calculate VAT correctly for typical services', () => {
    expect(SwissValidations.calculateSwissVAT(100)).toBe(7.7)
    expect(SwissValidations.calculateSwissVAT(65)).toBe(5.01)
    expect(SwissValidations.calculateSwissVAT(85)).toBe(6.55)
    expect(SwissValidations.calculateSwissVAT(150)).toBe(11.55)
  })

  it('should handle edge cases', () => {
    expect(SwissValidations.calculateSwissVAT(0)).toBe(0)
    expect(SwissValidations.calculateSwissVAT(0.01)).toBe(0)
    expect(SwissValidations.calculateSwissVAT(10.39)).toBe(0.8)
  })
})

describe('Swiss Business Hours', () => {
  it('should identify hours within standard business times', () => {
    const monday10 = new Date('2024-01-15T09:00:00Z')
    const friday1730 = new Date('2024-01-19T16:30:00Z')

    expect(SwissValidations.isWithinSwissBusinessHours(monday10)).toBe(true)
    expect(SwissValidations.isWithinSwissBusinessHours(friday1730)).toBe(true)
  })

  it('should reject times outside business hours', () => {
    const monday7 = new Date('2024-01-15T06:00:00Z')
    const friday18 = new Date('2024-01-19T17:00:00Z')
    const saturday17 = new Date('2024-01-20T16:00:00Z')
    const sunday = new Date('2024-01-21T10:00:00Z')

    expect(SwissValidations.isWithinSwissBusinessHours(monday7)).toBe(false)
    expect(SwissValidations.isWithinSwissBusinessHours(friday18)).toBe(false)
    expect(SwissValidations.isWithinSwissBusinessHours(saturday17)).toBe(false)
    expect(SwissValidations.isWithinSwissBusinessHours(sunday)).toBe(false)
  })

  it('should handle Saturday hours correctly', () => {
    const saturday10 = new Date('2024-01-20T09:00:00Z')
    expect(SwissValidations.isWithinSwissBusinessHours(saturday10)).toBe(true)
  })
})

describe('Swiss Public Holidays', () => {
  it('should recognise national public holidays', () => {
    expect(SwissValidations.isSwissPublicHoliday(new Date('2024-01-01'))).toBe(true)
    expect(SwissValidations.isSwissPublicHoliday(new Date('2024-08-01'))).toBe(true)
    expect(SwissValidations.isSwissPublicHoliday(new Date('2024-12-25'))).toBe(true)
    expect(SwissValidations.isSwissPublicHoliday(new Date('2024-12-26'))).toBe(true)
  })

  it('should return false for regular days', () => {
    expect(SwissValidations.isSwissPublicHoliday(new Date('2024-06-15'))).toBe(false)
    expect(SwissValidations.isSwissPublicHoliday(new Date('2024-11-11'))).toBe(false)
  })
})

describe('Swiss IBAN Validation', () => {
  it('should accept valid Swiss IBANs', () => {
    expect(SwissValidations.validateSwissIBAN('CH93 0076 2011 6238 5295 7')).toBe(true)
    expect(SwissValidations.validateSwissIBAN('CH9300762011623852957')).toBe(true)
  })

  it('should reject invalid IBANs', () => {
    expect(SwissValidations.validateSwissIBAN('DE89 3704 0044 0532 0130 00')).toBe(false)
    expect(SwissValidations.validateSwissIBAN('CH93 007')).toBe(false)
    expect(SwissValidations.validateSwissIBAN('FR14 2004 1010 0505 0001 3M02 606')).toBe(false)
  })
})

describe('Swiss VAT Number Validation', () => {
  it('should accept valid VAT numbers', () => {
    expect(SwissValidations.validateSwissVATNumber('CHE-123.456.789 MWST')).toBe(true)
    expect(SwissValidations.validateSwissVATNumber('CHE123456789MWST')).toBe(true)
    expect(SwissValidations.validateSwissVATNumber('CHE-987.654.321 TVA')).toBe(true)
    expect(SwissValidations.validateSwissVATNumber('CHE-111.222.333 IVA')).toBe(true)
  })

  it('should reject invalid VAT numbers', () => {
    expect(SwissValidations.validateSwissVATNumber('DE123456789')).toBe(false)
    expect(SwissValidations.validateSwissVATNumber('CHE-123.456')).toBe(false)
    expect(SwissValidations.validateSwissVATNumber('FR12345678901')).toBe(false)
  })
})
