import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn: SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session replay for better debugging
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Enhanced error filtering
  beforeSend(event, hint) {
    // Don't send events for development
    if (process.env.NODE_ENV === 'development') {
      console.error('Sentry Event:', event, hint)
      return null
    }

    // Filter out known noise
    if (event.exception) {
      const error = hint.originalException

      // Filter out network errors that aren't actionable
      if (error?.name === 'TypeError' && error?.message?.includes('fetch')) {
        return null
      }

      // Filter out browser extension errors
      if (error?.stack?.includes('extension://')) {
        return null
      }
    }

    return event
  },

  // Tag events with useful context
  initialScope: {
    tags: {
      component: 'coiffeur-platform',
      version: process.env.npm_package_version || 'unknown'
    },
    contexts: {
      app: {
        name: 'Coiffeur Platform',
        version: process.env.npm_package_version || 'unknown'
      }
    }
  },

  // Swiss privacy compliance
  sendDefaultPii: false,

  // Enhanced debugging information
  debug: process.env.NODE_ENV === 'development',

  // Integration configuration
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      maskAllInputs: true,
      blockAllMedia: true,
    }),
  ],
})