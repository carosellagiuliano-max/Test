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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^(\+41|0041|0)[1-9]\d{8}$/
const TIME_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/

export function validateBookingData(data: Partial<BookingData>): ValidationResult {
  const errors: string[] = []
  const sanitized = {} as BookingData

  const getTrimmedValue = (value: unknown): string =>
    typeof value === 'string' ? value.trim() : ''

  // Required field validation
  const requiredFields: (keyof BookingData)[] = [
    'service_id',
    'staff_id',
    'customer_id',
    'appointment_date',
    'start_time',
    'end_time',
    'customer_email',
    'customer_name',
    'customer_phone'
  ]

  for (const field of requiredFields) {
    if (!getTrimmedValue(data[field])) {
      errors.push(`${field.replace(/_/g, ' ')} is required`)
    }
  }

  // UUID validation
  const serviceId = getTrimmedValue(data.service_id)
  if (serviceId) {
    if (!UUID_REGEX.test(serviceId)) {
      errors.push('Invalid service ID format')
    } else {
      sanitized.service_id = serviceId
    }
  }

  const staffId = getTrimmedValue(data.staff_id)
  if (staffId) {
    if (!UUID_REGEX.test(staffId)) {
      errors.push('Invalid staff ID format')
    } else {
      sanitized.staff_id = staffId
    }
  }

  const customerId = getTrimmedValue(data.customer_id)
  if (customerId) {
    if (!UUID_REGEX.test(customerId)) {
      errors.push('Invalid customer ID format')
    } else {
      sanitized.customer_id = customerId
    }
  }

  // Email validation
  const email = getTrimmedValue(data.customer_email)
  if (email) {
    if (!EMAIL_REGEX.test(email)) {
      errors.push('Invalid email format')
    }
    sanitized.customer_email = email
  }

  // Phone validation
  const rawPhone = getTrimmedValue(data.customer_phone)
  if (rawPhone) {
    let phone = rawPhone.replace(/[\s\-.()]/g, '')

    if (phone.startsWith('+410')) {
      phone = '+41' + phone.slice(4)
    }

    if (phone.startsWith('00410')) {
      phone = '0041' + phone.slice(5)
    }

    if (!PHONE_REGEX.test(phone)) {
      errors.push('Invalid phone format')
    }
    sanitized.customer_phone = phone
  }

  // Date validation
  const appointmentDateValue = getTrimmedValue(data.appointment_date)
  if (appointmentDateValue) {
    const appointmentDate = new Date(appointmentDateValue)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (appointmentDate < today) {
      errors.push('Cannot book appointments in the past')
    }

    const sixMonthsFromNow = new Date()
    sixMonthsFromNow.setHours(0, 0, 0, 0)
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6)

    if (appointmentDate > sixMonthsFromNow) {
      errors.push('Cannot book appointments more than 6 months in advance')
    }

    sanitized.appointment_date = appointmentDateValue
  }

  // Time validation
  const startTimeValue = getTrimmedValue(data.start_time)
  if (startTimeValue && !TIME_REGEX.test(startTimeValue)) {
    errors.push('Invalid time format')
  }
  const endTimeValue = getTrimmedValue(data.end_time)
  if (endTimeValue && !TIME_REGEX.test(endTimeValue)) {
    errors.push('Invalid time format')
  }

  // Time logic validation
  if (
    startTimeValue &&
    endTimeValue &&
    TIME_REGEX.test(startTimeValue) &&
    TIME_REGEX.test(endTimeValue)
  ) {
    const [startHour, startMin] = startTimeValue.split(':').map(Number)
    const [endHour, endMin] = endTimeValue.split(':').map(Number)

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

    sanitized.start_time = startTimeValue
    sanitized.end_time = endTimeValue
  }

  // Sanitize other fields
  const customerName = getTrimmedValue(data.customer_name)
  if (customerName) {
    sanitized.customer_name = customerName
  }

  if (data.notes) {
    // Remove potential XSS
    sanitized.notes = data.notes
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .trim()
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: errors.length === 0 ? sanitized : undefined
  }
}