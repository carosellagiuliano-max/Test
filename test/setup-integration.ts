import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// Integration test setup for Supabase and external services
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-key'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Global test state
let testSessionId: string

beforeAll(async () => {
  console.log('Setting up integration test environment...')

  // Create unique test session ID
  testSessionId = `test_${Date.now()}_${Math.random().toString(36).substring(7)}`

  // Wait for Supabase to be ready
  await waitForSupabase()

  // Setup test database state
  await setupTestDatabase()

  console.log(`Integration test session: ${testSessionId}`)
})

afterAll(async () => {
  console.log('Cleaning up integration test environment...')

  // Clean up test data
  await cleanupTestDatabase()

  console.log('Integration test cleanup completed')
})

beforeEach(async () => {
  // Reset test data before each test
  await resetTestData()
})

afterEach(async () => {
  // Optional: cleanup after each test
  // For now, we'll rely on beforeEach reset
})

async function waitForSupabase(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const { data, error } = await supabaseAdmin
        .from('_health_check')
        .select('*')
        .limit(1)

      if (!error) {
        console.log('Supabase is ready')
        return
      }
    } catch (error) {
      // Continue waiting
    }

    console.log(`Waiting for Supabase... (${i + 1}/${maxAttempts})`)
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  throw new Error('Supabase failed to start within timeout period')
}

async function setupTestDatabase() {
  // Create test tables if they don't exist
  await supabaseAdmin.rpc('create_test_tables')

  // Insert test data
  await insertTestData()
}

async function insertTestData() {
  // Test services
  const testServices = [
    {
      id: `test_service_1_${testSessionId}`,
      name: 'Test Haircut',
      description: 'Basic haircut for testing',
      duration: 60,
      price: 8500,
      category: 'haircut',
      is_active: true
    },
    {
      id: `test_service_2_${testSessionId}`,
      name: 'Test Hair Coloring',
      description: 'Hair coloring for testing',
      duration: 120,
      price: 15000,
      category: 'coloring',
      is_active: true
    }
  ]

  await supabaseAdmin.from('services').upsert(testServices)

  // Test staff members
  const testStaff = [
    {
      id: `test_staff_1_${testSessionId}`,
      first_name: 'Test',
      last_name: 'Stylist',
      email: `test.stylist.${testSessionId}@example.com`,
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
  ]

  await supabaseAdmin.from('staff').upsert(testStaff)

  // Test customers
  const testCustomers = [
    {
      id: `test_customer_1_${testSessionId}`,
      first_name: 'Test',
      last_name: 'Customer',
      email: `test.customer.${testSessionId}@example.com`,
      phone: '+41791234567'
    }
  ]

  await supabaseAdmin.from('customers').upsert(testCustomers)

  console.log('Test data inserted successfully')
}

async function resetTestData() {
  // Delete test appointments (most dependent data first)
  await supabaseAdmin
    .from('appointments')
    .delete()
    .ilike('customer_email', `%${testSessionId}%`)

  await supabaseAdmin
    .from('payments')
    .delete()
    .ilike('customer_email', `%${testSessionId}%`)

  // Re-insert fresh test data
  await insertTestData()
}

async function cleanupTestDatabase() {
  // Delete all test data
  await supabaseAdmin
    .from('appointments')
    .delete()
    .ilike('id', `%${testSessionId}%`)

  await supabaseAdmin
    .from('payments')
    .delete()
    .ilike('customer_email', `%${testSessionId}%`)

  await supabaseAdmin
    .from('customers')
    .delete()
    .ilike('email', `%${testSessionId}%`)

  await supabaseAdmin
    .from('staff')
    .delete()
    .ilike('email', `%${testSessionId}%`)

  await supabaseAdmin
    .from('services')
    .delete()
    .ilike('id', `%${testSessionId}%`)

  console.log('Test database cleaned up')
}

// Export test utilities for use in integration tests
export const integrationTestUtils = {
  getTestSessionId: () => testSessionId,
  getSupabaseAdmin: () => supabaseAdmin,

  // Test data factories
  createTestAppointment: (overrides = {}) => ({
    id: `test_appointment_${Date.now()}_${testSessionId}`,
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '10:00',
    duration: 60,
    service_id: `test_service_1_${testSessionId}`,
    customer_id: `test_customer_1_${testSessionId}`,
    staff_id: `test_staff_1_${testSessionId}`,
    status: 'confirmed',
    price: 8500,
    ...overrides
  }),

  createTestPayment: (overrides = {}) => ({
    id: `test_payment_${Date.now()}_${testSessionId}`,
    appointment_id: `test_appointment_${Date.now()}_${testSessionId}`,
    amount: 8500,
    currency: 'CHF',
    payment_method: 'stripe',
    status: 'succeeded',
    provider_payment_id: `pi_test_${Date.now()}`,
    ...overrides
  }),

  // Swiss-specific test utilities
  swissTestUtils: {
    generateSwissPhone: () => `+4179${Math.floor(Math.random() * 9000000 + 1000000)}`,
    generateTestEmail: () => `test.${Date.now()}.${testSessionId}@example.com`,
    calculateSwissVAT: (amount) => Math.round(amount * 0.077),
    formatSwissPrice: (priceInCents) => new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF'
    }).format(priceInCents / 100)
  },

  // API testing utilities
  apiTestUtils: {
    makeAuthenticatedRequest: async (endpoint, options = {}) => {
      const response = await fetch(`${supabaseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          ...options.headers
        }
      })

      return {
        ok: response.ok,
        status: response.status,
        data: response.ok ? await response.json() : null,
        error: response.ok ? null : await response.text()
      }
    },

    invokeEdgeFunction: async (functionName, payload) => {
      return await supabaseAdmin.functions.invoke(functionName, {
        body: payload
      })
    }
  }
}