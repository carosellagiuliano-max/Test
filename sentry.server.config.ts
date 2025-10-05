import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn: SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Enhanced error context for server-side errors
  beforeSend(event, hint) {
    // Don't send events for development
    if (process.env.NODE_ENV === 'development') {
      console.error('Sentry Server Event:', event, hint)
      return null
    }

    // Add business context to booking-related errors
    if (event.tags?.component === 'booking') {
      event.tags.business_impact = 'high'
    }

    if (event.tags?.component === 'payment') {
      event.tags.business_impact = 'critical'
    }

    return event
  },

  // Tag server events
  initialScope: {
    tags: {
      component: 'coiffeur-platform-server',
      version: process.env.npm_package_version || 'unknown',
      runtime: 'node'
    },
    contexts: {
      app: {
        name: 'Coiffeur Platform Server',
        version: process.env.npm_package_version || 'unknown'
      },
      runtime: {
        name: 'node',
        version: process.version
      }
    }
  },

  // Swiss privacy compliance
  sendDefaultPii: false,

  // Enhanced debugging information
  debug: process.env.NODE_ENV === 'development',
})