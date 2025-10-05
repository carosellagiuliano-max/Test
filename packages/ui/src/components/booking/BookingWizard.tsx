'use client';

import React, { useState, useEffect } from 'react';
import { BookingWizardState, BookingWizardStep, Service, UUID } from '@repo/types';
import { BookingService } from '../../lib/booking-service';
import { ServiceSelection } from './ServiceSelection';
import { StaffSelection } from './StaffSelection';
import { DateTimeSelection } from './DateTimeSelection';
import { CustomerInformation } from './CustomerInformation';
import { BookingConfirmation } from './BookingConfirmation';
import { ProgressIndicator } from './ProgressIndicator';

interface BookingWizardProps {
  onComplete?: (bookingId: string) => void;
  onCancel?: () => void;
  initialService?: Service;
  className?: string;
}

const INITIAL_STEPS: BookingWizardStep[] = [
  {
    step: 1,
    title: 'Select Service',
    description: 'Choose the service you would like to book',
    completed: false,
    valid: false
  },
  {
    step: 2,
    title: 'Choose Staff',
    description: 'Select your preferred stylist or any available',
    completed: false,
    valid: false
  },
  {
    step: 3,
    title: 'Date & Time',
    description: 'Pick your preferred date and time slot',
    completed: false,
    valid: false
  },
  {
    step: 4,
    title: 'Your Information',
    description: 'Provide your contact details',
    completed: false,
    valid: false
  },
  {
    step: 5,
    title: 'Confirmation',
    description: 'Review and confirm your booking',
    completed: false,
    valid: false
  }
];

export function BookingWizard({
  onComplete,
  onCancel,
  initialService,
  className = ''
}: BookingWizardProps) {
  const [wizardState, setWizardState] = useState<BookingWizardState>({
    steps: INITIAL_STEPS,
    current_step: 1,
    total_duration_minutes: 0,
    total_price_cents: 0,
    booking_validated: false,
    validation_errors: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize with initial service if provided
  useEffect(() => {
    if (initialService) {
      updateWizardData('service', {
        id: initialService.id,
        name: initialService.name,
        duration_minutes: initialService.duration_minutes,
        price_cents: initialService.price_cents,
        description: initialService.description
      });
      markStepCompleted(1);
      setCurrentStep(2);
    }
  }, [initialService]);

  const setCurrentStep = (step: number) => {
    setWizardState(prev => ({ ...prev, current_step: step }));
  };

  const updateWizardData = (key: keyof BookingWizardState, value: any) => {
    setWizardState(prev => ({
      ...prev,
      [key]: value,
      // Recalculate totals when service changes
      ...(key === 'service' && value ? {
        total_duration_minutes: value.duration_minutes,
        total_price_cents: value.price_cents
      } : {})
    }));
  };

  const markStepCompleted = (stepNumber: number) => {
    setWizardState(prev => ({
      ...prev,
      steps: prev.steps.map(step =>
        step.step === stepNumber
          ? { ...step, completed: true, valid: true }
          : step
      )
    }));
  };

  const markStepInvalid = (stepNumber: number, errors: string[] = []) => {
    setWizardState(prev => ({
      ...prev,
      steps: prev.steps.map(step =>
        step.step === stepNumber
          ? { ...step, completed: false, valid: false }
          : step
      ),
      validation_errors: errors
    }));
  };

  const canProceedToNext = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        return !!wizardState.service;
      case 2:
        return !!wizardState.staff;
      case 3:
        return !!wizardState.date_time;
      case 4:
        return !!wizardState.customer;
      case 5:
        return wizardState.booking_validated;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    const currentStep = wizardState.current_step;

    if (!canProceedToNext(currentStep)) {
      setError('Please complete all required fields before proceeding');
      return;
    }

    if (currentStep === 4) {
      // Validate booking before showing confirmation
      await validateBooking();
    }

    if (currentStep < 5) {
      markStepCompleted(currentStep);
      setCurrentStep(currentStep + 1);
    }

    setError(null);
  };

  const handlePrevious = () => {
    if (wizardState.current_step > 1) {
      setCurrentStep(wizardState.current_step - 1);
    }
  };

  const validateBooking = async () => {
    if (!wizardState.service || !wizardState.staff || !wizardState.date_time || !wizardState.customer) {
      setError('Missing required booking information');
      return;
    }

    setLoading(true);
    try {
      const startDateTime = new Date(`${wizardState.date_time.date}T${wizardState.date_time.time}`);

      const validation = await BookingService.BookingValidator.validateBookingRequest({
        customer_id: wizardState.customer.id,
        staff_id: wizardState.staff.id,
        service_id: wizardState.service.id,
        start_time: startDateTime.toISOString(),
        notes: '',
        idempotency_key: crypto.randomUUID()
      });

      if (validation.valid) {
        updateWizardData('booking_validated', true);
        updateWizardData('validation_errors', []);
      } else {
        updateWizardData('booking_validated', false);
        updateWizardData('validation_errors', validation.errors);
        setError(validation.errors.join(', '));
      }
    } catch (err) {
      console.error('Booking validation error:', err);
      setError('Failed to validate booking. Please try again.');
      updateWizardData('booking_validated', false);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingComplete = async () => {
    if (!wizardState.booking_validated) {
      setError('Booking validation failed');
      return;
    }

    setLoading(true);
    try {
      const startDateTime = new Date(`${wizardState.date_time!.date}T${wizardState.date_time!.time}`);

      const booking = await BookingService.BookingManager.createBooking({
        customer_id: wizardState.customer!.id,
        staff_id: wizardState.staff!.id,
        service_id: wizardState.service!.id,
        start_time: startDateTime.toISOString(),
        notes: '',
        send_confirmation: true,
        payment_method: wizardState.payment?.method || 'cash',
        idempotency_key: crypto.randomUUID()
      });

      markStepCompleted(5);
      onComplete?.(booking.appointment_id);
    } catch (err) {
      console.error('Booking creation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const renderCurrentStep = () => {
    switch (wizardState.current_step) {
      case 1:
        return (
          <ServiceSelection
            selectedService={wizardState.service}
            onServiceSelect={(service) => {
              updateWizardData('service', service);
            }}
          />
        );

      case 2:
        return (
          <StaffSelection
            serviceId={wizardState.service?.id}
            selectedStaff={wizardState.staff}
            onStaffSelect={(staff) => {
              updateWizardData('staff', staff);
            }}
          />
        );

      case 3:
        return (
          <DateTimeSelection
            serviceId={wizardState.service?.id}
            staffId={wizardState.staff?.id}
            selectedDateTime={wizardState.date_time}
            onDateTimeSelect={(dateTime) => {
              updateWizardData('date_time', dateTime);
            }}
          />
        );

      case 4:
        return (
          <CustomerInformation
            customer={wizardState.customer}
            onCustomerUpdate={(customer) => {
              updateWizardData('customer', customer);
            }}
          />
        );

      case 5:
        return (
          <BookingConfirmation
            wizardState={wizardState}
            onConfirm={handleBookingComplete}
            onPaymentMethodChange={(method) => {
              updateWizardData('payment', {
                ...wizardState.payment,
                method,
                amount_cents: method === 'deposit'
                  ? Math.floor(wizardState.total_price_cents * 0.3) // 30% deposit
                  : wizardState.total_price_cents
              });
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={`booking-wizard bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto ${className}`}>
      {/* Progress Indicator */}
      <ProgressIndicator
        steps={wizardState.steps}
        currentStep={wizardState.current_step}
        className="mb-8"
      />

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          <div className="flex">
            <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="step-content min-h-[400px]">
        {renderCurrentStep()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6 border-t">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          disabled={loading}
        >
          Cancel
        </button>

        <div className="flex gap-3">
          {wizardState.current_step > 1 && (
            <button
              onClick={handlePrevious}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Previous
            </button>
          )}

          {wizardState.current_step < 5 ? (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={!canProceedToNext(wizardState.current_step) || loading}
            >
              {loading ? 'Processing...' : 'Next'}
            </button>
          ) : (
            <button
              onClick={handleBookingComplete}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              disabled={!wizardState.booking_validated || loading}
            >
              {loading ? 'Creating Booking...' : 'Confirm Booking'}
            </button>
          )}
        </div>
      </div>

      {/* Booking Summary Sidebar */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-lg mb-3">Booking Summary</h3>

        {wizardState.service && (
          <div className="mb-2">
            <span className="text-sm text-gray-600">Service:</span>
            <span className="ml-2 font-medium">{wizardState.service.name}</span>
          </div>
        )}

        {wizardState.staff && (
          <div className="mb-2">
            <span className="text-sm text-gray-600">Staff:</span>
            <span className="ml-2 font-medium">
              {wizardState.staff.first_name} {wizardState.staff.last_name}
            </span>
          </div>
        )}

        {wizardState.date_time && (
          <div className="mb-2">
            <span className="text-sm text-gray-600">Date & Time:</span>
            <span className="ml-2 font-medium">
              {new Date(`${wizardState.date_time.date}T${wizardState.date_time.time}`).toLocaleDateString('de-CH', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        )}

        {wizardState.total_duration_minutes > 0 && (
          <div className="mb-2">
            <span className="text-sm text-gray-600">Duration:</span>
            <span className="ml-2 font-medium">
              {BookingService.BookingUtils.formatDuration(wizardState.total_duration_minutes)}
            </span>
          </div>
        )}

        {wizardState.total_price_cents > 0 && (
          <div className="pt-2 border-t">
            <span className="text-sm text-gray-600">Total Price:</span>
            <span className="ml-2 font-bold text-lg">
              {BookingService.BookingUtils.formatPrice(wizardState.total_price_cents)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}