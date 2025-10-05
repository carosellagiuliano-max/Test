import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AvailabilityRequest {
  service_id: string
  staff_id?: string
  date: string // YYYY-MM-DD
  days_ahead?: number
}

interface AvailabilitySlot {
  staff_id: string
  staff_name: string
  start_time: string
  end_time: string
  available: boolean
  reason?: string
  service_duration_minutes: number
  buffer_minutes: number
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

    if (req.method === 'GET') {
      // Parse query parameters
      const url = new URL(req.url)
      const serviceId = url.searchParams.get('service_id')
      const staffId = url.searchParams.get('staff_id')
      const date = url.searchParams.get('date')
      const daysAhead = parseInt(url.searchParams.get('days_ahead') || '1')

      if (!serviceId || !date) {
        return new Response(
          JSON.stringify({
            error: 'service_id and date are required',
            code: 'VALIDATION_ERROR'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Call the PostgreSQL function to calculate availability
      const { data: slots, error } = await supabaseClient.rpc('calculate_available_slots', {
        p_service_id: serviceId,
        p_staff_id: staffId,
        p_date: date,
        p_days_ahead: daysAhead
      })

      if (error) {
        console.error('Availability calculation error:', error)
        return new Response(
          JSON.stringify({
            error: 'Failed to calculate availability',
            code: 'AVAILABILITY_ERROR',
            details: error.message
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get service details
      const { data: service } = await supabaseClient
        .from('services')
        .select('name, duration_minutes, price_cents')
        .eq('id', serviceId)
        .single()

      // Get staff names for the slots
      const staffIds = [...new Set(slots?.map((slot: any) => slot.staff_id) || [])]
      const { data: staffMembers } = await supabaseClient
        .from('users')
        .select('id, first_name, last_name')
        .in('id', staffIds)
        .eq('role', 'staff')

      const staffMap = new Map(
        staffMembers?.map(staff => [staff.id, `${staff.first_name} ${staff.last_name}`]) || []
      )

      // Format the response
      const formattedSlots: AvailabilitySlot[] = slots?.map((slot: any) => ({
        staff_id: slot.staff_id,
        staff_name: staffMap.get(slot.staff_id) || 'Unknown Staff',
        start_time: slot.start_time,
        end_time: slot.end_time,
        available: slot.available,
        reason: slot.reason,
        service_duration_minutes: service?.duration_minutes || 0,
        buffer_minutes: 15 // Default buffer time
      })) || []

      // Find next available slot
      const availableSlots = formattedSlots.filter(slot => slot.available)
      const nextAvailable = availableSlots.length > 0 ? {
        date: new Date(availableSlots[0].start_time).toISOString().split('T')[0],
        time: new Date(availableSlots[0].start_time).toTimeString().substring(0, 5),
        staff_id: availableSlots[0].staff_id,
        staff_name: availableSlots[0].staff_name
      } : null

      return new Response(
        JSON.stringify({
          date,
          service_id: serviceId,
          service_name: service?.name || 'Unknown Service',
          service_duration_minutes: service?.duration_minutes || 0,
          slots: formattedSlots,
          next_available: nextAvailable,
          total_slots: formattedSlots.length,
          available_slots: availableSlots.length
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'POST') {
      // For POST requests, use request body
      const requestData: AvailabilityRequest = await req.json()

      if (!requestData.service_id || !requestData.date) {
        return new Response(
          JSON.stringify({
            error: 'service_id and date are required',
            code: 'VALIDATION_ERROR'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(requestData.date)) {
        return new Response(
          JSON.stringify({
            error: 'Invalid date format. Use YYYY-MM-DD',
            code: 'VALIDATION_ERROR'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check if date is not in the past
      const requestDate = new Date(requestData.date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (requestDate < today) {
        return new Response(
          JSON.stringify({
            error: 'Cannot get availability for past dates',
            code: 'VALIDATION_ERROR'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Call the PostgreSQL function
      const { data: slots, error } = await supabaseClient.rpc('calculate_available_slots', {
        p_service_id: requestData.service_id,
        p_staff_id: requestData.staff_id || null,
        p_date: requestData.date,
        p_days_ahead: requestData.days_ahead || 1
      })

      if (error) {
        console.error('Availability calculation error:', error)
        return new Response(
          JSON.stringify({
            error: 'Failed to calculate availability',
            code: 'AVAILABILITY_ERROR',
            details: error.message
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get additional details for response formatting
      const { data: service } = await supabaseClient
        .from('services')
        .select('name, duration_minutes, price_cents, min_advance_booking_hours')
        .eq('id', requestData.service_id)
        .single()

      if (!service) {
        return new Response(
          JSON.stringify({
            error: 'Service not found',
            code: 'SERVICE_NOT_FOUND'
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Format response with staff information
      const staffIds = [...new Set(slots?.map((slot: any) => slot.staff_id) || [])]
      const { data: staffMembers } = await supabaseClient
        .from('users')
        .select('id, first_name, last_name')
        .in('id', staffIds)
        .eq('role', 'staff')

      const staffMap = new Map(
        staffMembers?.map(staff => [staff.id, `${staff.first_name} ${staff.last_name}`]) || []
      )

      const formattedSlots: AvailabilitySlot[] = slots?.map((slot: any) => ({
        staff_id: slot.staff_id,
        staff_name: staffMap.get(slot.staff_id) || 'Unknown Staff',
        start_time: slot.start_time,
        end_time: slot.end_time,
        available: slot.available,
        reason: slot.reason,
        service_duration_minutes: service.duration_minutes,
        buffer_minutes: 15
      })) || []

      return new Response(
        JSON.stringify({
          date: requestData.date,
          service_id: requestData.service_id,
          service_name: service.name,
          service_duration_minutes: service.duration_minutes,
          slots: formattedSlots,
          min_advance_booking_hours: service.min_advance_booking_hours,
          success: true
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Availability error:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})