/**
 * Payment Provider Mocks for Swiss Coiffeur Booking System
 * Comprehensive mocking for Stripe and SumUp payment integrations
 */

import { TestDataGenerator } from './test-data-generator.js';

export class PaymentMocks {
  constructor() {
    this.testDataGenerator = new TestDataGenerator();
    this.mockDatabase = {
      payments: new Map(),
      sessions: new Map(),
      webhookEvents: new Map()
    };
  }

  /**
   * Stripe Mock Implementation
   */
  createStripeMock() {
    const self = this;

    return {
      // Mock Stripe checkout sessions
      checkout: {
        sessions: {
          async create(params) {
            const session = {
              id: `cs_test_${Math.random().toString(36).substr(2, 64)}`,
              object: 'checkout.session',
              url: `https://checkout.stripe.com/c/pay/${Math.random().toString(36).substr(2, 32)}`,
              amount_total: params.line_items[0].price_data.unit_amount,
              currency: params.line_items[0].price_data.currency,
              customer_email: params.customer_email,
              payment_status: 'unpaid',
              payment_intent: `pi_test_${Math.random().toString(36).substr(2, 24)}`,
              metadata: params.metadata || {},
              success_url: params.success_url,
              cancel_url: params.cancel_url,
              mode: params.mode,
              created: Math.floor(Date.now() / 1000),
              expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour
            };

            self.mockDatabase.sessions.set(session.id, session);
            return session;
          },

          async retrieve(sessionId) {
            const session = self.mockDatabase.sessions.get(sessionId);
            if (!session) {
              throw new Error(`No such checkout session: ${sessionId}`);
            }
            return session;
          }
        }
      },

      // Mock Stripe payment intents
      paymentIntents: {
        async create(params) {
          const paymentIntent = {
            id: `pi_test_${Math.random().toString(36).substr(2, 24)}`,
            object: 'payment_intent',
            amount: params.amount,
            currency: params.currency,
            status: 'requires_payment_method',
            client_secret: `pi_test_${Math.random().toString(36).substr(2, 24)}_secret_${Math.random().toString(36).substr(2, 32)}`,
            metadata: params.metadata || {},
            payment_method_types: params.payment_method_types || ['card'],
            created: Math.floor(Date.now() / 1000)
          };

          self.mockDatabase.payments.set(paymentIntent.id, paymentIntent);
          return paymentIntent;
        },

        async retrieve(paymentIntentId) {
          const paymentIntent = self.mockDatabase.payments.get(paymentIntentId);
          if (!paymentIntent) {
            throw new Error(`No such payment_intent: ${paymentIntentId}`);
          }
          return paymentIntent;
        },

        async confirm(paymentIntentId, params = {}) {
          const paymentIntent = self.mockDatabase.payments.get(paymentIntentId);
          if (!paymentIntent) {
            throw new Error(`No such payment_intent: ${paymentIntentId}`);
          }

          // Simulate payment confirmation
          paymentIntent.status = 'succeeded';
          paymentIntent.charges = {
            data: [{
              id: `ch_test_${Math.random().toString(36).substr(2, 24)}`,
              amount: paymentIntent.amount,
              currency: paymentIntent.currency,
              paid: true,
              refunded: false
            }]
          };

          self.mockDatabase.payments.set(paymentIntentId, paymentIntent);
          return paymentIntent;
        }
      },

      // Mock Stripe refunds
      refunds: {
        async create(params) {
          const refund = {
            id: `re_test_${Math.random().toString(36).substr(2, 24)}`,
            object: 'refund',
            amount: params.amount,
            currency: 'chf',
            payment_intent: params.payment_intent,
            status: 'succeeded',
            created: Math.floor(Date.now() / 1000)
          };

          return refund;
        }
      },

      // Mock Stripe test cards
      testCards: {
        success: '4242424242424242',
        declined: '4000000000000002',
        insufficientFunds: '4000000000009995',
        authentication: '4000002500003155',
        threeDSecure: '4000002760003184'
      },

      // Mock webhook endpoint verification
      webhooks: {
        constructEvent(payload, signature, secret) {
          // Simplified signature verification for testing
          if (signature.includes('test') || secret === 'whsec_test_secret') {
            return JSON.parse(payload);
          }
          throw new Error('Invalid signature');
        }
      }
    };
  }

  /**
   * SumUp Mock Implementation
   */
  createSumUpMock() {
    const self = this;

    return {
      // Mock SumUp checkout creation
      async createCheckout(params) {
        const checkout = {
          id: `checkout_${Math.random().toString(36).substr(2, 32)}`,
          amount: params.amount,
          currency: params.currency,
          description: params.description,
          redirect_url: params.redirect_url,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: params.metadata || {},
          checkout_url: `https://checkout.sumup.com/pay/${Math.random().toString(36).substr(2, 32)}`
        };

        self.mockDatabase.sessions.set(checkout.id, checkout);
        return checkout;
      },

      // Mock SumUp checkout status retrieval
      async getCheckout(checkoutId) {
        const checkout = self.mockDatabase.sessions.get(checkoutId);
        if (!checkout) {
          throw new Error(`Checkout not found: ${checkoutId}`);
        }
        return checkout;
      },

      // Mock SumUp webhook signature verification
      verifyWebhookSignature(payload, signature, secret) {
        // Simplified verification for testing
        return signature.includes('sha256=') && secret === 'sumup_test_secret';
      },

      // Simulate payment status updates
      async simulatePaymentStatus(checkoutId, status) {
        const checkout = self.mockDatabase.sessions.get(checkoutId);
        if (checkout) {
          checkout.status = status;
          checkout.updated_at = new Date().toISOString();
          if (status === 'paid') {
            checkout.transaction_id = `txn_${Math.random().toString(36).substr(2, 24)}`;
          }
          self.mockDatabase.sessions.set(checkoutId, checkout);
        }
        return checkout;
      }
    };
  }

  /**
   * TWINT Mock Implementation (Swiss mobile payment)
   */
  createTwintMock() {
    return {
      async createPayment(params) {
        return {
          id: `twint_${Math.random().toString(36).substr(2, 24)}`,
          amount: params.amount,
          currency: 'CHF',
          status: 'pending',
          qr_code: `data:image/png;base64,${Buffer.from('mock_qr_code').toString('base64')}`,
          deep_link: `twint://payment?amount=${params.amount}&currency=CHF`,
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
        };
      },

      async getPaymentStatus(paymentId) {
        // Simulate random payment completion for testing
        const statuses = ['pending', 'completed', 'failed', 'expired'];
        return {
          id: paymentId,
          status: statuses[Math.floor(Math.random() * statuses.length)],
          updated_at: new Date().toISOString()
        };
      }
    };
  }

  /**
   * Mock payment scenarios for testing
   */
  createPaymentScenarios() {
    return {
      // Successful payment flow
      successfulPayment: {
        stripe: async () => {
          const stripe = this.createStripeMock();
          const session = await stripe.checkout.sessions.create({
            line_items: [{
              price_data: {
                currency: 'chf',
                unit_amount: 8500, // 85 CHF
                product_data: { name: 'Damenschnitt' }
              },
              quantity: 1
            }],
            mode: 'payment',
            success_url: 'https://salon.ch/success',
            cancel_url: 'https://salon.ch/cancel',
            customer_email: 'test@example.com',
            metadata: { booking_id: 'booking_123' }
          });

          // Simulate successful payment
          setTimeout(() => {
            this.mockDatabase.sessions.set(session.id, {
              ...session,
              payment_status: 'paid'
            });
          }, 100);

          return session;
        },

        sumup: async () => {
          const sumup = this.createSumUpMock();
          const checkout = await sumup.createCheckout({
            amount: 85.00,
            currency: 'CHF',
            description: 'Damenschnitt appointment',
            redirect_url: 'https://salon.ch/return',
            metadata: { booking_id: 'booking_123' }
          });

          // Simulate successful payment
          setTimeout(() => {
            sumup.simulatePaymentStatus(checkout.id, 'paid');
          }, 100);

          return checkout;
        }
      },

      // Failed payment flow
      failedPayment: {
        stripe: async () => {
          const stripe = this.createStripeMock();
          const paymentIntent = await stripe.paymentIntents.create({
            amount: 8500,
            currency: 'chf',
            payment_method_types: ['card']
          });

          // Simulate failed payment
          setTimeout(() => {
            this.mockDatabase.payments.set(paymentIntent.id, {
              ...paymentIntent,
              status: 'requires_payment_method',
              last_payment_error: {
                type: 'card_error',
                code: 'card_declined',
                message: 'Your card was declined.'
              }
            });
          }, 100);

          return paymentIntent;
        },

        sumup: async () => {
          const sumup = this.createSumUpMock();
          const checkout = await sumup.createCheckout({
            amount: 85.00,
            currency: 'CHF',
            description: 'Damenschnitt appointment'
          });

          // Simulate failed payment
          setTimeout(() => {
            sumup.simulatePaymentStatus(checkout.id, 'failed');
          }, 100);

          return checkout;
        }
      },

      // Refund flow
      refundPayment: {
        stripe: async (paymentIntentId) => {
          const stripe = this.createStripeMock();
          return await stripe.refunds.create({
            payment_intent: paymentIntentId,
            amount: 8500
          });
        }
      }
    };
  }

  /**
   * Mock database operations for testing
   */
  createMockDatabase() {
    return {
      // Store payment records
      async storePayment(payment) {
        this.mockDatabase.payments.set(payment.id, {
          ...payment,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      },

      // Retrieve payment by ID
      async getPayment(paymentId) {
        return this.mockDatabase.payments.get(paymentId);
      },

      // Update payment status
      async updatePaymentStatus(paymentId, status) {
        const payment = this.mockDatabase.payments.get(paymentId);
        if (payment) {
          payment.status = status;
          payment.updated_at = new Date().toISOString();
          this.mockDatabase.payments.set(paymentId, payment);
        }
        return payment;
      },

      // Store webhook event for deduplication
      async storeWebhookEvent(eventId, eventData) {
        this.mockDatabase.webhookEvents.set(eventId, {
          id: eventId,
          data: eventData,
          processed_at: new Date().toISOString()
        });
      },

      // Check if webhook event was already processed
      async isWebhookEventProcessed(eventId) {
        return this.mockDatabase.webhookEvents.has(eventId);
      },

      // Clear all mock data
      clear() {
        this.mockDatabase.payments.clear();
        this.mockDatabase.sessions.clear();
        this.mockDatabase.webhookEvents.clear();
      }
    };
  }

  /**
   * Generate payment test data with Swiss specifics
   */
  generateSwissPaymentTestData() {
    return {
      // Valid Swiss test cards
      testCards: {
        visa: '4242424242424242',
        mastercard: '5555555555554444',
        maestro: '6759649826438453',
        postfinance: '4000100011112224' // PostFinance-like test card
      },

      // Swiss bank account details for SEPA
      bankAccount: {
        iban: 'CH9300762011623852957',
        bic: 'UBSWCHZH80A',
        bankName: 'UBS Switzerland AG',
        accountHolder: 'Salon Beispiel GmbH'
      },

      // Swiss payment amounts (common salon prices)
      amounts: {
        herrenschnitt: 6500, // 65 CHF in cents
        damenschnitt: 8500,  // 85 CHF in cents
        faerben: 12000,      // 120 CHF in cents
        dauerwelle: 15000,   // 150 CHF in cents
        bartpflege: 3500     // 35 CHF in cents
      },

      // Swiss VAT rates
      vatRates: {
        standard: 0.077,     // 7.7% standard rate
        reduced: 0.025,      // 2.5% reduced rate (not typically for salon services)
        special: 0.037       // 3.7% special rate (accommodation)
      },

      // Swiss locale settings
      locale: {
        currency: 'CHF',
        language: 'de-CH',
        timeZone: 'Europe/Zurich',
        numberFormat: 'de-CH',
        dateFormat: 'dd.MM.yyyy'
      }
    };
  }
}

export default PaymentMocks;