import { createClient } from '@/lib/supabase/client'

export interface PaymentIntent {
  id: string
  amount: number
  currency: string
  status: string
  client_secret?: string
}

export interface CheckoutSession {
  id: string
  url: string
  success_url: string
  cancel_url: string
}

export const paymentService = {
  // Stripe checkout for appointments
  async createStripeCheckout(appointmentId: string, successUrl: string, cancelUrl: string) {
    const supabase = createClient()

    const { data, error } = await supabase.functions.invoke('stripe-checkout', {
      body: {
        appointment_id: appointmentId,
        success_url: successUrl,
        cancel_url: cancelUrl
      }
    })

    if (error) throw error
    return data as CheckoutSession
  },

  // SumUp payment for in-store
  async createSumUpPayment(
    amount: number,
    description: string,
    appointmentId?: string,
    orderId?: string
  ) {
    const supabase = createClient()

    const { data, error } = await supabase.functions.invoke('sumup-payment', {
      body: {
        amount,
        description,
        appointment_id: appointmentId,
        order_id: orderId
      }
    })

    if (error) throw error
    return data
  },

  // Get payment history
  async getPaymentHistory(customerId: string) {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // Get payment by ID
  async getPayment(paymentId: string) {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single()

    if (error) throw error
    return data
  },

  // Process refund
  async requestRefund(paymentId: string, reason?: string) {
    const supabase = createClient()

    const { data, error } = await supabase.functions.invoke('payment-refund', {
      body: {
        payment_id: paymentId,
        reason
      }
    })

    if (error) throw error
    return data
  },

  // Calculate pricing with discounts
  async calculatePricing(
    serviceIds: string[],
    staffId: string,
    couponCode?: string
  ) {
    const supabase = createClient()

    const { data, error } = await supabase.functions.invoke('calculate-pricing', {
      body: {
        service_ids: serviceIds,
        staff_id: staffId,
        coupon_code: couponCode
      }
    })

    if (error) throw error
    return data
  }
}