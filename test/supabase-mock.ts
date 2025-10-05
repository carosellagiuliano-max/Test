import { vi } from 'vitest'

// Mock Supabase client
export const createSupabaseMock = () => {
  const mockData: any[] = []

  const mockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockImplementation((data) => ({
      ...mockQueryBuilder,
      data: Array.isArray(data) ? data : [data],
      error: null
    })),
    update: vi.fn().mockImplementation((data) => ({
      ...mockQueryBuilder,
      data: [data],
      error: null
    })),
    upsert: vi.fn().mockImplementation((data) => ({
      ...mockQueryBuilder,
      data: Array.isArray(data) ? data : [data],
      error: null
    })),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    containedBy: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() => ({
      data: mockData[0] || null,
      error: null
    })),
    then: vi.fn().mockImplementation((callback) => {
      return callback({
        data: mockData,
        error: null
      })
    })
  }

  const mockAuth = {
    getUser: vi.fn().mockResolvedValue({
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          role: 'authenticated'
        }
      },
      error: null
    }),
    signInWithPassword: vi.fn().mockResolvedValue({
      data: {
        user: { id: 'test-user-id', email: 'test@example.com' },
        session: { access_token: 'test-token' }
      },
      error: null
    }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    })
  }

  const mockRealtime = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnValue({
      unsubscribe: vi.fn()
    })
  }

  const mockStorage = {
    from: vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
      download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
      remove: vi.fn().mockResolvedValue({ data: null, error: null }),
      list: vi.fn().mockResolvedValue({ data: [], error: null }),
      getPublicUrl: vi.fn().mockReturnValue({
        data: { publicUrl: 'https://test.supabase.co/storage/v1/object/public/test' }
      })
    })
  }

  const mockFunctions = {
    invoke: vi.fn().mockResolvedValue({
      data: { success: true },
      error: null
    })
  }

  return {
    from: vi.fn().mockReturnValue(mockQueryBuilder),
    auth: mockAuth,
    realtime: mockRealtime,
    storage: mockStorage,
    functions: mockFunctions,
    channel: vi.fn().mockReturnValue(mockRealtime),
    removeChannel: vi.fn(),
    getChannels: vi.fn().mockReturnValue([]),
    // Helper to set mock data for queries
    __setMockData: (data: any[]) => {
      mockData.length = 0
      mockData.push(...data)
    }
  }
}

// Create admin client mock with full permissions
export const createSupabaseAdminMock = () => {
  const baseMock = createSupabaseMock()

  // Admin has no RLS restrictions
  return {
    ...baseMock,
    auth: {
      ...baseMock.auth,
      admin: {
        createUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'new-user-id' } },
          error: null
        }),
        deleteUser: vi.fn().mockResolvedValue({ data: null, error: null }),
        updateUserById: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-id' } },
          error: null
        })
      }
    }
  }
}

// Mock for testing different user roles
export const createRoleBasedSupabaseMock = (role: 'anon' | 'customer' | 'staff' | 'admin') => {
  const baseMock = createSupabaseMock()

  // Apply role-based restrictions
  switch(role) {
    case 'anon':
      // Anonymous can only read public data
      baseMock.from = vi.fn().mockImplementation((table) => {
        if (['services', 'staff_availability'].includes(table)) {
          return baseMock.from(table)
        }
        return {
          ...baseMock.from(table),
          select: vi.fn().mockReturnValue({
            data: null,
            error: { message: 'Permission denied' }
          })
        }
      })
      break

    case 'customer':
      // Customer can CRUD their own data
      baseMock.auth.getUser = vi.fn().mockResolvedValue({
        data: {
          user: { id: 'customer-id', email: 'customer@example.com', role: 'authenticated' }
        },
        error: null
      })
      break

    case 'staff':
      // Staff can manage assigned appointments
      baseMock.auth.getUser = vi.fn().mockResolvedValue({
        data: {
          user: { id: 'staff-id', email: 'staff@example.com', role: 'staff' }
        },
        error: null
      })
      break

    case 'admin':
      // Admin has full access
      baseMock.auth.getUser = vi.fn().mockResolvedValue({
        data: {
          user: { id: 'admin-id', email: 'admin@example.com', role: 'admin' }
        },
        error: null
      })
      break
  }

  return baseMock
}

export default createSupabaseMock