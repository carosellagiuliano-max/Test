import { parseISO } from 'date-fns'
import {
  toZonedTime,
  fromZonedTime,
  formatInTimeZone
} from 'date-fns-tz'

const TIMEZONE = 'Europe/Zurich'

export class SwissTimezoneManager {
  static readonly TIMEZONE = TIMEZONE

  static toUTC(localTime: Date | string): Date {
    const date = typeof localTime === 'string' ? parseISO(localTime) : localTime
    return fromZonedTime(date, TIMEZONE)
  }

  static toLocal(utcTime: Date | string): Date {
    const date = typeof utcTime === 'string' ? parseISO(utcTime) : utcTime
    return toZonedTime(date, TIMEZONE)
  }

  static isDST(date: Date): boolean {
    const year = date.getFullYear()

    const lastSunday = (month: number): Date => {
      const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0))
      const dayOfWeek = lastDayOfMonth.getUTCDay()
      const offset = dayOfWeek === 0 ? 0 : dayOfWeek
      lastDayOfMonth.setUTCDate(lastDayOfMonth.getUTCDate() - offset)
      return lastDayOfMonth
    }

    const lastSundayMarch = lastSunday(2)
    const lastSundayOctober = lastSunday(9)

    return date >= lastSundayMarch && date < lastSundayOctober
  }

  static getUTCOffset(date: Date): number {
    const offsetString = formatInTimeZone(date, TIMEZONE, 'xxx')
    const sign = offsetString.startsWith('-') ? -1 : 1
    const [hours, minutes] = offsetString.substring(1).split(':').map(Number)
    return sign * (hours + minutes / 60)
  }

  static formatSwiss(date: Date): string {
    return formatInTimeZone(date, TIMEZONE, 'dd.MM.yyyy HH:mm')
  }

  static parseSwiss(dateString: string): Date {
    const [datePart, timePart] = dateString.split(' ')
    const [day, month, year] = datePart.split('.')
    const [hours, minutes] = timePart.split(':')

    const localDate = new Date(Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hours),
      Number(minutes)
    ))

    return this.toUTC(localDate)
  }

  static isSameDaySwiss(date1: Date, date2: Date): boolean {
    return (
      formatInTimeZone(date1, TIMEZONE, 'yyyy-MM-dd') ===
      formatInTimeZone(date2, TIMEZONE, 'yyyy-MM-dd')
    )
  }

  static getBusinessDayBounds(date: Date): { start: Date; end: Date } {
    const localDate = this.toLocal(date)

    const startLocal = new Date(localDate)
    startLocal.setHours(8, 0, 0, 0)

    const endLocal = new Date(localDate)
    endLocal.setHours(18, 0, 0, 0)

    return {
      start: this.toUTC(startLocal),
      end: this.toUTC(endLocal)
    }
  }
}
