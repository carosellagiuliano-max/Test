import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BookingRequest {
  customer_id: string
  staff_id: string
  service_id: string
  start_time: string
  notes?: string
  send_confirmation?: boolean
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: user, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const bookingData: BookingRequest = await req.json()

    // Validate required fields
    if (!bookingData.customer_id || !bookingData.staff_id || !bookingData.service_id || !bookingData.start_time) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get service details to calculate end time and price
    const { data: service, error: serviceError } = await supabaseClient
      .from('services')
      .select('duration_minutes, price_cents')
      .eq('id', bookingData.service_id)
      .eq('status', 'active')
      .single()

    if (serviceError || !service) {
      return new Response(
        JSON.stringify({ error: 'Service not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate end time
    const startTime = new Date(bookingData.start_time)
    const endTime = new Date(startTime.getTime() + service.duration_minutes * 60000)

    // Check for conflicts using the EXCLUDE constraint
    const { data: conflicts, error: conflictError } = await supabaseClient
      .from('appointments')
      .select('id')
      .eq('staff_id', bookingData.staff_id)
      .neq('status', 'cancelled')
      .neq('status', 'no_show')
      .or(`start_time.lt.${endTime.toISOString()},end_time.gt.${startTime.toISOString()}`)

    if (conflictError) {
      console.error('Conflict check error:', conflictError)
      return new Response(
        JSON.stringify({ error: 'Error checking availability' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (conflicts && conflicts.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Time slot not available' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create the appointment
    const { data: appointment, error: appointmentError } = await supabaseClient
      .from('appointments')
      .insert({
        customer_id: bookingData.customer_id,
        staff_id: bookingData.staff_id,
        service_id: bookingData.service_id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_minutes: service.duration_minutes,
        price_cents: service.price_cents,
        notes: bookingData.notes,
        status: 'pending'
      })
      .select()
      .single()

    if (appointmentError) {
      console.error('Appointment creation error:', appointmentError)
      return new Response(
        JSON.stringify({ error: 'Failed to create appointment' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // TODO: Send confirmation email/SMS if requested
    if (bookingData.send_confirmation) {
      // Implement notification logic here
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: appointment,
        message: 'Appointment booked successfully'
      }),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Booking error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})