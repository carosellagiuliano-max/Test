import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key'

const supabase = createClient(supabaseUrl, supabaseAnonKey)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

describe('Edge Functions Integration Tests', () => {
  beforeAll(async () => {
    // Setup test data
    await setupTestData()
  })

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData()
  })

  describe('book-appointment function', () => {
    it('should create a new appointment successfully', async () => {
      const appointmentData = {
        date: '2024-02-15',
        time: '10:00',
        service_id: 'test-service-1',
        customer: {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@test.com',
          phone: '+41791234567'
        },
        staff_id: 'test-staff-1'
      }

      const { data, error } = await supabase.functions.invoke('book-appointment', {
        body: appointmentData
      })

      expect(error).toBeNull()
      expect(data).toHaveProperty('appointment_id')
      expect(data).toHaveProperty('confirmation_code')
      expect(data.status).toBe('confirmed')
    })

    it('should reject appointment for invalid time slot', async () => {
      const appointmentData = {
        date: '2024-02-15',
        time: '18:00', // After business hours
        service_id: 'test-service-1',
        customer: {
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane.smith@test.com',
          phone: '+41791234567'
        },
        staff_id: 'test-staff-1'
      }

      const { data, error } = await supabase.functions.invoke('book-appointment', {
        body: appointmentData
      })

      expect(error).not.toBeNull()
      expect(error.message).toContain('outside business hours')
    })

    it('should reject appointment for conflicting time slot', async () => {
      // First, book an appointment
      const firstAppointment = {
        date: '2024-02-16',
        time: '14:00',
        service_id: 'test-service-1',
        customer: {
          first_name: 'Alice',
          last_name: 'Johnson',
          email: 'alice.johnson@test.com',
          phone: '+41791234567'
        },
        staff_id: 'test-staff-1'
      }

      await supabase.functions.invoke('book-appointment', {
        body: firstAppointment
      })

      // Try to book a conflicting appointment
      const conflictingAppointment = {
        date: '2024-02-16',
        time: '14:30', // Conflicts with previous appointment
        service_id: 'test-service-1',
        customer: {
          first_name: 'Bob',
          last_name: 'Wilson',
          email: 'bob.wilson@test.com',
          phone: '+41791234567'
        },
        staff_id: 'test-staff-1'
      }

      const { data, error } = await supabase.functions.invoke('book-appointment', {
        body: conflictingAppointment
      })

      expect(error).not.toBeNull()
      expect(error.message).toContain('time slot not available')
    })

    it('should validate required fields', async () => {
      const incompleteData = {
        date: '2024-02-15',
        // Missing time, service_id, customer, staff_id
      }

      const { data, error } = await supabase.functions.invoke('book-appointment', {
        body: incompleteData
      })

      expect(error).not.toBeNull()
      expect(error.message).toContain('required')
    })

    it('should validate Swiss phone number format', async () => {
      const appointmentData = {
        date: '2024-02-17',
        time: '11:00',
        service_id: 'test-service-1',
        customer: {
          first_name: 'Invalid',
          last_name: 'Phone',
          email: 'invalid.phone@test.com',
          phone: '1234567890' // Invalid Swiss phone
        },
        staff_id: 'test-staff-1'
      }

      const { data, error } = await supabase.functions.invoke('book-appointment', {
        body: appointmentData
      })

      expect(error).not.toBeNull()
      expect(error.message).toContain('invalid phone number')
    })
  })

  describe('booking-availability function', () => {
    it('should return available time slots', async () => {
      const { data, error } = await supabase.functions.invoke('booking-availability', {
        body: {
          date: '2024-02-20',
          service_id: 'test-service-1',
          staff_id: 'test-staff-1'
        }
      })

      expect(error).toBeNull()
      expect(data).toHaveProperty('available_slots')
      expect(Array.isArray(data.available_slots)).toBe(true)
      expect(data.available_slots.length).toBeGreaterThan(0)
    })

    it('should filter out booked time slots', async () => {
      // Book an appointment first
      const appointmentData = {
        date: '2024-02-21',
        time: '15:00',
        service_id: 'test-service-1',
        customer: {
          first_name: 'Test',
          last_name: 'User',
          email: 'test.user@test.com',
          phone: '+41791234567'
        },
        staff_id: 'test-staff-1'
      }

      await supabase.functions.invoke('book-appointment', {
        body: appointmentData
      })

      // Check availability
      const { data, error } = await supabase.functions.invoke('booking-availability', {
        body: {
          date: '2024-02-21',
          service_id: 'test-service-1',
          staff_id: 'test-staff-1'
        }
      })

      expect(error).toBeNull()
      expect(data.available_slots).not.toContain('15:00')
    })

    it('should return empty array for closed days', async () => {
      const { data, error } = await supabase.functions.invoke('booking-availability', {
        body: {
          date: '2024-02-18', // Assuming this is a Sunday
          service_id: 'test-service-1',
          staff_id: 'test-staff-1'
        }
      })

      expect(error).toBeNull()
      expect(data.available_slots).toHaveLength(0)
    })
  })

  describe('booking-cancel function', () => {
    it('should cancel appointment successfully', async () => {
      // Create appointment first
      const appointmentData = {
        date: '2024-02-22',
        time: '16:00',
        service_id: 'test-service-1',
        customer: {
          first_name: 'Cancel',
          last_name: 'Test',
          email: 'cancel.test@test.com',
          phone: '+41791234567'
        },
        staff_id: 'test-staff-1'
      }

      const { data: bookingData } = await supabase.functions.invoke('book-appointment', {
        body: appointmentData
      })

      // Cancel the appointment
      const { data, error } = await supabase.functions.invoke('booking-cancel', {
        body: {
          appointment_id: bookingData.appointment_id,
          confirmation_code: bookingData.confirmation_code
        }
      })

      expect(error).toBeNull()
      expect(data.status).toBe('cancelled')
    })

    it('should reject cancellation with invalid confirmation code', async () => {
      const { data, error } = await supabase.functions.invoke('booking-cancel', {
        body: {
          appointment_id: 'test-appointment-id',
          confirmation_code: 'invalid-code'
        }
      })

      expect(error).not.toBeNull()
      expect(error.message).toContain('invalid confirmation code')
    })

    it('should respect cancellation deadline', async () => {
      // Create appointment less than 24 hours in advance
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const appointmentData = {
        date: tomorrow.toISOString().split('T')[0],
        time: '10:00',
        service_id: 'test-service-1',
        customer: {
          first_name: 'Late',
          last_name: 'Cancel',
          email: 'late.cancel@test.com',
          phone: '+41791234567'
        },
        staff_id: 'test-staff-1'
      }

      const { data: bookingData } = await supabase.functions.invoke('book-appointment', {
        body: appointmentData
      })

      // Try to cancel (should fail due to 24-hour policy)
      const { data, error } = await supabase.functions.invoke('booking-cancel', {
        body: {
          appointment_id: bookingData.appointment_id,
          confirmation_code: bookingData.confirmation_code
        }
      })

      expect(error).not.toBeNull()
      expect(error.message).toContain('24 hours in advance')
    })
  })

  describe('booking-validation function', () => {
    it('should validate appointment data correctly', async () => {
      const validData = {
        date: '2024-02-25',
        time: '14:00',
        service_id: 'test-service-1',
        staff_id: 'test-staff-1',
        customer: {
          first_name: 'Valid',
          last_name: 'Customer',
          email: 'valid.customer@test.com',
          phone: '+41791234567'
        }
      }

      const { data, error } = await supabase.functions.invoke('booking-validation', {
        body: validData
      })

      expect(error).toBeNull()
      expect(data.is_valid).toBe(true)
      expect(data.errors).toHaveLength(0)
    })

    it('should return validation errors for invalid data', async () => {
      const invalidData = {
        date: '2023-01-01', // Past date
        time: '25:00', // Invalid time
        service_id: 'non-existent-service',
        staff_id: 'non-existent-staff',
        customer: {
          first_name: '',
          last_name: '',
          email: 'invalid-email',
          phone: '123' // Invalid phone
        }
      }

      const { data, error } = await supabase.functions.invoke('booking-validation', {
        body: invalidData
      })

      expect(error).toBeNull()
      expect(data.is_valid).toBe(false)
      expect(data.errors.length).toBeGreaterThan(0)
      expect(data.errors).toContain('Invalid date')
      expect(data.errors).toContain('Invalid time')
      expect(data.errors).toContain('Invalid email')
      expect(data.errors).toContain('Invalid phone number')
    })
  })
})

async function setupTestData() {
  // Create test service
  await supabaseAdmin.from('services').upsert([
    {
      id: 'test-service-1',
      name: 'Test Haircut',
      description: 'Test service for integration tests',
      duration: 60,
      price: 8500,
      category: 'haircut',
      is_active: true
    }
  ])

  // Create test staff member
  await supabaseAdmin.from('staff').upsert([
    {
      id: 'test-staff-1',
      first_name: 'Test',
      last_name: 'Stylist',
      email: 'test.stylist@salon.com',
      role: 'stylist',
      is_active: true,
      working_hours: {
        monday: { start: '09:00', end: '17:00' },
        tuesday: { start: '09:00', end: '17:00' },
        wednesday: { start: '09:00', end: '17:00' },
        thursday: { start: '09:00', end: '17:00' },
        friday: { start: '09:00', end: '17:00' },
        saturday: { start: '09:00', end: '15:00' },
        sunday: null
      }
    }
  ])
}

async function cleanupTestData() {
  // Clean up test appointments
  await supabaseAdmin.from('appointments').delete().ilike('customer_email', '%@test.com')

  // Clean up test customers
  await supabaseAdmin.from('customers').delete().ilike('email', '%@test.com')

  // Clean up test services and staff
  await supabaseAdmin.from('services').delete().eq('id', 'test-service-1')
  await supabaseAdmin.from('staff').delete().eq('id', 'test-staff-1')
}