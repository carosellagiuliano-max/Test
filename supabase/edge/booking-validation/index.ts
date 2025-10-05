import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ValidationRequest {
  customer_id: string
  staff_id: string
  service_id: string
  start_time: string
  idempotency_key?: string
}

interface ValidationResult {
  valid: boolean
  errors: string[]
  suggested_times?: Array<{
    time: string
    available: boolean
    staff_id: string
    reason?: string
  }>
  alternative_staff?: Array<{
    staff_id: string
    staff_name: string
    available_slots: Array<{
      time: string
      available: boolean
    }>
  }>
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

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const validationData: ValidationRequest = await req.json()

    // Validate required fields
    if (!validationData.customer_id || !validationData.staff_id ||
        !validationData.service_id || !validationData.start_time) {
      return new Response(
        JSON.stringify({
          valid: false,
          errors: ['Missing required fields: customer_id, staff_id, service_id, start_time'],
          code: 'VALIDATION_ERROR'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Call the PostgreSQL validation function
    const { data: validationResult, error } = await supabaseClient.rpc('validate_booking_request', {
      p_customer_id: validationData.customer_id,
      p_staff_id: validationData.staff_id,
      p_service_id: validationData.service_id,
      p_start_time: validationData.start_time,
      p_idempotency_key: validationData.idempotency_key || null
    })

    if (error) {
      console.error('Validation error:', error)
      return new Response(
        JSON.stringify({
          valid: false,
          errors: ['Validation function failed'],
          code: 'VALIDATION_FUNCTION_ERROR',
          details: error.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const result: ValidationResult = validationResult

    // If validation failed, try to provide helpful suggestions
    if (!result.valid) {
      const startTime = new Date(validationData.start_time)
      const date = startTime.toISOString().split('T')[0]

      // Get alternative time slots for the same day
      const { data: alternativeSlots } = await supabaseClient.rpc('calculate_available_slots', {
        p_service_id: validationData.service_id,
        p_staff_id: validationData.staff_id,
        p_date: date,
        p_days_ahead: 1
      })

      if (alternativeSlots && alternativeSlots.length > 0) {
        result.suggested_times = alternativeSlots
          .filter((slot: any) => slot.available)
          .slice(0, 5) // Limit to 5 suggestions
          .map((slot: any) => ({
            time: slot.start_time,
            available: slot.available,
            staff_id: slot.staff_id,
            reason: slot.reason
          }))
      }

      // Get alternative staff members who can provide this service
      const { data: serviceStaff } = await supabaseClient
        .from('service_staff')
        .select(`
          staff_id,
          users!staff_id(id, first_name, last_name)
        `)
        .eq('service_id', validationData.service_id)
        .neq('staff_id', validationData.staff_id)

      if (serviceStaff && serviceStaff.length > 0) {
        const alternativeStaffPromises = serviceStaff.map(async (staff: any) => {
          const { data: staffSlots } = await supabaseClient.rpc('calculate_available_slots', {
            p_service_id: validationData.service_id,
            p_staff_id: staff.staff_id,
            p_date: date,
            p_days_ahead: 1
          })

          return {
            staff_id: staff.staff_id,
            staff_name: `${staff.users.first_name} ${staff.users.last_name}`,
            available_slots: (staffSlots || [])
              .filter((slot: any) => slot.available)
              .slice(0, 3)
              .map((slot: any) => ({
                time: slot.start_time,
                available: slot.available
              }))
          }
        })

        const alternativeStaff = await Promise.all(alternativeStaffPromises)
        result.alternative_staff = alternativeStaff.filter(staff =>
          staff.available_slots.length > 0
        )
      }
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Validation error:', error)
    return new Response(
      JSON.stringify({
        valid: false,
        errors: ['Internal server error during validation'],
        code: 'INTERNAL_ERROR'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})