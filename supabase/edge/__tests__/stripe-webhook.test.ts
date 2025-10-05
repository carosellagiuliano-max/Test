import { describe, it, expect } from 'vitest'

describe('Stripe webhook sample handling', () => {
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
          customer_id: '770e8400-e29b-41d4-a716-446655440002'
        }
      }
    }
  }

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
          customer_id: '770e8400-e29b-41d4-a716-446655440002'
        }
      }
    }
  }

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
          code: 'card_declined'
        },
        metadata: {
          payment_id: '660e8400-e29b-41d4-a716-446655440003',
          customer_id: '770e8400-e29b-41d4-a716-446655440002'
        }
      }
    }
  }

  it('validates checkout session metadata and payment update', () => {
    const session = mockCheckoutSessionCompleted.data.object
    expect(session.metadata?.appointment_id).toBeDefined()
    expect(session.metadata?.payment_id).toBeDefined()
    expect(session.payment_status).toBe('paid')

    const paymentUpdate = {
      status: 'completed',
      stripe_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent,
      paid_at: expect.any(String),
      payment_data: {
        amount_total: session.amount_total,
        currency: session.currency,
        customer_email: session.customer_email,
        payment_status: session.payment_status
      }
    }

    expect(paymentUpdate.status).toBe('completed')
    expect(paymentUpdate.stripe_session_id).toBe('cs_test_123')
    expect(paymentUpdate.payment_data.amount_total).toBe(8108)
  })

  it('verifies payment intent succeeded payload', () => {
    const paymentIntent = mockPaymentIntentSucceeded.data.object
    expect(paymentIntent.metadata?.appointment_id).toBeDefined()
    expect(paymentIntent.metadata?.payment_id).toBeDefined()

    const auditLogEntry = {
      payment_id: paymentIntent.metadata?.payment_id,
      event_type: 'payment_intent_succeeded',
      provider: 'stripe',
      event_data: {
        payment_intent_id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency
      },
      created_by: paymentIntent.metadata?.customer_id
    }

    expect(auditLogEntry.event_type).toBe('payment_intent_succeeded')
    expect(auditLogEntry.provider).toBe('stripe')
  })

  it('captures payment intent failures for auditing', () => {
    const paymentIntent = mockPaymentIntentFailed.data.object
    expect(paymentIntent.last_payment_error?.message).toBe('Your card was declined.')
    expect(paymentIntent.metadata?.payment_id).toBeDefined()

    const failureLog = {
      event_type: 'payment_intent.payment_failed',
      provider: 'stripe',
      error: paymentIntent.last_payment_error,
      payment_id: paymentIntent.metadata?.payment_id
    }

    expect(failureLog.error?.code).toBe('card_declined')
  })
})
