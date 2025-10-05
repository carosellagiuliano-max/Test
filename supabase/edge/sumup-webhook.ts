// SumUp Webhook Handler Edge Function
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-sumup-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface SumUpWebhookEvent {
  id: string;
  event_type: string;
  resource_type: string;
  resource_id: string;
  event_data: {
    checkout_id?: string;
    status?: string;
    amount?: number;
    currency?: string;
    transaction_id?: string;
    timestamp?: string;
    merchant_code?: string;
  };
  timestamp: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get SumUp signature
    const signature = req.headers.get('x-sumup-signature');
    if (!signature) {
      throw new Error('Missing x-sumup-signature header');
    }

    // Get raw body
    const body = await req.text();
    const webhookSecret = Deno.env.get('SUMUP_WEBHOOK_SECRET');

    if (!webhookSecret) {
      throw new Error('Missing webhook secret');
    }

    // Verify webhook signature
    const isValidSignature = await verifySignature(body, signature, webhookSecret);
    if (!isValidSignature) {
      throw new Error('Invalid signature');
    }

    // Parse webhook event
    const event: SumUpWebhookEvent = JSON.parse(body);

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Handle event deduplication
    const { data: existingEvent } = await supabaseAdmin
      .from('webhook_events')
      .select('id')
      .eq('provider', 'sumup')
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
        provider: 'sumup',
        event_id: event.id,
        event_type: event.event_type,
        processed: false,
        event_data: event,
        created_at: new Date().toISOString(),
      });

    // Process different event types
    switch (event.event_type) {
      case 'CHECKOUT_STATUS_CHANGED':
        await handleCheckoutStatusChanged(supabaseAdmin, event);
        break;

      case 'TRANSACTION_COMPLETED':
        await handleTransactionCompleted(supabaseAdmin, event);
        break;

      case 'TRANSACTION_FAILED':
        await handleTransactionFailed(supabaseAdmin, event);
        break;

      case 'REFUND_COMPLETED':
        await handleRefundCompleted(supabaseAdmin, event);
        break;

      default:
        console.log(`Unhandled event type: ${event.event_type}`);
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
    console.error('SumUp webhook processing error:', error);

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

async function handleCheckoutStatusChanged(supabase: any, event: SumUpWebhookEvent) {
  console.log('Processing checkout status changed:', event.resource_id);

  const checkoutId = event.event_data.checkout_id || event.resource_id;
  const status = event.event_data.status;

  if (!checkoutId) {
    throw new Error('Missing checkout_id in event data');
  }

  // Find payment record by SumUp checkout ID
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('*')
    .eq('sumup_checkout_id', checkoutId)
    .single();

  if (paymentError || !payment) {
    console.log(`Payment not found for checkout ID: ${checkoutId}`);
    return;
  }

  // Update payment status based on SumUp status
  let newStatus = 'pending';
  let paidAt = null;
  let errorMessage = null;

  switch (status) {
    case 'PAID':
      newStatus = 'completed';
      paidAt = new Date().toISOString();
      break;
    case 'FAILED':
    case 'CANCELLED':
      newStatus = 'failed';
      errorMessage = `Payment ${status.toLowerCase()}`;
      break;
    case 'PENDING':
      newStatus = 'pending';
      break;
    default:
      console.log(`Unknown status: ${status}`);
      return;
  }

  // Update payment record
  const updateData: any = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  if (paidAt) {
    updateData.paid_at = paidAt;
  }
  if (errorMessage) {
    updateData.error_message = errorMessage;
    updateData.failed_at = new Date().toISOString();
  }

  const { error: updateError } = await supabase
    .from('payments')
    .update(updateData)
    .eq('id', payment.id);

  if (updateError) {
    throw new Error(`Failed to update payment: ${updateError.message}`);
  }

  // If payment completed, update appointment and clear reservations
  if (newStatus === 'completed') {
    // Update appointment status to paid
    await supabase
      .from('appointments')
      .update({
        status: 'paid',
        payment_status: 'paid',
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.appointment_id);

    // Clear stock reservations
    await supabase
      .from('stock_reservations')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('appointment_id', payment.appointment_id)
      .eq('status', 'active');

  } else if (newStatus === 'failed') {
    // Release stock reservations
    await supabase
      .from('stock_reservations')
      .update({
        status: 'expired',
        expired_at: new Date().toISOString(),
      })
      .eq('appointment_id', payment.appointment_id)
      .eq('status', 'active');
  }

  // Log audit event
  await supabase
    .from('payment_audit_log')
    .insert({
      payment_id: payment.id,
      event_type: 'checkout_status_changed',
      provider: 'sumup',
      event_data: {
        checkout_id: checkoutId,
        old_status: payment.status,
        new_status: newStatus,
        sumup_status: status,
        amount: event.event_data.amount,
        currency: event.event_data.currency,
      },
      created_by: payment.customer_id,
    });

  console.log(`Payment ${payment.id} status updated from ${payment.status} to ${newStatus}`);
}

async function handleTransactionCompleted(supabase: any, event: SumUpWebhookEvent) {
  console.log('Processing transaction completed:', event.resource_id);

  const transactionId = event.resource_id;
  const checkoutId = event.event_data.checkout_id;

  if (!checkoutId) {
    console.log('No checkout_id found in transaction event');
    return;
  }

  // Find payment record and update with transaction details
  const { error: updateError } = await supabase
    .from('payments')
    .update({
      sumup_transaction_id: transactionId,
      transaction_completed_at: new Date().toISOString(),
      payment_data: {
        ...event.event_data,
        transaction_id: transactionId,
      },
    })
    .eq('sumup_checkout_id', checkoutId);

  if (updateError) {
    console.error('Failed to update payment with transaction details:', updateError);
  }
}

async function handleTransactionFailed(supabase: any, event: SumUpWebhookEvent) {
  console.log('Processing transaction failed:', event.resource_id);

  const checkoutId = event.event_data.checkout_id;

  if (!checkoutId) {
    console.log('No checkout_id found in transaction failed event');
    return;
  }

  // Update payment status to failed
  await supabase
    .from('payments')
    .update({
      status: 'failed',
      error_message: 'Transaction failed',
      failed_at: new Date().toISOString(),
    })
    .eq('sumup_checkout_id', checkoutId);
}

async function handleRefundCompleted(supabase: any, event: SumUpWebhookEvent) {
  console.log('Processing refund completed:', event.resource_id);

  const transactionId = event.event_data.transaction_id;

  if (!transactionId) {
    console.log('No transaction_id found in refund event');
    return;
  }

  // Create refund record
  await supabase
    .from('refunds')
    .insert({
      provider: 'sumup',
      transaction_id: transactionId,
      amount: event.event_data.amount,
      currency: event.event_data.currency,
      status: 'completed',
      refunded_at: new Date().toISOString(),
      refund_data: event.event_data,
    });
}

async function verifySignature(payload: string, signature: string, secret: string): Promise<boolean> {
  try {
    // SumUp uses HMAC-SHA256 for webhook signature verification
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const expectedSignature = Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Remove 'sha256=' prefix if present
    const providedSignature = signature.replace(/^sha256=/, '');

    // Use constant-time comparison
    return timingSafeEqual(expectedSignature, providedSignature);
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}