import * as Sentry from '@sentry/nextjs'

// Business metrics tracking
export const BusinessMetrics = {
  // Booking flow metrics
  trackBookingStarted: (serviceId: string, customerId?: string) => {
    Sentry.addBreadcrumb({
      category: 'booking',
      message: 'Booking flow started',
      level: 'info',
      data: {
        service_id: serviceId,
        customer_id: customerId,
        timestamp: new Date().toISOString()
      }
    })

    Sentry.setTag('booking_flow', 'started')
    Sentry.setContext('booking', {
      service_id: serviceId,
      step: 'initiated'
    })
  },

  trackBookingCompleted: (appointmentId: string, amount: number, paymentMethod: string) => {
    Sentry.addBreadcrumb({
      category: 'booking',
      message: 'Booking completed successfully',
      level: 'info',
      data: {
        appointment_id: appointmentId,
        amount_chf: amount / 100,
        payment_method: paymentMethod,
        timestamp: new Date().toISOString()
      }
    })

    Sentry.setTag('booking_flow', 'completed')
    Sentry.setTag('revenue_generated', 'true')

    // Track business metrics
    Sentry.metrics.increment('booking.completed', 1, {
      tags: {
        payment_method: paymentMethod,
        amount_range: getAmountRange(amount)
      }
    })

    Sentry.metrics.distribution('booking.amount', amount, {
      tags: { payment_method: paymentMethod },
      unit: 'cent'
    })
  },

  trackBookingCancelled: (appointmentId: string, reason: string, isLateCancel: boolean) => {
    Sentry.addBreadcrumb({
      category: 'booking',
      message: 'Booking cancelled',
      level: 'warning',
      data: {
        appointment_id: appointmentId,
        reason,
        is_late_cancel: isLateCancel,
        timestamp: new Date().toISOString()
      }
    })

    Sentry.setTag('booking_flow', 'cancelled')

    if (isLateCancel) {
      Sentry.setTag('late_cancellation', 'true')
    }

    Sentry.metrics.increment('booking.cancelled', 1, {
      tags: {
        reason,
        is_late_cancel: isLateCancel.toString()
      }
    })
  },

  trackPaymentFailed: (appointmentId: string, error: Error, paymentMethod: string, amount: number) => {
    Sentry.addBreadcrumb({
      category: 'payment',
      message: 'Payment failed',
      level: 'error',
      data: {
        appointment_id: appointmentId,
        payment_method: paymentMethod,
        amount_chf: amount / 100,
        error_message: error.message,
        timestamp: new Date().toISOString()
      }
    })

    Sentry.captureException(error, {
      tags: {
        component: 'payment',
        business_impact: 'critical',
        appointment_id: appointmentId,
        payment_method: paymentMethod
      },
      contexts: {
        payment: {
          appointment_id: appointmentId,
          amount: amount,
          currency: 'CHF',
          payment_method: paymentMethod
        }
      }
    })

    Sentry.metrics.increment('payment.failed', 1, {
      tags: {
        payment_method: paymentMethod,
        error_type: error.name || 'unknown'
      }
    })
  },

  // Performance monitoring
  trackSlowOperation: (operation: string, duration: number, context?: Record<string, any>) => {
    if (duration > 2000) { // Operations taking more than 2 seconds
      Sentry.addBreadcrumb({
        category: 'performance',
        message: `Slow operation detected: ${operation}`,
        level: 'warning',
        data: {
          operation,
          duration_ms: duration,
          ...context,
          timestamp: new Date().toISOString()
        }
      })

      Sentry.setTag('slow_operation', operation)

      Sentry.metrics.distribution('operation.duration', duration, {
        tags: { operation },
        unit: 'millisecond'
      })
    }
  },

  // User experience metrics
  trackUserError: (error: Error, userAction: string, userContext?: Record<string, any>) => {
    Sentry.addBreadcrumb({
      category: 'user_experience',
      message: `User encountered error during: ${userAction}`,
      level: 'error',
      data: {
        user_action: userAction,
        error_message: error.message,
        ...userContext,
        timestamp: new Date().toISOString()
      }
    })

    Sentry.captureException(error, {
      tags: {
        component: 'frontend',
        user_action: userAction,
        user_facing: 'true'
      },
      contexts: {
        user_action: {
          action: userAction,
          ...userContext
        }
      }
    })

    Sentry.metrics.increment('user.error', 1, {
      tags: {
        action: userAction,
        error_type: error.name || 'unknown'
      }
    })
  },

  // API monitoring
  trackAPICall: (endpoint: string, method: string, statusCode: number, duration: number) => {
    const isError = statusCode >= 400
    const isSlowAPI = duration > 1000

    if (isError || isSlowAPI) {
      Sentry.addBreadcrumb({
        category: 'api',
        message: `API call: ${method} ${endpoint}`,
        level: isError ? 'error' : 'warning',
        data: {
          endpoint,
          method,
          status_code: statusCode,
          duration_ms: duration,
          timestamp: new Date().toISOString()
        }
      })
    }

    Sentry.metrics.increment('api.request', 1, {
      tags: {
        endpoint: endpoint.replace(/\/\d+/g, '/:id'), // Normalize dynamic paths
        method,
        status_code: statusCode.toString(),
        status_class: `${Math.floor(statusCode / 100)}xx`
      }
    })

    Sentry.metrics.distribution('api.duration', duration, {
      tags: {
        endpoint: endpoint.replace(/\/\d+/g, '/:id'),
        method
      },
      unit: 'millisecond'
    })
  }
}

// Swiss compliance monitoring
export const ComplianceMetrics = {
  trackDataAccess: (dataType: string, userId?: string, purpose?: string) => {
    Sentry.addBreadcrumb({
      category: 'compliance',
      message: `Data access: ${dataType}`,
      level: 'info',
      data: {
        data_type: dataType,
        user_id: userId,
        purpose,
        timestamp: new Date().toISOString()
      }
    })

    Sentry.metrics.increment('compliance.data_access', 1, {
      tags: {
        data_type: dataType,
        purpose: purpose || 'unknown'
      }
    })
  },

  trackConsentChange: (userId: string, consentType: string, granted: boolean) => {
    Sentry.addBreadcrumb({
      category: 'compliance',
      message: `Consent ${granted ? 'granted' : 'revoked'}: ${consentType}`,
      level: 'info',
      data: {
        user_id: userId,
        consent_type: consentType,
        granted,
        timestamp: new Date().toISOString()
      }
    })

    Sentry.metrics.increment('compliance.consent_change', 1, {
      tags: {
        consent_type: consentType,
        granted: granted.toString()
      }
    })
  },

  trackDataExport: (userId: string, dataTypes: string[]) => {
    Sentry.addBreadcrumb({
      category: 'compliance',
      message: 'User data export requested',
      level: 'info',
      data: {
        user_id: userId,
        data_types: dataTypes,
        timestamp: new Date().toISOString()
      }
    })

    Sentry.metrics.increment('compliance.data_export', 1, {
      tags: {
        data_types_count: dataTypes.length.toString()
      }
    })
  },

  trackDataDeletion: (userId: string, dataTypes: string[]) => {
    Sentry.addBreadcrumb({
      category: 'compliance',
      message: 'User data deletion requested',
      level: 'info',
      data: {
        user_id: userId,
        data_types: dataTypes,
        timestamp: new Date().toISOString()
      }
    })

    Sentry.metrics.increment('compliance.data_deletion', 1, {
      tags: {
        data_types_count: dataTypes.length.toString()
      }
    })
  }
}

// Performance monitoring utilities
export const PerformanceMonitor = {
  startTransaction: (name: string, op: string) => {
    return Sentry.startTransaction({
      name,
      op,
      tags: {
        component: 'coiffeur-platform'
      }
    })
  },

  measureAsync: async <T>(
    name: string,
    operation: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> => {
    const transaction = Sentry.startTransaction({ name })
    const startTime = Date.now()

    try {
      const result = await operation()
      const duration = Date.now() - startTime

      BusinessMetrics.trackSlowOperation(name, duration, context)

      transaction.setStatus('ok')
      return result
    } catch (error) {
      const duration = Date.now() - startTime

      transaction.setStatus('internal_error')

      Sentry.captureException(error, {
        tags: {
          operation: name,
          duration_ms: duration
        },
        contexts: {
          operation_context: context || {}
        }
      })

      throw error
    } finally {
      transaction.finish()
    }
  }
}

// Helper functions
function getAmountRange(amount: number): string {
  if (amount < 5000) return '0-50'
  if (amount < 10000) return '50-100'
  if (amount < 15000) return '100-150'
  if (amount < 20000) return '150-200'
  return '200+'
}

// React error boundary integration
export const withErrorBoundary = (component: React.ComponentType, fallback?: React.ComponentType) => {
  return Sentry.withErrorBoundary(component, {
    fallback: fallback || (() => 'Something went wrong. Please refresh the page.'),
    beforeCapture: (scope, error, hint) => {
      scope.setTag('component', 'react')
      scope.setTag('user_facing', 'true')

      BusinessMetrics.trackUserError(error, 'component_error', {
        component_name: component.name,
        hint: hint?.originalException?.toString()
      })
    }
  })
}