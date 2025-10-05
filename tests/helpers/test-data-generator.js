/**
 * Test Data Generator for Swiss Coiffeur Booking System
 * Generates realistic test data for comprehensive testing
 */

import { faker } from '@faker-js/faker';

// Configure faker for Swiss locale
faker.locale = 'de_CH';

export class TestDataGenerator {
  constructor() {
    this.services = [
      { id: 1, name: 'Herrenschnitt', duration: 30, price: 65, staff: ['Hans', 'Maria'] },
      { id: 2, name: 'Damenschnitt', duration: 45, price: 85, staff: ['Maria', 'Sophie'] },
      { id: 3, name: 'Färben', duration: 90, price: 120, staff: ['Sophie'] },
      { id: 4, name: 'Dauerwelle', duration: 120, price: 150, staff: ['Maria'] },
      { id: 5, name: 'Bartpflege', duration: 20, price: 35, staff: ['Hans'] }
    ];

    this.staff = [
      { id: 1, name: 'Hans Mueller', email: 'hans@salon.ch', role: 'stylist' },
      { id: 2, name: 'Maria Weber', email: 'maria@salon.ch', role: 'senior_stylist' },
      { id: 3, name: 'Sophie Fischer', email: 'sophie@salon.ch', role: 'colorist' }
    ];

    this.swissCantons = ['ZH', 'BE', 'LU', 'UR', 'SZ', 'OW', 'NW', 'GL', 'ZG', 'FR', 'SO', 'BS', 'BL', 'SH', 'AR', 'AI', 'SG', 'GR', 'AG', 'TG', 'TI', 'VD', 'VS', 'NE', 'GE', 'JU'];
  }

  /**
   * Generate a Swiss phone number
   */
  generateSwissPhoneNumber() {
    const prefixes = ['076', '077', '078', '079']; // Swiss mobile prefixes
    const prefix = faker.helpers.arrayElement(prefixes);
    const number = faker.string.numeric(7);
    return `+41 ${prefix} ${number.slice(0, 3)} ${number.slice(3)}`;
  }

  /**
   * Generate a Swiss postal address
   */
  generateSwissAddress() {
    const cities = ['Zürich', 'Basel', 'Bern', 'Luzern', 'St. Gallen', 'Winterthur', 'Lausanne', 'Genève'];
    const city = faker.helpers.arrayElement(cities);

    return {
      street: `${faker.location.streetName()} ${faker.number.int({ min: 1, max: 999 })}`,
      city,
      postalCode: faker.location.zipCode('####'),
      canton: faker.helpers.arrayElement(this.swissCantons),
      country: 'Switzerland'
    };
  }

  /**
   * Generate Swiss IBAN
   */
  generateSwissIBAN() {
    return `CH93 0076 2011 6238 5295 7`;
  }

  /**
   * Generate a realistic customer
   */
  generateCustomer() {
    const gender = faker.person.sexType();
    const firstName = faker.person.firstName(gender);
    const lastName = faker.person.lastName();

    return {
      id: faker.string.uuid(),
      firstName,
      lastName,
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      phone: this.generateSwissPhoneNumber(),
      address: this.generateSwissAddress(),
      dateOfBirth: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }),
      gender,
      preferences: {
        newsletter: faker.datatype.boolean(),
        smsReminders: faker.datatype.boolean(),
        language: faker.helpers.arrayElement(['de', 'fr', 'it', 'en'])
      },
      createdAt: faker.date.past({ years: 2 }),
      loyaltyPoints: faker.number.int({ min: 0, max: 500 })
    };
  }

  /**
   * Generate a booking appointment
   */
  generateBooking(customerId = null, serviceId = null, staffId = null) {
    const service = serviceId ? this.services.find(s => s.id === serviceId) : faker.helpers.arrayElement(this.services);
    const staffMember = staffId ? this.staff.find(s => s.id === staffId) : faker.helpers.arrayElement(this.staff.filter(s => service.staff.includes(s.name)));

    const appointmentDate = faker.date.future({ days: 30 });
    const endTime = new Date(appointmentDate.getTime() + service.duration * 60000);

    return {
      id: faker.string.uuid(),
      customerId: customerId || faker.string.uuid(),
      serviceId: service.id,
      staffId: staffMember.id,
      appointmentDate: appointmentDate.toISOString(),
      endTime: endTime.toISOString(),
      duration: service.duration,
      price: service.price,
      vatAmount: Math.round(service.price * 0.077 * 100) / 100, // Swiss MWST 7.7%
      totalAmount: Math.round((service.price * 1.077) * 100) / 100,
      status: faker.helpers.arrayElement(['pending', 'confirmed', 'completed', 'cancelled']),
      notes: faker.lorem.sentence(),
      createdAt: faker.date.recent({ days: 7 }),
      timezone: 'Europe/Zurich'
    };
  }

  /**
   * Generate payment data
   */
  generatePayment(bookingId, provider = 'stripe') {
    const paymentMethods = provider === 'stripe'
      ? ['card', 'sepa_debit', 'twint']
      : ['card', 'twint'];

    return {
      id: faker.string.uuid(),
      bookingId,
      provider,
      providerId: provider === 'stripe' ? `pi_${faker.string.alphanumeric(24)}` : faker.string.alphanumeric(16),
      amount: faker.number.int({ min: 3500, max: 15000 }), // Swiss cents
      currency: 'CHF',
      method: faker.helpers.arrayElement(paymentMethods),
      status: faker.helpers.arrayElement(['pending', 'processing', 'succeeded', 'failed', 'cancelled']),
      clientSecret: provider === 'stripe' ? `pi_${faker.string.alphanumeric(24)}_secret_${faker.string.alphanumeric(32)}` : null,
      webhookId: faker.string.alphanumeric(24),
      idempotencyKey: faker.string.uuid(),
      createdAt: faker.date.recent({ days: 1 }),
      metadata: {
        customerId: faker.string.uuid(),
        serviceType: faker.helpers.arrayElement(['haircut', 'coloring', 'styling']),
        location: 'zurich_main'
      }
    };
  }

  /**
   * Generate Stripe webhook event
   */
  generateStripeWebhook(eventType = 'checkout.session.completed', paymentId = null) {
    const baseEvent = {
      id: `evt_${faker.string.alphanumeric(24)}`,
      object: 'event',
      created: Math.floor(Date.now() / 1000),
      type: eventType,
      api_version: '2023-10-16',
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: `req_${faker.string.alphanumeric(24)}`,
        idempotency_key: faker.string.uuid()
      }
    };

    switch (eventType) {
      case 'checkout.session.completed':
        baseEvent.data = {
          object: {
            id: `cs_${faker.string.alphanumeric(64)}`,
            object: 'checkout.session',
            amount_total: faker.number.int({ min: 3500, max: 15000 }),
            currency: 'chf',
            customer_email: faker.internet.email(),
            payment_status: 'paid',
            payment_intent: paymentId || `pi_${faker.string.alphanumeric(24)}`,
            metadata: {
              booking_id: faker.string.uuid(),
              customer_id: faker.string.uuid()
            }
          }
        };
        break;

      case 'payment_intent.succeeded':
        baseEvent.data = {
          object: {
            id: paymentId || `pi_${faker.string.alphanumeric(24)}`,
            object: 'payment_intent',
            amount: faker.number.int({ min: 3500, max: 15000 }),
            currency: 'chf',
            status: 'succeeded',
            metadata: {
              booking_id: faker.string.uuid()
            }
          }
        };
        break;
    }

    return baseEvent;
  }

  /**
   * Generate SumUp webhook event
   */
  generateSumUpWebhook(eventType = 'checkout.status.updated', checkoutId = null) {
    return {
      id: faker.string.uuid(),
      event_type: eventType,
      timestamp: new Date().toISOString(),
      data: {
        checkout: {
          id: checkoutId || faker.string.alphanumeric(32),
          status: faker.helpers.arrayElement(['paid', 'pending', 'failed']),
          amount: faker.number.int({ min: 35.00, max: 150.00 }),
          currency: 'CHF',
          description: `Coiffeur appointment - ${faker.date.future().toLocaleDateString('de-CH')}`,
          metadata: {
            booking_id: faker.string.uuid(),
            customer_id: faker.string.uuid(),
            service_type: faker.helpers.arrayElement(['haircut', 'coloring', 'styling'])
          },
          created_at: faker.date.recent().toISOString()
        }
      }
    };
  }

  /**
   * Generate test data for load testing
   */
  generateLoadTestData(count = 100) {
    const customers = Array.from({ length: count }, () => this.generateCustomer());
    const bookings = Array.from({ length: count * 2 }, () => {
      const customer = faker.helpers.arrayElement(customers);
      return this.generateBooking(customer.id);
    });
    const payments = bookings.map(booking => this.generatePayment(booking.id));

    return {
      customers,
      bookings,
      payments,
      stats: {
        customersCount: customers.length,
        bookingsCount: bookings.length,
        paymentsCount: payments.length,
        totalRevenue: payments.reduce((sum, p) => sum + p.amount, 0) / 100 // Convert from cents
      }
    };
  }

  /**
   * Generate conflict scenarios for testing
   */
  generateConflictScenarios() {
    const baseDate = new Date();
    baseDate.setHours(14, 0, 0, 0); // 2 PM today

    return [
      {
        name: 'Exact time conflict',
        bookings: [
          this.generateBooking(null, 1, 1), // Same service, same staff
          this.generateBooking(null, 1, 1)  // Exact same time
        ]
      },
      {
        name: 'Overlapping appointments',
        bookings: [
          { ...this.generateBooking(null, 2, 1), appointmentDate: new Date(baseDate.getTime()).toISOString() },
          { ...this.generateBooking(null, 3, 1), appointmentDate: new Date(baseDate.getTime() + 30 * 60000).toISOString() }
        ]
      },
      {
        name: 'Buffer time violation',
        bookings: [
          { ...this.generateBooking(null, 1, 1), appointmentDate: new Date(baseDate.getTime()).toISOString() },
          { ...this.generateBooking(null, 2, 1), appointmentDate: new Date(baseDate.getTime() + 30 * 60000).toISOString() }
        ]
      }
    ];
  }

  /**
   * Generate edge cases for testing
   */
  generateEdgeCases() {
    return {
      // Very long names (Swiss law allows up to 50 characters per name part)
      longNameCustomer: {
        ...this.generateCustomer(),
        firstName: 'Jean-François-Marie-Alexandre-Bernard',
        lastName: 'von Habsburg-Lothringen-Schweizer-Familie'
      },

      // Minimum age customer (18 years old)
      minAgeCustomer: {
        ...this.generateCustomer(),
        dateOfBirth: new Date(new Date().setFullYear(new Date().getFullYear() - 18))
      },

      // Multiple booking attempts (race condition testing)
      raceConditionBookings: Array.from({ length: 5 }, () => ({
        ...this.generateBooking(),
        appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow same time
      })),

      // Holiday bookings (Swiss holidays)
      holidayBookings: [
        { ...this.generateBooking(), appointmentDate: '2024-12-25T10:00:00.000Z' }, // Christmas
        { ...this.generateBooking(), appointmentDate: '2024-08-01T14:00:00.000Z' }  // Swiss National Day
      ],

      // Weekend bookings
      weekendBookings: [
        { ...this.generateBooking(), appointmentDate: '2024-12-21T10:00:00.000Z' }, // Saturday
        { ...this.generateBooking(), appointmentDate: '2024-12-22T14:00:00.000Z' }  // Sunday
      ],

      // International customers
      internationalCustomers: [
        { ...this.generateCustomer(), phone: '+49 176 12345678', address: { ...this.generateSwissAddress(), country: 'Germany' } },
        { ...this.generateCustomer(), phone: '+33 6 12 34 56 78', address: { ...this.generateSwissAddress(), country: 'France' } },
        { ...this.generateCustomer(), phone: '+39 333 123 4567', address: { ...this.generateSwissAddress(), country: 'Italy' } }
      ]
    };
  }
}

export default TestDataGenerator;