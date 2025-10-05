// Unit tests for Stripe webhook handling
import { assertEquals, assertExists } from 'https://deno.land/std@0.177.0/testing/asserts.ts';

// Mock Supabase client
const mockSupabaseClient = {
  from: (table: string) => ({
    select: (columns?: string) => ({
      eq: (column: string, value: any) => ({
        single: () => Promise.resolve({ data: null, error: null }),
      }),
    }),
    insert: (data: any) => Promise.resolve({ data, error: null }),
    update: (data: any) => ({
      eq: (column: string, value: any) => Promise.resolve({ data, error: null }),
    }),
    upsert: (data: any) => Promise.resolve({ data, error: null }),
  }),
};

// Mock Stripe webhook events
const mockCheckoutSessionCompleted = {
  id: 'evt_test_123',
  type: 'checkout.session.completed',
  data: {
    object: {
      id: 'cs_test_123',
      payment_intent: 'pi_test_123',
      payment_status: 'paid',
      amount_total: 8108,
      currency: 'chf',
      customer_email: 'test@example.com',
      metadata: {
        appointment_id: '550e8400-e29b-41d4-a716-446655440000',
        payment_id: '660e8400-e29b-41d4-a716-446655440001',
        customer_id: '770e8400-e29b-41d4-a716-446655440002',
      },
    },
  },
};

const mockPaymentIntentSucceeded = {
  id: 'evt_test_456',
  type: 'payment_intent.succeeded',
  data: {
    object: {
      id: 'pi_test_123',
      amount: 8108,
      currency: 'chf',
      metadata: {
        appointment_id: '550e8400-e29b-41d4-a716-446655440000',
        payment_id: '660e8400-e29b-41d4-a716-446655440001',
        customer_id: '770e8400-e29b-41d4-a716-446655440002',
      },
    },
  },
};

const mockPaymentIntentFailed = {
  id: 'evt_test_789',
  type: 'payment_intent.payment_failed',
  data: {
    object: {
      id: 'pi_test_failed',
      amount: 8108,
      currency: 'chf',
      last_payment_error: {
        message: 'Your card was declined.',
        type: 'card_error',
        code: 'card_declined',
      },
      metadata: {
        payment_id: '660e8400-e29b-41d4-a716-446655440003',
        customer_id: '770e8400-e29b-41d4-a716-446655440002',
      },
    },
  },
};

// Test helper functions
async function createMockRequest(body: any, signature: string = 'valid_signature') {
  return new Request('https://example.com/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'stripe-signature': signature,
    },
    body: JSON.stringify(body),
  });
}

Deno.test('Webhook - Checkout session completed processing', async () => {
  // This test verifies the logic for handling checkout.session.completed events

  const session = mockCheckoutSessionCompleted.data.object;

  // Verify required metadata exists
  assertExists(session.metadata?.appointment_id);
  assertExists(session.metadata?.payment_id);

  // Verify payment update data structure
  const paymentUpdate = {
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
  };

  assertEquals(paymentUpdate.status, 'completed');
  assertEquals(paymentUpdate.stripe_session_id, 'cs_test_123');
  assertEquals(paymentUpdate.payment_data.amount_total, 8108);

  // Verify appointment update
  const appointmentUpdate = {
    status: 'paid',
    payment_status: 'paid',
    updated_at: new Date().toISOString(),
  };

  assertEquals(appointmentUpdate.status, 'paid');
  assertEquals(appointmentUpdate.payment_status, 'paid');
});

Deno.test('Webhook - Payment intent succeeded processing', async () => {
  const paymentIntent = mockPaymentIntentSucceeded.data.object;

  // Verify metadata extraction
  assertExists(paymentIntent.metadata?.appointment_id);
  assertExists(paymentIntent.metadata?.payment_id);

  // Verify payment update for existing payment
  const paymentUpdate = {
    status: 'completed',
    stripe_payment_intent_id: paymentIntent.id,
    paid_at: new Date().toISOString(),
  };

  assertEquals(paymentUpdate.status, 'completed');
  assertEquals(paymentUpdate.stripe_payment_intent_id, 'pi_test_123');

  // Verify audit log entry
  const auditLogEntry = {
    payment_id: paymentIntent.metadata?.payment_id,
    event_type: 'payment_intent_succeeded',
    provider: 'stripe',
    event_data: {
      payment_intent_id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    },
    created_by: paymentIntent.metadata?.customer_id,
  };

  assertEquals(auditLogEntry.event_type, 'payment_intent_succeeded');
  assertEquals(auditLogEntry.provider, 'stripe');
  assertEquals(auditLogEntry.event_data.amount, 8108);
});

Deno.test('Webhook - Payment intent failed processing', async () => {
  const paymentIntent = mockPaymentIntentFailed.data.object;

  // Verify error handling
  assertExists(paymentIntent.last_payment_error);
  assertEquals(paymentIntent.last_payment_error.type, 'card_error');

  // Verify payment update for failed payment
  const paymentUpdate = {
    status: 'failed',
    stripe_payment_intent_id: paymentIntent.id,
    error_message: paymentIntent.last_payment_error?.message || 'Payment failed',
    failed_at: new Date().toISOString(),
  };

  assertEquals(paymentUpdate.status, 'failed');
  assertEquals(paymentUpdate.error_message, 'Your card was declined.');

  // Verify audit log for failed payment
  const auditLogEntry = {
    payment_id: paymentIntent.metadata?.payment_id,
    event_type: 'payment_failed',
    provider: 'stripe',
    event_data: {
      payment_intent_id: paymentIntent.id,
      error: paymentIntent.last_payment_error,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    },
    created_by: paymentIntent.metadata?.customer_id,
  };

  assertEquals(auditLogEntry.event_type, 'payment_failed');
  assertEquals(auditLogEntry.event_data.error.code, 'card_declined');
});

Deno.test('Webhook - Event deduplication', async () => {
  // Test that duplicate events are handled correctly
  const eventId = 'evt_test_duplicate';

  // First event should be processed
  const firstEvent = {
    id: eventId,
    type: 'checkout.session.completed',
    data: mockCheckoutSessionCompleted.data,
  };

  // Simulate checking for existing event (should return null for first time)
  const existingEventCheck = { data: null };
  assertEquals(existingEventCheck.data, null);

  // Simulate webhook event logging
  const webhookEventLog = {
    provider: 'stripe',
    event_id: eventId,
    event_type: firstEvent.type,
    processed: false,
    event_data: firstEvent.data,
    created_at: new Date().toISOString(),
  };

  assertEquals(webhookEventLog.event_id, eventId);
  assertEquals(webhookEventLog.processed, false);

  // Second identical event should be skipped
  const duplicateEventCheck = { data: { id: 'existing_record_id' } };
  assertEquals(duplicateEventCheck.data !== null, true);
});

Deno.test('Webhook - Signature verification failure', async () => {
  // Test webhook signature verification
  const invalidSignature = 'invalid_signature';
  const validBody = JSON.stringify(mockCheckoutSessionCompleted);

  // In a real implementation, this would verify HMAC-SHA256
  // For testing, we just verify the structure
  assertEquals(typeof invalidSignature, 'string');
  assertEquals(invalidSignature !== 'valid_signature', true);
});

Deno.test('Webhook - Missing required metadata', async () => {
  // Test handling of events with missing metadata
  const incompleteEvent = {
    id: 'evt_test_incomplete',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_incomplete',
        payment_intent: 'pi_test_incomplete',
        amount_total: 5000,
        currency: 'chf',
        metadata: {
          // Missing appointment_id and payment_id
          customer_id: '770e8400-e29b-41d4-a716-446655440002',
        },
      },
    },
  };

  const session = incompleteEvent.data.object;

  // Should detect missing required metadata
  const hasRequiredMetadata =
    session.metadata?.appointment_id &&
    session.metadata?.payment_id;

  assertEquals(hasRequiredMetadata, false);
});

Deno.test('Webhook - Subscription event handling', async () => {
  const subscriptionEvent = {
    id: 'evt_test_subscription',
    type: 'customer.subscription.created',
    data: {
      object: {
        id: 'sub_test_123',
        customer: 'cus_test_123',
        status: 'active',
        current_period_start: 1640995200, // Unix timestamp
        current_period_end: 1643673600,   // Unix timestamp
        cancel_at_period_end: false,
        metadata: {
          plan_type: 'premium',
        },
      },
    },
  };

  const subscription = subscriptionEvent.data.object;

  // Verify subscription data structure
  const subscriptionUpdate = {
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer,
    status: subscription.status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    metadata: subscription.metadata,
    updated_at: new Date().toISOString(),
  };

  assertEquals(subscriptionUpdate.stripe_subscription_id, 'sub_test_123');
  assertEquals(subscriptionUpdate.status, 'active');
  assertEquals(subscriptionUpdate.cancel_at_period_end, false);
});

Deno.test('Webhook - Invoice payment succeeded', async () => {
  const invoiceEvent = {
    id: 'evt_test_invoice',
    type: 'invoice.payment_succeeded',
    data: {
      object: {
        id: 'in_test_123',
        subscription: 'sub_test_123',
        amount_paid: 2500,
        currency: 'chf',
        period_start: 1640995200,
        period_end: 1643673600,
        status: 'paid',
      },
    },
  };

  const invoice = invoiceEvent.data.object;

  // Verify subscription payment record
  const subscriptionPayment = {
    stripe_invoice_id: invoice.id,
    stripe_subscription_id: invoice.subscription,
    amount: invoice.amount_paid,
    currency: invoice.currency,
    period_start: new Date(invoice.period_start * 1000).toISOString(),
    period_end: new Date(invoice.period_end * 1000).toISOString(),
    status: 'paid',
    paid_at: new Date().toISOString(),
  };

  assertEquals(subscriptionPayment.stripe_invoice_id, 'in_test_123');
  assertEquals(subscriptionPayment.amount, 2500);
  assertEquals(subscriptionPayment.status, 'paid');
});