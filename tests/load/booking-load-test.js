import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const bookingErrorRate = new Rate('booking_errors');
const bookingDuration = new Trend('booking_duration');
const paymentErrorRate = new Rate('payment_errors');
const paymentDuration = new Trend('payment_duration');

// Test configuration
export const options = {
  scenarios: {
    // Gradual ramp-up to simulate real traffic
    normal_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 10 },   // Ramp up to 10 users over 2 minutes
        { duration: '5m', target: 10 },   // Stay at 10 users for 5 minutes
        { duration: '2m', target: 20 },   // Ramp up to 20 users over 2 minutes
        { duration: '5m', target: 20 },   // Stay at 20 users for 5 minutes
        { duration: '2m', target: 0 },    // Ramp down to 0 users
      ],
    },

    // Spike test for handling traffic bursts
    spike_test: {
      executor: 'ramping-vus',
      startTime: '16m',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },  // Spike to 50 users
        { duration: '1m', target: 50 },   // Stay at 50 users
        { duration: '30s', target: 0 },   // Ramp down
      ],
    },

    // Stress test to find breaking point
    stress_test: {
      executor: 'ramping-vus',
      startTime: '18m',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 30 },
        { duration: '5m', target: 30 },
        { duration: '2m', target: 60 },
        { duration: '5m', target: 60 },
        { duration: '2m', target: 100 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 0 },
      ],
    }
  },

  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests should be below 2s
    http_req_failed: ['rate<0.05'],    // Error rate should be less than 5%
    booking_errors: ['rate<0.02'],     // Booking error rate should be less than 2%
    payment_errors: ['rate<0.01'],     // Payment error rate should be less than 1%
  },
};

// Base URL from environment or default
const BASE_URL = __ENV.BASE_URL || 'https://your-coiffeur-platform.netlify.app';
const API_BASE = `${BASE_URL}/api`;

// Test data
const services = [
  { id: 'haircut-wash', duration: 60, price: 8500 },
  { id: 'hair-styling', duration: 45, price: 6500 },
  { id: 'hair-coloring', duration: 120, price: 15000 },
  { id: 'beard-trim', duration: 30, price: 4500 }
];

const staff = [
  'staff-1',
  'staff-2',
  'staff-3'
];

// Generate test customer data
function generateCustomer() {
  const randomId = Math.random().toString(36).substring(7);
  return {
    first_name: `LoadTest${randomId}`,
    last_name: 'Customer',
    email: `loadtest${randomId}@example.com`,
    phone: `+4179${Math.floor(Math.random() * 9000000 + 1000000)}`
  };
}

// Generate future booking date
function generateBookingDate() {
  const date = new Date();
  const daysToAdd = Math.floor(Math.random() * 14) + 1; // 1-14 days in future
  date.setDate(date.getDate() + daysToAdd);

  // Ensure it's not Sunday (salon closed)
  if (date.getDay() === 0) {
    date.setDate(date.getDate() + 1);
  }

  return date.toISOString().split('T')[0];
}

// Generate booking time
function generateBookingTime() {
  const hours = ['09', '10', '11', '12', '13', '14', '15', '16'];
  const minutes = ['00', '30'];

  const hour = hours[Math.floor(Math.random() * hours.length)];
  const minute = minutes[Math.floor(Math.random() * minutes.length)];

  return `${hour}:${minute}`;
}

export default function () {
  const service = services[Math.floor(Math.random() * services.length)];
  const staffId = staff[Math.floor(Math.random() * staff.length)];
  const customer = generateCustomer();
  const date = generateBookingDate();
  const time = generateBookingTime();

  // Test 1: Check availability
  console.log(`Testing availability for ${date} ${time}`);
  const availabilityResponse = http.get(
    `${API_BASE}/booking/availability?date=${date}&service_id=${service.id}&staff_id=${staffId}`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  check(availabilityResponse, {
    'availability check status is 200': (r) => r.status === 200,
    'availability response has slots': (r) => {
      const body = JSON.parse(r.body);
      return body.available_slots && Array.isArray(body.available_slots);
    },
  });

  // Test 2: Create booking
  console.log(`Creating booking for ${customer.email}`);
  const bookingPayload = {
    date,
    time,
    service_id: service.id,
    staff_id: staffId,
    customer
  };

  const bookingStart = Date.now();
  const bookingResponse = http.post(
    `${BASE_URL}/functions/v1/book-appointment`,
    JSON.stringify(bookingPayload),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${__ENV.SUPABASE_ANON_KEY || 'test-key'}`,
      },
    }
  );

  const bookingEnd = Date.now();
  bookingDuration.add(bookingEnd - bookingStart);

  const bookingSuccess = check(bookingResponse, {
    'booking status is 200': (r) => r.status === 200,
    'booking has appointment_id': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.appointment_id !== undefined;
      } catch (e) {
        return false;
      }
    },
    'booking has confirmation_code': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.confirmation_code !== undefined;
      } catch (e) {
        return false;
      }
    },
  });

  bookingErrorRate.add(!bookingSuccess);

  let appointmentId, confirmationCode;

  if (bookingSuccess && bookingResponse.status === 200) {
    try {
      const bookingData = JSON.parse(bookingResponse.body);
      appointmentId = bookingData.appointment_id;
      confirmationCode = bookingData.confirmation_code;

      // Test 3: Payment processing (simulate Stripe)
      console.log(`Processing payment for appointment ${appointmentId}`);
      const paymentStart = Date.now();

      const paymentPayload = {
        appointment_id: appointmentId,
        payment_method: 'stripe',
        amount: service.price,
        currency: 'chf'
      };

      const paymentResponse = http.post(
        `${API_BASE}/payment/process`,
        JSON.stringify(paymentPayload),
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${__ENV.SUPABASE_ANON_KEY || 'test-key'}`,
          },
        }
      );

      const paymentEnd = Date.now();
      paymentDuration.add(paymentEnd - paymentStart);

      const paymentSuccess = check(paymentResponse, {
        'payment status is 200 or 201': (r) => r.status === 200 || r.status === 201,
        'payment has transaction_id': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.transaction_id !== undefined;
          } catch (e) {
            return false;
          }
        },
      });

      paymentErrorRate.add(!paymentSuccess);

      // Test 4: Booking confirmation retrieval
      if (paymentSuccess) {
        console.log(`Retrieving confirmation for ${confirmationCode}`);
        const confirmationResponse = http.get(
          `${API_BASE}/booking/confirmation/${confirmationCode}`,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        check(confirmationResponse, {
          'confirmation retrieval status is 200': (r) => r.status === 200,
          'confirmation has booking details': (r) => {
            try {
              const body = JSON.parse(r.body);
              return body.appointment && body.customer && body.service;
            } catch (e) {
              return false;
            }
          },
        });
      }

      // Test 5: Booking cancellation (10% of bookings)
      if (Math.random() < 0.1) {
        console.log(`Cancelling appointment ${appointmentId}`);
        const cancellationResponse = http.post(
          `${BASE_URL}/functions/v1/booking-cancel`,
          JSON.stringify({
            appointment_id: appointmentId,
            confirmation_code: confirmationCode
          }),
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${__ENV.SUPABASE_ANON_KEY || 'test-key'}`,
            },
          }
        );

        check(cancellationResponse, {
          'cancellation status is 200': (r) => r.status === 200,
          'cancellation confirms status': (r) => {
            try {
              const body = JSON.parse(r.body);
              return body.status === 'cancelled';
            } catch (e) {
              return false;
            }
          },
        });
      }
    } catch (error) {
      console.error('Error parsing booking response:', error);
      bookingErrorRate.add(1);
    }
  }

  // Random sleep between 1-5 seconds to simulate real user behavior
  sleep(Math.random() * 4 + 1);
}

export function handleSummary(data) {
  return {
    'summary.json': JSON.stringify(data, null, 2),
    'stdout': textSummary(data),
  };
}

function textSummary(data) {
  const avgBookingDuration = data.metrics.booking_duration?.avg || 0;
  const avgPaymentDuration = data.metrics.payment_duration?.avg || 0;
  const bookingErrorRate = data.metrics.booking_errors?.rate || 0;
  const paymentErrorRate = data.metrics.payment_errors?.rate || 0;

  return `
Load Test Summary:
==================
Total Requests: ${data.metrics.http_reqs?.count || 0}
Failed Requests: ${data.metrics.http_req_failed?.count || 0}
Request Duration (avg): ${data.metrics.http_req_duration?.avg?.toFixed(2) || 0}ms
Request Duration (p95): ${data.metrics.http_req_duration?.p95?.toFixed(2) || 0}ms

Booking Metrics:
================
Booking Duration (avg): ${avgBookingDuration.toFixed(2)}ms
Booking Error Rate: ${(bookingErrorRate * 100).toFixed(2)}%

Payment Metrics:
================
Payment Duration (avg): ${avgPaymentDuration.toFixed(2)}ms
Payment Error Rate: ${(paymentErrorRate * 100).toFixed(2)}%

Performance Goals:
==================
✓ 95% requests under 2s: ${data.metrics.http_req_duration?.p95 < 2000 ? 'PASS' : 'FAIL'}
✓ Error rate under 5%: ${data.metrics.http_req_failed?.rate < 0.05 ? 'PASS' : 'FAIL'}
✓ Booking errors under 2%: ${bookingErrorRate < 0.02 ? 'PASS' : 'FAIL'}
✓ Payment errors under 1%: ${paymentErrorRate < 0.01 ? 'PASS' : 'FAIL'}
`;
}