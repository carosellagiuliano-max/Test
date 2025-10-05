/**
 * Webhook Simulator for Swiss Coiffeur Booking System
 * Simulates webhook events from Stripe and SumUp for comprehensive testing
 */

import crypto from 'crypto';
import { TestDataGenerator } from './test-data-generator.js';

export class WebhookSimulator {
  constructor() {
    this.testDataGenerator = new TestDataGenerator();
    this.stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret';
    this.sumupWebhookSecret = process.env.SUMUP_WEBHOOK_SECRET || 'sumup_test_secret';
  }

  /**
   * Generate Stripe webhook signature
   */
  generateStripeSignature(payload, secret = this.stripeWebhookSecret, timestamp = null) {
    const ts = timestamp || Math.floor(Date.now() / 1000);
    const signedPayload = `${ts}.${payload}`;
    const signature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload, 'utf8')
      .digest('hex');

    return {
      signature: `t=${ts},v1=${signature}`,
      timestamp: ts
    };
  }

  /**
   * Generate SumUp webhook signature
   */
  generateSumUpSignature(payload, secret = this.sumupWebhookSecret) {
    const signature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');

    return `sha256=${signature}`;
  }

  /**
   * Create Stripe webhook event with proper signature
   */
  createStripeWebhook(eventType, options = {}) {
    const event = this.testDataGenerator.generateStripeWebhook(eventType, options.paymentId);
    const payload = JSON.stringify(event);
    const signatureData = this.generateStripeSignature(payload, options.secret);

    return {
      headers: {
        'stripe-signature': signatureData.signature,
        'content-type': 'application/json',
        'user-agent': 'Stripe/1.0 (+https://stripe.com/docs/webhooks)'
      },
      body: payload,
      event,
      signature: signatureData
    };
  }

  /**
   * Create SumUp webhook event with proper signature
   */
  createSumUpWebhook(eventType, options = {}) {
    const event = this.testDataGenerator.generateSumUpWebhook(eventType, options.checkoutId);
    const payload = JSON.stringify(event);
    const signature = this.generateSumUpSignature(payload, options.secret);

    return {
      headers: {
        'x-sumup-signature': signature,
        'content-type': 'application/json',
        'user-agent': 'SumUp-Webhooks/1.0'
      },
      body: payload,
      event,
      signature
    };
  }

  /**
   * Simulate webhook delivery with retry logic
   */
  async simulateWebhookDelivery(webhookUrl, webhook, options = {}) {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      expectedStatus = 200,
      validateIdempotency = true
    } = options;

    const results = [];

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: webhook.headers,
          body: webhook.body
        });

        const result = {
          attempt,
          status: response.status,
          statusText: response.statusText,
          success: response.status === expectedStatus,
          timestamp: new Date().toISOString(),
          responseTime: Date.now()
        };

        // Try to parse response body
        try {
          result.responseBody = await response.text();
          if (result.responseBody) {
            result.responseJson = JSON.parse(result.responseBody);
          }
        } catch {
          // Response body parsing failed, continue
        }

        results.push(result);

        if (result.success) {
          break;
        }

        // Wait before retry (except for last attempt)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        }

      } catch (error) {
        results.push({
          attempt,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        }
      }
    }

    return {
      webhook,
      results,
      finalSuccess: results.some(r => r.success),
      totalAttempts: results.length
    };
  }

  /**
   * Test idempotency by sending the same webhook multiple times
   */
  async testIdempotency(webhookUrl, eventType, provider = 'stripe', options = {}) {
    const webhook = provider === 'stripe'
      ? this.createStripeWebhook(eventType, options)
      : this.createSumUpWebhook(eventType, options);

    const duplicateCount = options.duplicateCount || 3;
    const results = [];

    // Send the same webhook multiple times
    for (let i = 0; i < duplicateCount; i++) {
      const result = await this.simulateWebhookDelivery(webhookUrl, webhook, {
        maxRetries: 1,
        expectedStatus: 200
      });

      results.push({
        ...result,
        duplicateNumber: i + 1
      });

      // Small delay between duplicates
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
      eventType,
      provider,
      duplicateCount,
      results,
      allSuccessful: results.every(r => r.finalSuccess),
      idempotencyValidated: this.validateIdempotencyResults(results)
    };
  }

  /**
   * Validate that idempotent calls produced the same result
   */
  validateIdempotencyResults(results) {
    if (results.length < 2) return true;

    const firstResponse = results[0].results[0];
    const otherResponses = results.slice(1).map(r => r.results[0]);

    // Check if all responses have the same status and similar response structure
    return otherResponses.every(response => {
      return response.status === firstResponse.status &&
             JSON.stringify(response.responseJson) === JSON.stringify(firstResponse.responseJson);
    });
  }

  /**
   * Generate a sequence of related webhook events
   */
  generateWebhookSequence(provider = 'stripe', scenarioType = 'successful_payment') {
    const sequence = [];
    const baseId = crypto.randomUUID();

    switch (scenarioType) {
      case 'successful_payment':
        if (provider === 'stripe') {
          sequence.push(
            this.createStripeWebhook('payment_intent.created', { paymentId: `pi_${baseId}` }),
            this.createStripeWebhook('payment_intent.succeeded', { paymentId: `pi_${baseId}` }),
            this.createStripeWebhook('checkout.session.completed', { paymentId: `pi_${baseId}` })
          );
        } else if (provider === 'sumup') {
          const checkoutId = `checkout_${baseId}`;
          sequence.push(
            this.createSumUpWebhook('checkout.status.updated', { checkoutId, status: 'pending' }),
            this.createSumUpWebhook('checkout.status.updated', { checkoutId, status: 'paid' })
          );
        }
        break;

      case 'failed_payment':
        if (provider === 'stripe') {
          sequence.push(
            this.createStripeWebhook('payment_intent.created', { paymentId: `pi_${baseId}` }),
            this.createStripeWebhook('payment_intent.payment_failed', { paymentId: `pi_${baseId}` })
          );
        } else if (provider === 'sumup') {
          const checkoutId = `checkout_${baseId}`;
          sequence.push(
            this.createSumUpWebhook('checkout.status.updated', { checkoutId, status: 'pending' }),
            this.createSumUpWebhook('checkout.status.updated', { checkoutId, status: 'failed' })
          );
        }
        break;

      case 'refund':
        if (provider === 'stripe') {
          sequence.push(
            this.createStripeWebhook('payment_intent.succeeded', { paymentId: `pi_${baseId}` }),
            this.createStripeWebhook('charge.refunded', { paymentId: `pi_${baseId}` })
          );
        }
        break;
    }

    return {
      scenarioType,
      provider,
      sequence,
      baseId
    };
  }

  /**
   * Simulate webhook endpoint validation
   */
  async testWebhookEndpoint(webhookUrl, provider = 'stripe') {
    const results = {
      provider,
      webhookUrl,
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0
      }
    };

    // Test cases for each provider
    const testCases = provider === 'stripe' ? [
      { name: 'checkout.session.completed', event: 'checkout.session.completed' },
      { name: 'payment_intent.succeeded', event: 'payment_intent.succeeded' },
      { name: 'payment_intent.payment_failed', event: 'payment_intent.payment_failed' },
      { name: 'charge.refunded', event: 'charge.refunded' },
      { name: 'invalid_signature', event: 'checkout.session.completed', invalidSignature: true },
      { name: 'malformed_payload', event: 'checkout.session.completed', malformedPayload: true }
    ] : [
      { name: 'checkout.status.updated_paid', event: 'checkout.status.updated' },
      { name: 'checkout.status.updated_failed', event: 'checkout.status.updated' },
      { name: 'invalid_signature', event: 'checkout.status.updated', invalidSignature: true },
      { name: 'malformed_payload', event: 'checkout.status.updated', malformedPayload: true }
    ];

    for (const testCase of testCases) {
      const test = {
        name: testCase.name,
        event: testCase.event,
        startTime: Date.now()
      };

      try {
        let webhook;

        if (testCase.malformedPayload) {
          // Create malformed payload
          webhook = provider === 'stripe'
            ? this.createStripeWebhook(testCase.event)
            : this.createSumUpWebhook(testCase.event);
          webhook.body = '{"malformed": json}'; // Invalid JSON
        } else if (testCase.invalidSignature) {
          // Create webhook with invalid signature
          webhook = provider === 'stripe'
            ? this.createStripeWebhook(testCase.event, { secret: 'invalid_secret' })
            : this.createSumUpWebhook(testCase.event, { secret: 'invalid_secret' });
        } else {
          // Create valid webhook
          webhook = provider === 'stripe'
            ? this.createStripeWebhook(testCase.event)
            : this.createSumUpWebhook(testCase.event);
        }

        const delivery = await this.simulateWebhookDelivery(webhookUrl, webhook, {
          maxRetries: 1,
          expectedStatus: testCase.malformedPayload || testCase.invalidSignature ? 400 : 200
        });

        test.success = delivery.finalSuccess;
        test.response = delivery.results[0];
        test.duration = Date.now() - test.startTime;

      } catch (error) {
        test.success = false;
        test.error = error.message;
        test.duration = Date.now() - test.startTime;
      }

      results.tests.push(test);
      results.summary.total++;
      if (test.success) {
        results.summary.passed++;
      } else {
        results.summary.failed++;
      }
    }

    return results;
  }

  /**
   * Simulate concurrent webhook deliveries for load testing
   */
  async simulateConcurrentWebhooks(webhookUrl, provider = 'stripe', options = {}) {
    const {
      concurrentCount = 10,
      eventType = 'checkout.session.completed',
      delayBetween = 0
    } = options;

    const webhooks = Array.from({ length: concurrentCount }, (_, i) => {
      return provider === 'stripe'
        ? this.createStripeWebhook(eventType, { paymentId: `concurrent_${i}` })
        : this.createSumUpWebhook(eventType, { checkoutId: `concurrent_${i}` });
    });

    const startTime = Date.now();
    const promises = webhooks.map(async (webhook, index) => {
      if (delayBetween > 0) {
        await new Promise(resolve => setTimeout(resolve, delayBetween * index));
      }

      return this.simulateWebhookDelivery(webhookUrl, webhook, {
        maxRetries: 1,
        expectedStatus: 200
      });
    });

    const results = await Promise.all(promises);
    const totalDuration = Date.now() - startTime;

    return {
      provider,
      eventType,
      concurrentCount,
      totalDuration,
      averageResponseTime: results.reduce((sum, r) => sum + (r.results[0]?.responseTime || 0), 0) / results.length,
      successRate: results.filter(r => r.finalSuccess).length / results.length,
      results
    };
  }
}

export default WebhookSimulator;