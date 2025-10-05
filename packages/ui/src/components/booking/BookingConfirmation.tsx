'use client';

import React, { useState } from 'react';
import { BookingWizardState } from '@repo/types';
import { BookingService } from '../../lib/booking-service';

interface BookingConfirmationProps {
  wizardState: BookingWizardState;
  onConfirm: () => void;
  onPaymentMethodChange: (method: 'deposit' | 'full' | 'cash') => void;
  className?: string;
}

export function BookingConfirmation({
  wizardState,
  onConfirm,
  onPaymentMethodChange,
  className = ''
}: BookingConfirmationProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'deposit' | 'full' | 'cash'>('cash');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [subscribeToMarketing, setSubscribeToMarketing] = useState(false);

  const handlePaymentMethodChange = (method: 'deposit' | 'full' | 'cash') => {
    setSelectedPaymentMethod(method);
    onPaymentMethodChange(method);
  };

  const formatDateTime = () => {
    if (!wizardState.date_time) return '';

    const dateTime = new Date(`${wizardState.date_time.date}T${wizardState.date_time.time}`);
    return dateTime.toLocaleDateString('de-CH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDepositAmount = () => {
    return Math.floor(wizardState.total_price_cents * 0.3); // 30% deposit
  };

  const getPaymentAmount = () => {
    switch (selectedPaymentMethod) {
      case 'deposit':
        return calculateDepositAmount();
      case 'full':
        return wizardState.total_price_cents;
      case 'cash':
        return 0; // Pay at salon
      default:
        return 0;
    }
  };

  const canConfirm = () => {
    return (
      wizardState.booking_validated &&
      agreeToTerms &&
      wizardState.service &&
      wizardState.staff &&
      wizardState.date_time &&
      wizardState.customer
    );
  };

  return (
    <div className={`booking-confirmation ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirm Your Booking</h2>
        <p className="text-gray-600">Please review your appointment details and confirm</p>
      </div>

      {/* Validation Errors */}
      {wizardState.validation_errors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800">Booking Validation Issues</h3>
              <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                {wizardState.validation_errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Appointment Summary */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointment Summary</h3>

          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            {/* Service */}
            {wizardState.service && (
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-gray-900">{wizardState.service.name}</h4>
                  {wizardState.service.description && (
                    <p className="text-sm text-gray-600 mt-1">{wizardState.service.description}</p>
                  )}
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {BookingService.BookingUtils.formatDuration(wizardState.service.duration_minutes)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    {BookingService.BookingUtils.formatPrice(wizardState.service.price_cents)}
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-gray-200 pt-4">
              {/* Staff */}
              {wizardState.staff && (
                <div className="flex items-center mb-3">
                  <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {wizardState.staff.id === 'any'
                        ? 'Any Available Stylist'
                        : `${wizardState.staff.first_name} ${wizardState.staff.last_name}`
                      }
                    </div>
                    {wizardState.staff.id === 'any' && (
                      <div className="text-xs text-gray-500">We'll assign the best available stylist</div>
                    )}
                  </div>
                </div>
              )}

              {/* Date & Time */}
              {wizardState.date_time && (
                <div className="flex items-center mb-3">
                  <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{formatDateTime()}</div>
                    <div className="text-xs text-gray-500">
                      Duration: {BookingService.BookingUtils.formatDuration(wizardState.total_duration_minutes)}
                    </div>
                  </div>
                </div>
              )}

              {/* Customer */}
              {wizardState.customer && (
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {wizardState.customer.first_name} {wizardState.customer.last_name}
                    </div>
                    <div className="text-xs text-gray-500">{wizardState.customer.email}</div>
                    {wizardState.customer.phone && (
                      <div className="text-xs text-gray-500">{wizardState.customer.phone}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment & Options */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment & Preferences</h3>

          <div className="space-y-6">
            {/* Payment Method */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Payment Method</h4>
              <div className="space-y-3">
                <label className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment_method"
                    value="cash"
                    checked={selectedPaymentMethod === 'cash'}
                    onChange={(e) => handlePaymentMethodChange(e.target.value as any)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">Pay at Salon</div>
                    <div className="text-sm text-gray-600">
                      Pay the full amount when you arrive for your appointment
                    </div>
                    <div className="text-sm font-semibold text-green-600 mt-1">
                      {BookingService.BookingUtils.formatPrice(wizardState.total_price_cents)} due at salon
                    </div>
                  </div>
                </label>

                <label className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment_method"
                    value="deposit"
                    checked={selectedPaymentMethod === 'deposit'}
                    onChange={(e) => handlePaymentMethodChange(e.target.value as any)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">Secure Your Booking (30% Deposit)</div>
                    <div className="text-sm text-gray-600">
                      Pay a deposit now, remainder at your appointment
                    </div>
                    <div className="text-sm font-semibold text-blue-600 mt-1">
                      {BookingService.BookingUtils.formatPrice(calculateDepositAmount())} now + {BookingService.BookingUtils.formatPrice(wizardState.total_price_cents - calculateDepositAmount())} at salon
                    </div>
                  </div>
                </label>

                <label className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment_method"
                    value="full"
                    checked={selectedPaymentMethod === 'full'}
                    onChange={(e) => handlePaymentMethodChange(e.target.value as any)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">Pay in Full</div>
                    <div className="text-sm text-gray-600">
                      Pay the complete amount now and skip payment at the salon
                    </div>
                    <div className="text-sm font-semibold text-blue-600 mt-1">
                      {BookingService.BookingUtils.formatPrice(wizardState.total_price_cents)} now
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Cancellation Policy */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">Cancellation Policy</h4>
              <div className="text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Free cancellation up to 24 hours before your appointment</li>
                  <li>Cancellations within 24 hours may incur a fee</li>
                  <li>No-shows will be charged 50% of the service cost</li>
                </ul>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="space-y-3">
              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="ml-3">
                  <div className="text-sm text-gray-900">
                    I agree to the{' '}
                    <a href="/terms" className="text-blue-600 hover:text-blue-800 underline">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="/privacy" className="text-blue-600 hover:text-blue-800 underline">
                      Privacy Policy
                    </a>
                  </div>
                </div>
              </label>

              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={subscribeToMarketing}
                  onChange={(e) => setSubscribeToMarketing(e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="ml-3">
                  <div className="text-sm text-gray-900">
                    I'd like to receive promotional emails and special offers
                  </div>
                  <div className="text-xs text-gray-500">
                    You can unsubscribe at any time
                  </div>
                </div>
              </label>
            </div>

            {/* Total Amount */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-lg font-semibold text-gray-900">
                    {selectedPaymentMethod === 'cash' ? 'Total Due at Salon' :
                     selectedPaymentMethod === 'deposit' ? 'Deposit Due Now' :
                     'Total Due Now'}
                  </div>
                  {selectedPaymentMethod === 'deposit' && (
                    <div className="text-sm text-gray-600">
                      Remaining: {BookingService.BookingUtils.formatPrice(wizardState.total_price_cents - calculateDepositAmount())} at salon
                    </div>
                  )}
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {BookingService.BookingUtils.formatPrice(getPaymentAmount())}
                </div>
              </div>
            </div>

            {/* Confirm Button */}
            <button
              onClick={onConfirm}
              disabled={!canConfirm()}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${
                canConfirm()
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {selectedPaymentMethod === 'cash'
                ? 'Confirm Booking'
                : `Confirm & ${selectedPaymentMethod === 'deposit' ? 'Pay Deposit' : 'Pay Now'}`
              }
            </button>

            {!agreeToTerms && (
              <div className="text-sm text-red-600 text-center">
                Please agree to the terms and conditions to continue
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}