export interface BookingData {
  service_id: string
  staff_id: string
  customer_id: string
  appointment_date: string
  start_time: string
  end_time: string
  customer_name: string
  customer_email: string
  customer_phone: string
  notes?: string
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  sanitizedData?: BookingData
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^(\+41|0)[1-9]\d{8,9}$/
const TIME_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/

export function validateBookingData(data: Partial<BookingData>): ValidationResult {
  const errors: string[] = []
  const sanitized = {} as BookingData

  // Required field validation
  const requiredFields: (keyof BookingData)[] = [
    'service_id', 'staff_id', 'customer_id',
    'appointment_date', 'start_time', 'end_time',
    'customer_email'
  ]

  for (const field of requiredFields) {
    if (!data[field]) {
      errors.push(`${field.replace(/_/g, ' ')} is required`)
    }
  }

  // UUID validation
  if (data.service_id && !UUID_REGEX.test(data.service_id)) {
    errors.push('Invalid service ID format')
  }
  if (data.staff_id && !UUID_REGEX.test(data.staff_id)) {
    errors.push('Invalid staff ID format')
  }
  if (data.customer_id && !UUID_REGEX.test(data.customer_id)) {
    errors.push('Invalid customer ID format')
  }

  // Email validation
  if (data.customer_email) {
    const email = data.customer_email.trim()
    if (!EMAIL_REGEX.test(email)) {
      errors.push('Invalid email format')
    }
    sanitized.customer_email = email
  }

  // Phone validation
  if (data.customer_phone) {
    const phone = data.customer_phone.replace(/\s/g, '')
    if (!PHONE_REGEX.test(phone)) {
      errors.push('Invalid phone format')
    }
    sanitized.customer_phone = phone
  }

  // Date validation
  if (data.appointment_date) {
    const appointmentDate = new Date(data.appointment_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (appointmentDate < today) {
      errors.push('Cannot book appointments in the past')
    }

    const sixMonthsFromNow = new Date()
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6)

    if (appointmentDate > sixMonthsFromNow) {
      errors.push('Cannot book appointments more than 6 months in advance')
    }

    sanitized.appointment_date = data.appointment_date
  }

  // Time validation
  if (data.start_time && !TIME_REGEX.test(data.start_time)) {
    errors.push('Invalid time format')
  }
  if (data.end_time && !TIME_REGEX.test(data.end_time)) {
    errors.push('Invalid time format')
  }

  // Time logic validation
  if (data.start_time && data.end_time && TIME_REGEX.test(data.start_time) && TIME_REGEX.test(data.end_time)) {
    const [startHour, startMin] = data.start_time.split(':').map(Number)
    const [endHour, endMin] = data.end_time.split(':').map(Number)

    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin

    if (endMinutes <= startMinutes) {
      errors.push('End time must be after start time')
    }

    const duration = endMinutes - startMinutes
    if (duration < 15) {
      errors.push('Appointment must be at least 15 minutes long')
    }
    if (duration > 240) {
      errors.push('Appointment cannot be longer than 4 hours')
    }

    // Business hours validation (8:00 - 20:00)
    if (startHour < 8 || endHour > 20 || (endHour === 20 && endMin > 0)) {
      errors.push('Appointments must be between 08:00 and 20:00')
    }

    sanitized.start_time = data.start_time
    sanitized.end_time = data.end_time
  }

  // Sanitize other fields
  if (data.customer_name) {
    sanitized.customer_name = data.customer_name.trim()
  }

  if (data.notes) {
    // Remove potential XSS
    sanitized.notes = data.notes
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .trim()
  }

  // Copy UUID fields directly if valid
  if (data.service_id && !errors.some(e => e.includes('service ID'))) {
    sanitized.service_id = data.service_id
  }
  if (data.staff_id && !errors.some(e => e.includes('staff ID'))) {
    sanitized.staff_id = data.staff_id
  }
  if (data.customer_id && !errors.some(e => e.includes('customer ID'))) {
    sanitized.customer_id = data.customer_id
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: errors.length === 0 ? sanitized : undefined
  }
}