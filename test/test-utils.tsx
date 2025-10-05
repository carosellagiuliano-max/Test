import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Mock data utilities
export const createMockAppointment = (overrides = {}) => ({
  id: 'test-appointment-1',
  date: new Date('2024-01-15'),
  time: '10:00',
  duration: 60,
  service_id: 'test-service-1',
  customer_id: 'test-customer-1',
  staff_id: 'test-staff-1',
  status: 'confirmed',
  price: 8500, // 85.00 CHF in cents
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
})

export const createMockService = (overrides = {}) => ({
  id: 'test-service-1',
  name: 'Haircut & Wash',
  description: 'Classic haircut with wash and styling',
  duration: 60,
  price: 8500, // 85.00 CHF in cents
  category: 'haircut',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
})

export const createMockCustomer = (overrides = {}) => ({
  id: 'test-customer-1',
  email: 'test@example.com',
  first_name: 'John',
  last_name: 'Doe',
  phone: '+41791234567',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
})

export const createMockStaff = (overrides = {}) => ({
  id: 'test-staff-1',
  first_name: 'Jane',
  last_name: 'Smith',
  email: 'jane@salon.com',
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
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
})

export const createMockTimeSlot = (overrides = {}) => ({
  start_time: '10:00',
  end_time: '11:00',
  is_available: true,
  staff_id: 'test-staff-1',
  ...overrides
})

// Test utilities for Swiss business logic
export const swissTestUtils = {
  formatPrice: (priceInCents: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF'
    }).format(priceInCents / 100)
  },

  calculateVAT: (netAmount: number, rate = 0.077) => {
    return Math.round(netAmount * rate)
  },

  isValidSwissPhone: (phone: string) => {
    const swissPhoneRegex = /^(\+41|0041|0)([1-9]\d{8})$/
    return swissPhoneRegex.test(phone.replace(/\s/g, ''))
  },

  isBusinessHours: (time: string, day: string) => {
    const businessHours = {
      monday: { start: '09:00', end: '17:00' },
      tuesday: { start: '09:00', end: '17:00' },
      wednesday: { start: '09:00', end: '17:00' },
      thursday: { start: '09:00', end: '17:00' },
      friday: { start: '09:00', end: '17:00' },
      saturday: { start: '09:00', end: '15:00' },
      sunday: null
    }

    const dayHours = businessHours[day.toLowerCase()]
    if (!dayHours) return false

    const timeValue = time.replace(':', '')
    const startValue = dayHours.start.replace(':', '')
    const endValue = dayHours.end.replace(':', '')

    return timeValue >= startValue && timeValue <= endValue
  }
}