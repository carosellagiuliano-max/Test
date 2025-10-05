import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn: SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',

  // Performance monitoring for edge functions
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

  // Edge-specific error handling
  beforeSend(event, hint) {
    // Don't send events for development
    if (process.env.NODE_ENV === 'development') {
      console.error('Sentry Edge Event:', event, hint)
      return null
    }

    // Critical business logic monitoring
    if (event.tags?.function === 'book-appointment') {
      event.tags.business_impact = 'critical'
      event.tags.customer_facing = 'true'
    }

    if (event.tags?.function === 'payment-process') {
      event.tags.business_impact = 'critical'
      event.tags.financial_impact = 'true'
    }

    if (event.tags?.function === 'booking-cancel') {
      event.tags.business_impact = 'high'
      event.tags.customer_facing = 'true'
    }

    return event
  },

  // Tag edge function events
  initialScope: {
    tags: {
      component: 'coiffeur-platform-edge',
      version: process.env.npm_package_version || 'unknown',
      runtime: 'edge'
    },
    contexts: {
      app: {
        name: 'Coiffeur Platform Edge Functions',
        version: process.env.npm_package_version || 'unknown'
      },
      runtime: {
        name: 'edge',
        version: 'unknown'
      }
    }
  },

  // Swiss privacy compliance
  sendDefaultPii: false,

  // Enhanced debugging information
  debug: process.env.NODE_ENV === 'development',
})