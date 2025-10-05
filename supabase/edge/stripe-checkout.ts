// Stripe Checkout Session Creation Edge Function
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from 'https://esm.sh/stripe@14.9.0';

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

interface CheckoutRequest {
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
  mode: 'payment' | 'setup'; // setup for deposits
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
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
    const body: CheckoutRequest = await req.json();

    // Validate required fields
    if (!body.appointmentId || !body.services?.length || !body.customerInfo?.email) {
      throw new Error('Missing required fields');
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    });

    // Get idempotency key from header
    const idempotencyKey = req.headers.get('idempotency-key') || `checkout_${body.appointmentId}_${Date.now()}`;

    // Calculate totals with Swiss VAT
    const lineItems = body.services.map(service => {
      const vatAmount = Math.round(service.price * VAT_RATES[service.vatRate]);
      const totalAmount = service.price + vatAmount;

      return {
        price_data: {
          currency: 'chf',
          product_data: {
            name: service.name,
            metadata: {
              service_id: service.id,
              vat_rate: service.vatRate,
              base_price: service.price.toString(),
              vat_amount: vatAmount.toString(),
            },
          },
          unit_amount: totalAmount,
        },
        quantity: 1,
      };
    });

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

    // Create payment record
    const { data: paymentRecord, error: paymentError } = await supabaseClient
      .from('payments')
      .insert({
        appointment_id: body.appointmentId,
        customer_id: user.id,
        provider: 'stripe',
        amount: lineItems.reduce((sum, item) => sum + item.price_data.unit_amount, 0),
        currency: 'chf',
        status: 'pending',
        metadata: {
          mode: body.mode,
          services: body.services,
          vat_breakdown: lineItems.map(item => ({
            service_id: item.price_data.product_data.metadata.service_id,
            base_price: item.price_data.product_data.metadata.base_price,
            vat_rate: item.price_data.product_data.metadata.vat_rate,
            vat_amount: item.price_data.product_data.metadata.vat_amount,
          })),
        },
      })
      .select()
      .single();

    if (paymentError) {
      throw new Error(`Failed to create payment record: ${paymentError.message}`);
    }

    // Create Stripe checkout session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: body.mode,
      line_items: lineItems,
      success_url: `${body.successUrl}?session_id={CHECKOUT_SESSION_ID}&payment_id=${paymentRecord.id}`,
      cancel_url: body.cancelUrl,
      customer_email: body.customerInfo.email,
      client_reference_id: body.appointmentId,
      metadata: {
        appointment_id: body.appointmentId,
        payment_id: paymentRecord.id,
        customer_id: user.id,
        ...body.metadata,
      },
      payment_intent_data: body.mode === 'payment' ? {
        metadata: {
          appointment_id: body.appointmentId,
          payment_id: paymentRecord.id,
          customer_id: user.id,
        },
      } : undefined,
      automatic_tax: {
        enabled: false, // We handle Swiss VAT manually
      },
      billing_address_collection: 'required',
      phone_number_collection: {
        enabled: true,
      },
    };

    const session = await stripe.checkout.sessions.create(sessionParams, {
      idempotencyKey,
    });

    // Update payment record with Stripe session ID
    await supabaseClient
      .from('payments')
      .update({
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent as string,
      })
      .eq('id', paymentRecord.id);

    // Log payment event for audit
    await supabaseClient
      .from('payment_audit_log')
      .insert({
        payment_id: paymentRecord.id,
        event_type: 'checkout_session_created',
        provider: 'stripe',
        event_data: {
          session_id: session.id,
          amount: session.amount_total,
          currency: session.currency,
        },
        created_by: user.id,
      });

    return new Response(
      JSON.stringify({
        success: true,
        session_id: session.id,
        session_url: session.url,
        payment_id: paymentRecord.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Stripe checkout error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        code: 'CHECKOUT_ERROR',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});