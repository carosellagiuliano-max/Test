import { createClient } from '@/lib/supabase/client'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// Service Types
export interface Service {
  id: string
  category_id: string
  name: string
  description: string | null
  duration_minutes: number
  price: number
  requires_consultation: boolean
  max_per_day: number | null
  active: boolean
  category?: ServiceCategory
}

export interface ServiceCategory {
  id: string
  name: string
  description: string | null
  display_order: number
  active: boolean
}

export interface Staff {
  id: string
  email: string
  full_name: string
  phone: string | null
  avatar_url: string | null
  bio: string | null
  specialties: string[]
  working_hours: any
  active: boolean
}

export interface Appointment {
  id: string
  customer_id: string
  staff_id: string
  service_id: string
  starts_at: string
  ends_at: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
  notes: string | null
  total_amount: number
  deposit_amount: number | null
  cancellation_reason: string | null
  cancelled_at: string | null
  created_at: string
}

export interface Product {
  id: string
  category_id: string
  name: string
  description: string | null
  sku: string | null
  price: number
  sale_price: number | null
  stock_quantity: number
  low_stock_threshold: number
  image_url: string | null
  active: boolean
}

// Client-side service functions
export const clientDatabase = {
  async getServices() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        category:service_categories(*)
      `)
      .eq('active', true)
      .order('category_id')

    if (error) throw error
    return data as Service[]
  },

  async getServiceCategories() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('service_categories')
      .select('*')
      .eq('active', true)
      .order('display_order')

    if (error) throw error
    return data as ServiceCategory[]
  },

  async getStaff() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('active', true)

    if (error) throw error
    return data as Staff[]
  },

  async getStaffMember(id: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Staff
  },

  async getAvailableSlots(staffId: string, serviceId: string, date: string) {
    const supabase = createClient()

    // Call the booking-availability edge function
    const { data, error } = await supabase.functions.invoke('booking-availability', {
      body: {
        staff_id: staffId,
        service_id: serviceId,
        date: date
      }
    })

    if (error) throw error
    return data.slots || []
  },

  async createBooking(bookingData: {
    staff_id: string
    service_id: string
    starts_at: string
    customer_data: {
      email: string
      full_name: string
      phone: string
    }
    notes?: string
  }) {
    const supabase = createClient()

    // Call the book-appointment edge function
    const { data, error } = await supabase.functions.invoke('book-appointment', {
      body: bookingData
    })

    if (error) throw error
    return data
  },

  async getProducts() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .gt('stock_quantity', 0)
      .order('name')

    if (error) throw error
    return data as Product[]
  },

  async getProductsByCategory(categoryId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category_id', categoryId)
      .eq('active', true)
      .gt('stock_quantity', 0)
      .order('name')

    if (error) throw error
    return data as Product[]
  },

  async getCustomerAppointments(customerId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        service:services(*),
        staff:staff(*)
      `)
      .eq('customer_id', customerId)
      .order('starts_at', { ascending: false })

    if (error) throw error
    return data
  },

  async cancelAppointment(appointmentId: string, reason?: string) {
    const supabase = createClient()

    // Call the booking-cancel edge function
    const { data, error } = await supabase.functions.invoke('booking-cancel', {
      body: {
        appointment_id: appointmentId,
        reason: reason
      }
    })

    if (error) throw error
    return data
  }
}

// Server-side service functions
export const serverDatabase = {
  async getServices() {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        category:service_categories(*)
      `)
      .eq('active', true)
      .order('category_id')

    if (error) throw error
    return data as Service[]
  },

  async getServiceCategories() {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('service_categories')
      .select('*')
      .eq('active', true)
      .order('display_order')

    if (error) throw error
    return data as ServiceCategory[]
  },

  async getStaff() {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('active', true)

    if (error) throw error
    return data as Staff[]
  },

  async getProducts() {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .gt('stock_quantity', 0)
      .order('name')

    if (error) throw error
    return data as Product[]
  }
}