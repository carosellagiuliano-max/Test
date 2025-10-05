// Stripe Webhook Handler Edge Function
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from 'https://esm.sh/stripe@14.9.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    });

    // Get Stripe signature
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      throw new Error('Missing stripe-signature header');
    }

    // Get raw body
    const body = await req.text();
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      throw new Error('Missing webhook secret');
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      throw new Error('Invalid signature');
    }

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Handle event deduplication
    const { data: existingEvent } = await supabaseAdmin
      .from('webhook_events')
      .select('id')
      .eq('provider', 'stripe')
      .eq('event_id', event.id)
      .single();

    if (existingEvent) {
      console.log(`Event ${event.id} already processed`);
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Log webhook event
    await supabaseAdmin
      .from('webhook_events')
      .insert({
        provider: 'stripe',
        event_id: event.id,
        event_type: event.type,
        processed: false,
        event_data: event.data,
        created_at: new Date().toISOString(),
      });

    // Process different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(supabaseAdmin, event.data.object as Stripe.Checkout.Session);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(supabaseAdmin, event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(supabaseAdmin, event.data.object as Stripe.PaymentIntent);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(supabaseAdmin, event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionEvent(supabaseAdmin, event.data.object as Stripe.Subscription, event.type);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark event as processed
    await supabaseAdmin
      .from('webhook_events')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('event_id', event.id);

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Webhook processing error:', error);

    return new Response(
      JSON.stringify({
        error: error.message,
        received: false,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

async function handleCheckoutSessionCompleted(supabase: any, session: Stripe.Checkout.Session) {
  console.log('Processing checkout session completed:', session.id);

  const appointmentId = session.metadata?.appointment_id;
  const paymentId = session.metadata?.payment_id;

  if (!appointmentId || !paymentId) {
    throw new Error('Missing appointment_id or payment_id in session metadata');
  }

  // Update payment status
  const { error: paymentError } = await supabase
    .from('payments')
    .update({
      status: 'completed',
      stripe_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent,
      paid_at: new Date().toISOString(),
      payment_data: {
        amount_total: session.amount_total,
        currency: session.currency,
        customer_email: session.customer_email,
        payment_status: session.payment_status,
      },
    })
    .eq('id', paymentId);

  if (paymentError) {
    throw new Error(`Failed to update payment: ${paymentError.message}`);
  }

  // Update appointment status to paid
  const { error: appointmentError } = await supabase
    .from('appointments')
    .update({
      status: 'paid',
      payment_status: 'paid',
      updated_at: new Date().toISOString(),
    })
    .eq('id', appointmentId);

  if (appointmentError) {
    throw new Error(`Failed to update appointment: ${appointmentError.message}`);
  }

  // Log payment audit event
  await supabase
    .from('payment_audit_log')
    .insert({
      payment_id: paymentId,
      event_type: 'payment_completed',
      provider: 'stripe',
      event_data: {
        session_id: session.id,
        amount: session.amount_total,
        currency: session.currency,
        payment_intent_id: session.payment_intent,
      },
      created_by: session.metadata?.customer_id,
    });

  console.log(`Payment ${paymentId} completed for appointment ${appointmentId}`);
}

async function handlePaymentIntentSucceeded(supabase: any, paymentIntent: Stripe.PaymentIntent) {
  console.log('Processing payment intent succeeded:', paymentIntent.id);

  const appointmentId = paymentIntent.metadata?.appointment_id;
  const paymentId = paymentIntent.metadata?.payment_id;

  if (!appointmentId || !paymentId) {
    console.log('No appointment or payment metadata found, skipping...');
    return;
  }

  // Update payment status if not already completed
  const { data: payment } = await supabase
    .from('payments')
    .select('status')
    .eq('id', paymentId)
    .single();

  if (payment?.status !== 'completed') {
    await supabase
      .from('payments')
      .update({
        status: 'completed',
        stripe_payment_intent_id: paymentIntent.id,
        paid_at: new Date().toISOString(),
      })
      .eq('id', paymentId);

    // Log audit event
    await supabase
      .from('payment_audit_log')
      .insert({
        payment_id: paymentId,
        event_type: 'payment_intent_succeeded',
        provider: 'stripe',
        event_data: {
          payment_intent_id: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
        },
        created_by: paymentIntent.metadata?.customer_id,
      });
  }
}

async function handlePaymentIntentFailed(supabase: any, paymentIntent: Stripe.PaymentIntent) {
  console.log('Processing payment intent failed:', paymentIntent.id);

  const paymentId = paymentIntent.metadata?.payment_id;

  if (!paymentId) {
    console.log('No payment metadata found, skipping...');
    return;
  }

  // Update payment status to failed
  await supabase
    .from('payments')
    .update({
      status: 'failed',
      stripe_payment_intent_id: paymentIntent.id,
      error_message: paymentIntent.last_payment_error?.message || 'Payment failed',
      failed_at: new Date().toISOString(),
    })
    .eq('id', paymentId);

  // Log audit event
  await supabase
    .from('payment_audit_log')
    .insert({
      payment_id: paymentId,
      event_type: 'payment_failed',
      provider: 'stripe',
      event_data: {
        payment_intent_id: paymentIntent.id,
        error: paymentIntent.last_payment_error,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      },
      created_by: paymentIntent.metadata?.customer_id,
    });
}

async function handleInvoicePaymentSucceeded(supabase: any, invoice: Stripe.Invoice) {
  console.log('Processing invoice payment succeeded:', invoice.id);

  // Handle subscription billing or recurring payments
  const subscriptionId = invoice.subscription as string;

  if (subscriptionId) {
    await supabase
      .from('subscription_payments')
      .insert({
        stripe_invoice_id: invoice.id,
        stripe_subscription_id: subscriptionId,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        period_start: new Date(invoice.period_start * 1000).toISOString(),
        period_end: new Date(invoice.period_end * 1000).toISOString(),
        status: 'paid',
        paid_at: new Date().toISOString(),
      });
  }
}

async function handleSubscriptionEvent(supabase: any, subscription: Stripe.Subscription, eventType: string) {
  console.log(`Processing subscription ${eventType}:`, subscription.id);

  const customerId = subscription.customer as string;

  // Update or create subscription record
  await supabase
    .from('subscriptions')
    .upsert({
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      metadata: subscription.metadata,
      updated_at: new Date().toISOString(),
    });
}