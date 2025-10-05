import { toZonedTime } from 'date-fns-tz'

const TIMEZONE = 'Europe/Zurich'

const BUSINESS_HOURS = {
  weekday: { start: 8, end: 18 },
  saturday: { start: 9, end: 16 }
} as const

const MOBILE_PREFIXES = ['76', '77', '78', '79']
const LANDLINE_PREFIXES = ['21', '22', '24', '26', '27', '31', '32', '33', '34', '41', '43', '44', '51', '52', '55', '56', '61', '62', '71', '81', '91']

const PUBLIC_HOLIDAYS = new Set([
  '01-01', // New Year
  '08-01', // Swiss National Day
  '12-25', // Christmas Day
  '12-26'  // St. Stephen's Day
])

export class SwissValidations {
  static validateSwissPhoneNumber(phone: string): boolean {
    if (!phone) return false

    const cleaned = phone.replace(/[\s\-.]/g, '')

    let digits = ''
    if (cleaned.startsWith('+41')) {
      digits = cleaned.slice(3)
    } else if (cleaned.startsWith('0041')) {
      digits = cleaned.slice(4)
    } else if (cleaned.startsWith('0')) {
      digits = cleaned.slice(1)
    } else {
      return false
    }

    if (digits.length !== 9) {
      return false
    }

    const prefix = digits.slice(0, 2)

    if (digits.startsWith('7')) {
      return MOBILE_PREFIXES.includes(prefix)
    }

    return LANDLINE_PREFIXES.includes(prefix)
  }

  static validateSwissPostalCode(postalCode: string): boolean {
    if (!/^\d{4}$/.test(postalCode)) {
      return false
    }

    const numeric = Number(postalCode)
    return numeric >= 1000 && numeric <= 9999
  }

  static validateSwissVATNumber(vatNumber: string): boolean {
    if (!vatNumber) return false

    const cleaned = vatNumber.replace(/[\s\-.]/g, '').toUpperCase()
    return /^CHE\d{9}(MWST|TVA|IVA)?$/.test(cleaned)
  }

  static validateSwissIBAN(iban: string): boolean {
    if (!iban) return false

    const cleaned = iban.replace(/\s+/g, '').toUpperCase()
    if (!/^CH\d{19}$/.test(cleaned)) {
      return false
    }

    // Move first four characters to the end and convert letters to numbers (A=10)
    const rearranged = cleaned.slice(4) + cleaned.slice(0, 4)
    const converted = rearranged.replace(/[A-Z]/g, char => String(char.charCodeAt(0) - 55))

    // Perform mod-97 check
    let remainder = 0
    for (const digit of converted) {
      remainder = (remainder * 10 + Number(digit)) % 97
    }

    return remainder === 1
  }

  static calculateSwissVAT(amount: number): number {
    if (amount <= 0) return 0
    const vat = amount * 0.077
    return Math.round(vat * 100) / 100
  }

  static isWithinSwissBusinessHours(date: Date): boolean {
    const zonedDate = toZonedTime(date, TIMEZONE)
    const day = zonedDate.getDay()

    if (day === 0) {
      return false
    }

    const hoursConfig = day === 6 ? BUSINESS_HOURS.saturday : BUSINESS_HOURS.weekday
    const hour = zonedDate.getHours() + zonedDate.getMinutes() / 60

    return hour >= hoursConfig.start && hour < hoursConfig.end
  }

  static isSwissPublicHoliday(date: Date): boolean {
    const zonedDate = toZonedTime(date, TIMEZONE)
    const key = `${String(zonedDate.getMonth() + 1).padStart(2, '0')}-${String(zonedDate.getDate()).padStart(2, '0')}`

    if (PUBLIC_HOLIDAYS.has(key)) {
      return true
    }

    // Good Friday and Easter Monday (calculated)
    const year = zonedDate.getFullYear()
    const easter = this.calculateEasterDate(year)
    const goodFriday = new Date(easter)
    goodFriday.setDate(goodFriday.getDate() - 2)
    const easterMonday = new Date(easter)
    easterMonday.setDate(easterMonday.getDate() + 1)

    const goodFridayKey = `${String(goodFriday.getMonth() + 1).padStart(2, '0')}-${String(goodFriday.getDate()).padStart(2, '0')}`
    const easterMondayKey = `${String(easterMonday.getMonth() + 1).padStart(2, '0')}-${String(easterMonday.getDate()).padStart(2, '0')}`

    return key === goodFridayKey || key === easterMondayKey
  }

  private static calculateEasterDate(year: number): Date {
    // Anonymous Gregorian algorithm
    const a = year % 19
    const b = Math.floor(year / 100)
    const c = year % 100
    const d = Math.floor(b / 4)
    const e = b % 4
    const f = Math.floor((b + 8) / 25)
    const g = Math.floor((b - f + 1) / 3)
    const h = (19 * a + b - d - g + 15) % 30
    const i = Math.floor(c / 4)
    const k = c % 4
    const l = (32 + 2 * e + 2 * i - h - k) % 7
    const m = Math.floor((a + 11 * h + 22 * l) / 451)
    const month = Math.floor((h + l - 7 * m + 114) / 31) - 1
    const day = ((h + l - 7 * m + 114) % 31) + 1

    return new Date(Date.UTC(year, month, day))
  }
}
