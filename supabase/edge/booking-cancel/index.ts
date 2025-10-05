import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CancelBookingRequest {
  appointment_id: string
  reason?: string
  refund_type?: 'full' | 'partial' | 'none'
  notify_customer?: boolean
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: { autoRefreshToken: false, persistSession: false },
      }
    )

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: user, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', code: 'UNAUTHORIZED' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const cancelData: CancelBookingRequest = await req.json()

    if (!cancelData.appointment_id) {
      return new Response(
        JSON.stringify({
          error: 'appointment_id is required',
          code: 'VALIDATION_ERROR'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get appointment details with related data
    const { data: appointment, error: appointmentError } = await supabaseClient
      .from('appointments')
      .select(`
        *,
        customer:users!customer_id(id, first_name, last_name, email, phone),
        staff:users!staff_id(id, first_name, last_name),
        service:services(id, name, duration_minutes, price_cents),
        payment:payments(*)
      `)
      .eq('id', cancelData.appointment_id)
      .single()

    if (appointmentError || !appointment) {
      return new Response(
        JSON.stringify({
          error: 'Appointment not found',
          code: 'APPOINTMENT_NOT_FOUND'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if appointment is already cancelled
    if (appointment.status === 'cancelled') {
      return new Response(
        JSON.stringify({
          error: 'Appointment is already cancelled',
          code: 'ALREADY_CANCELLED'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if appointment is in the past
    const appointmentTime = new Date(appointment.start_time)
    const now = new Date()

    if (appointmentTime <= now) {
      return new Response(
        JSON.stringify({
          error: 'Cannot cancel past appointments',
          code: 'APPOINTMENT_PAST'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check cancellation policy (get from settings)
    const { data: cancellationPolicy } = await supabaseClient
      .from('booking_settings')
      .select('setting_value')
      .eq('setting_key', 'cancellation_policy_hours')
      .single()

    const policyHours = cancellationPolicy?.setting_value || 24
    const hoursUntilAppointment = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (hoursUntilAppointment < policyHours) {
      return new Response(
        JSON.stringify({
          error: `Cancellation must be at least ${policyHours} hours before appointment`,
          code: 'CANCELLATION_TOO_LATE',
          hours_required: policyHours,
          hours_remaining: Math.round(hoursUntilAppointment * 10) / 10
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check user permissions - customers can only cancel their own appointments
    const userRole = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', user.user.id)
      .single()

    if (userRole.data?.role === 'customer' && appointment.customer_id !== user.user.id) {
      return new Response(
        JSON.stringify({
          error: 'You can only cancel your own appointments',
          code: 'PERMISSION_DENIED'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate refund amount
    let refundAmount = 0
    const refundType = cancelData.refund_type || 'full'

    if (refundType === 'full' && appointment.deposit_cents) {
      refundAmount = appointment.deposit_cents
    } else if (refundType === 'partial' && appointment.deposit_cents) {
      // 50% refund for partial
      refundAmount = Math.floor(appointment.deposit_cents * 0.5)
    }

    // Begin transaction to update appointment and handle refund
    const { error: updateError } = await supabaseClient
      .from('appointments')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: cancelData.reason || 'Customer requested cancellation'
      })
      .eq('id', cancelData.appointment_id)

    if (updateError) {
      console.error('Failed to update appointment:', updateError)
      return new Response(
        JSON.stringify({
          error: 'Failed to cancel appointment',
          code: 'UPDATE_ERROR'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle payment refund if needed
    let refundProcessed = false
    if (refundAmount > 0 && appointment.payment && appointment.payment.length > 0) {
      const payment = appointment.payment[0]

      if (payment.provider === 'stripe' && payment.provider_payment_id) {
        try {
          // Call Stripe refund endpoint
          const stripeResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/stripe-refund`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              payment_intent_id: payment.provider_payment_id,
              amount: refundAmount,
              reason: 'requested_by_customer'
            })
          })

          if (stripeResponse.ok) {
            refundProcessed = true

            // Update payment record
            await supabaseClient
              .from('payments')
              .update({
                status: refundAmount === payment.amount_cents ? 'refunded' : 'partially_refunded',
                refund_amount_cents: refundAmount,
                refund_reason: cancelData.reason || 'Appointment cancelled',
                refunded_at: new Date().toISOString()
              })
              .eq('id', payment.id)
          }
        } catch (error) {
          console.error('Stripe refund error:', error)
        }
      }
    }

    // Create notification for customer if requested
    if (cancelData.notify_customer !== false) {
      const appointmentDate = new Date(appointment.start_time).toLocaleDateString('de-CH', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })

      await supabaseClient
        .from('notifications')
        .insert({
          user_id: appointment.customer_id,
          title: 'Appointment Cancelled',
          message: `Your appointment for ${appointment.service.name} on ${appointmentDate} has been cancelled.${refundProcessed ? ` A refund of ${refundAmount / 100} CHF will be processed.` : ''}`,
          type: 'appointment_cancelled',
          priority: 'high',
          metadata: {
            appointment_id: appointment.id,
            refund_amount: refundAmount,
            refund_processed: refundProcessed
          }
        })
    }

    // Create notification for staff
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: appointment.staff_id,
        title: 'Appointment Cancelled',
        message: `Appointment with ${appointment.customer.first_name} ${appointment.customer.last_name} for ${appointment.service.name} has been cancelled.`,
        type: 'appointment_cancelled',
        priority: 'normal',
        metadata: {
          appointment_id: appointment.id,
          customer_id: appointment.customer_id
        }
      })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Appointment cancelled successfully',
        data: {
          appointment_id: appointment.id,
          cancelled_at: new Date().toISOString(),
          refund_amount: refundAmount,
          refund_processed: refundProcessed,
          cancellation_reason: cancelData.reason || 'Customer requested cancellation'
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Cancellation error:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})