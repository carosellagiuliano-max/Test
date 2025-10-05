// SumUp Payment Creation Edge Function with Deep Linking
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, idempotency-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Swiss VAT rates
const VAT_RATES = {
  STANDARD: 0.081, // 8.1%
  REDUCED: 0.026,  // 2.6%
  SPECIAL: 0.038,  // 3.8%
} as const;

interface SumUpPaymentRequest {
  appointmentId: string;
  services: Array<{
    id: string;
    name: string;
    price: number; // in cents
    vatRate: keyof typeof VAT_RATES;
  }>;
  customerInfo: {
    email: string;
    name: string;
    phone?: string;
  };
  paymentType: 'in_store' | 'remote';
  reservationTtlMinutes?: number; // For stock reservation
  metadata?: Record<string, string>;
}

interface SumUpCheckout {
  id: string;
  checkout_reference: string;
  amount: number;
  currency: string;
  merchant_code: string;
  description: string;
  return_url?: string;
  status: string;
  date: string;
  valid_until?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get user from auth token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    // Parse request body
    const body: SumUpPaymentRequest = await req.json();

    // Validate required fields
    if (!body.appointmentId || !body.services?.length || !body.customerInfo?.email) {
      throw new Error('Missing required fields');
    }

    // Get idempotency key from header
    const idempotencyKey = req.headers.get('idempotency-key') || `sumup_${body.appointmentId}_${Date.now()}`;

    // Check for existing payment with same idempotency key
    const { data: existingPayment } = await supabaseClient
      .from('payments')
      .select('*')
      .eq('idempotency_key', idempotencyKey)
      .single();

    if (existingPayment) {
      return new Response(
        JSON.stringify({
          success: true,
          payment_id: existingPayment.id,
          checkout_id: existingPayment.sumup_checkout_id,
          deep_link: existingPayment.metadata?.deep_link,
          message: 'Payment already exists',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Calculate total amount with Swiss VAT
    const totalAmount = body.services.reduce((sum, service) => {
      const vatAmount = Math.round(service.price * VAT_RATES[service.vatRate]);
      return sum + service.price + vatAmount;
    }, 0);

    // Verify appointment exists and belongs to user
    const { data: appointment, error: appointmentError } = await supabaseClient
      .from('appointments')
      .select('*')
      .eq('id', body.appointmentId)
      .eq('customer_id', user.id)
      .single();

    if (appointmentError || !appointment) {
      throw new Error('Appointment not found or access denied');
    }

    // Get SumUp access token
    const sumupAccessToken = await getSumUpAccessToken();

    // Create SumUp checkout
    const checkoutPayload = {
      checkout_reference: `apt_${body.appointmentId}_${Date.now()}`,
      amount: totalAmount / 100, // SumUp expects amount in major currency units
      currency: 'CHF',
      description: `Services for appointment ${body.appointmentId}`,
      return_url: body.paymentType === 'remote' ?
        `${Deno.env.get('FRONTEND_URL')}/appointments/${body.appointmentId}/payment-success` :
        undefined,
      merchant_code: Deno.env.get('SUMUP_MERCHANT_CODE'),
    };

    const sumupResponse = await fetch('https://api.sumup.com/v0.1/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sumupAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(checkoutPayload),
    });

    if (!sumupResponse.ok) {
      const errorData = await sumupResponse.text();
      throw new Error(`SumUp API error: ${sumupResponse.status} - ${errorData}`);
    }

    const sumupCheckout: SumUpCheckout = await sumupResponse.json();

    // Generate deep link for SumUp app
    const callbackUrl = encodeURIComponent(`${Deno.env.get('FRONTEND_URL')}/appointments/${body.appointmentId}/payment-callback`);
    const deepLink = `sumupmerchant://pay/1.0?checkout-id=${sumupCheckout.id}&callback=${callbackUrl}`;

    // Generate QR code data for desktop/web payments
    const qrCodeData = `https://api.sumup.com/v0.1/checkouts/${sumupCheckout.id}`;

    // Create stock reservation if requested
    let reservationExpiry = null;
    if (body.reservationTtlMinutes && body.paymentType === 'in_store') {
      reservationExpiry = new Date(Date.now() + body.reservationTtlMinutes * 60 * 1000).toISOString();

      // Reserve stock for services
      await Promise.all(body.services.map(async (service) => {
        await supabaseClient
          .from('stock_reservations')
          .insert({
            service_id: service.id,
            appointment_id: body.appointmentId,
            customer_id: user.id,
            expires_at: reservationExpiry,
            status: 'active',
          });
      }));
    }

    // Create payment record
    const { data: paymentRecord, error: paymentError } = await supabaseClient
      .from('payments')
      .insert({
        appointment_id: body.appointmentId,
        customer_id: user.id,
        provider: 'sumup',
        amount: totalAmount,
        currency: 'chf',
        status: 'pending',
        idempotency_key: idempotencyKey,
        sumup_checkout_id: sumupCheckout.id,
        sumup_checkout_reference: sumupCheckout.checkout_reference,
        metadata: {
          payment_type: body.paymentType,
          deep_link: deepLink,
          qr_code_data: qrCodeData,
          services: body.services,
          reservation_expiry: reservationExpiry,
          vat_breakdown: body.services.map(service => ({
            service_id: service.id,
            base_price: service.price,
            vat_rate: service.vatRate,
            vat_amount: Math.round(service.price * VAT_RATES[service.vatRate]),
          })),
        },
      })
      .select()
      .single();

    if (paymentError) {
      throw new Error(`Failed to create payment record: ${paymentError.message}`);
    }

    // Log payment event for audit
    await supabaseClient
      .from('payment_audit_log')
      .insert({
        payment_id: paymentRecord.id,
        event_type: 'sumup_checkout_created',
        provider: 'sumup',
        event_data: {
          checkout_id: sumupCheckout.id,
          amount: totalAmount,
          currency: 'chf',
          payment_type: body.paymentType,
        },
        created_by: user.id,
      });

    return new Response(
      JSON.stringify({
        success: true,
        payment_id: paymentRecord.id,
        checkout_id: sumupCheckout.id,
        checkout_reference: sumupCheckout.checkout_reference,
        deep_link: deepLink,
        qr_code_data: qrCodeData,
        amount: totalAmount,
        currency: 'CHF',
        expires_at: sumupCheckout.valid_until,
        reservation_expires_at: reservationExpiry,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('SumUp payment creation error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        code: 'SUMUP_PAYMENT_ERROR',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

async function getSumUpAccessToken(): Promise<string> {
  const clientId = Deno.env.get('SUMUP_CLIENT_ID');
  const clientSecret = Deno.env.get('SUMUP_CLIENT_SECRET');
  const refreshToken = Deno.env.get('SUMUP_REFRESH_TOKEN');

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing SumUp credentials');
  }

  const tokenResponse = await fetch('https://api.sumup.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }).toString(),
  });

  if (!tokenResponse.ok) {
    const errorData = await tokenResponse.text();
    throw new Error(`Failed to get SumUp access token: ${tokenResponse.status} - ${errorData}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}