'use client';

import React, { useState, useEffect } from 'react';
import { AppointmentWithDetails, UUID } from '@repo/types';
import { BookingService } from '../../lib/booking-service';

interface CustomerBookingManagerProps {
  customerId: UUID;
  className?: string;
}

interface BookingAction {
  type: 'cancel' | 'reschedule' | 'download_calendar' | 'view_details';
  appointment: AppointmentWithDetails;
}

export function CustomerBookingManager({
  customerId,
  className = ''
}: CustomerBookingManagerProps) {
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'upcoming' | 'past'>('upcoming');
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<BookingAction | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    loadAppointments();
  }, [customerId]);

  const loadAppointments = async () => {
    setLoading(true);
    setError(null);

    try {
      // In a real implementation, this would be an API call
      // For now, we'll use mock data
      const mockAppointments: AppointmentWithDetails[] = [
        {
          id: 'apt1',
          customer_id: customerId,
          staff_id: 'staff1',
          service_id: 'service1',
          start_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
          end_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
          status: 'confirmed',
          notes: '',
          internal_notes: '',
          price_cents: 5500,
          deposit_cents: 1650,
          duration_minutes: 60,
          no_show: false,
          payment_status: 'partial',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          customer: {
            id: customerId,
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe@example.com',
            phone: '+41 79 123 45 67'
          },
          staff: {
            id: 'staff1',
            first_name: 'Maria',
            last_name: 'Schmidt'
          },
          service: {
            id: 'service1',
            name: 'Classic Cut',
            duration_minutes: 60,
            price_cents: 5500
          }
        },
        {
          id: 'apt2',
          customer_id: customerId,
          staff_id: 'staff2',
          service_id: 'service2',
          start_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(),
          status: 'pending',
          notes: 'Looking for a new style',
          internal_notes: '',
          price_cents: 8500,
          duration_minutes: 90,
          no_show: false,
          payment_status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          customer: {
            id: customerId,
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe@example.com',
            phone: '+41 79 123 45 67'
          },
          staff: {
            id: 'staff2',
            first_name: 'Anna',
            last_name: 'Müller'
          },
          service: {
            id: 'service2',
            name: 'Premium Cut & Style',
            duration_minutes: 90,
            price_cents: 8500
          }
        },
        {
          id: 'apt3',
          customer_id: customerId,
          staff_id: 'staff1',
          service_id: 'service1',
          start_time: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
          end_time: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
          status: 'completed',
          notes: '',
          internal_notes: 'Great customer, punctual',
          price_cents: 5500,
          duration_minutes: 60,
          no_show: false,
          payment_status: 'paid',
          created_at: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          customer: {
            id: customerId,
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe@example.com',
            phone: '+41 79 123 45 67'
          },
          staff: {
            id: 'staff1',
            first_name: 'Maria',
            last_name: 'Schmidt'
          },
          service: {
            id: 'service1',
            name: 'Classic Cut',
            duration_minutes: 60,
            price_cents: 5500
          }
        }
      ];

      setAppointments(mockAppointments);

    } catch (err) {
      console.error('Error loading appointments:', err);
      setError('Failed to load appointments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getUpcomingAppointments = () => {
    return appointments.filter(apt => {
      const appointmentDate = new Date(apt.start_time);
      const now = new Date();
      return appointmentDate > now && apt.status !== 'cancelled';
    }).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  };

  const getPastAppointments = () => {
    return appointments.filter(apt => {
      const appointmentDate = new Date(apt.start_time);
      const now = new Date();
      return appointmentDate <= now || apt.status === 'cancelled' || apt.status === 'completed';
    }).sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleDateString('de-CH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-800 bg-green-100';
      case 'pending':
        return 'text-yellow-800 bg-yellow-100';
      case 'completed':
        return 'text-blue-800 bg-blue-100';
      case 'cancelled':
        return 'text-red-800 bg-red-100';
      case 'no_show':
        return 'text-gray-800 bg-gray-100';
      default:
        return 'text-gray-800 bg-gray-100';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-800 bg-green-100';
      case 'partial':
        return 'text-blue-800 bg-blue-100';
      case 'pending':
        return 'text-yellow-800 bg-yellow-100';
      case 'failed':
      case 'refunded':
        return 'text-red-800 bg-red-100';
      default:
        return 'text-gray-800 bg-gray-100';
    }
  };

  const canCancelAppointment = (appointment: AppointmentWithDetails) => {
    const appointmentTime = new Date(appointment.start_time);
    const now = new Date();
    const hoursUntilAppointment = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    return (
      appointment.status !== 'cancelled' &&
      appointment.status !== 'completed' &&
      hoursUntilAppointment >= 24
    );
  };

  const canRescheduleAppointment = (appointment: AppointmentWithDetails) => {
    const appointmentTime = new Date(appointment.start_time);
    const now = new Date();
    const hoursUntilAppointment = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    return (
      appointment.status !== 'cancelled' &&
      appointment.status !== 'completed' &&
      hoursUntilAppointment >= 4
    );
  };

  const handleAction = (type: BookingAction['type'], appointment: AppointmentWithDetails) => {
    if (type === 'download_calendar') {
      downloadCalendarEvent(appointment);
    } else {
      setSelectedAction({ type, appointment });
      setActionModalOpen(true);
    }
  };

  const downloadCalendarEvent = (appointment: AppointmentWithDetails) => {
    const mockBookingConfirmation = {
      appointment_id: appointment.id,
      booking_reference: `BK-${appointment.id.toUpperCase()}`,
      customer: appointment.customer,
      service: appointment.service,
      staff: appointment.staff,
      date_time: {
        start_time: appointment.start_time,
        end_time: appointment.end_time,
        timezone: 'Europe/Zurich',
        display_time: formatDateTime(appointment.start_time)
      },
      payment: {
        status: appointment.payment_status,
        amount_cents: appointment.price_cents,
        method: 'card'
      },
      calendar_event: {
        id: appointment.id,
        title: `${appointment.service.name} - Schnittwerk Salon`,
        start: appointment.start_time,
        end: appointment.end_time,
        description: `Appointment with ${appointment.staff.first_name} ${appointment.staff.last_name}`,
        location: 'Schnittwerk Salon',
        uid: `apt-${appointment.id}@schnittwerk.ch`,
        dtstamp: new Date().toISOString(),
        sequence: 0,
        status: 'CONFIRMED' as const
      },
      cancellation_policy: {
        hours_before: 24,
        refund_policy: 'Full refund if cancelled 24+ hours in advance'
      }
    };

    BookingService.CalendarIntegration.downloadICSFile(mockBookingConfirmation);
  };

  const executeAction = async () => {
    if (!selectedAction) return;

    setProcessingAction(true);

    try {
      switch (selectedAction.type) {
        case 'cancel':
          await BookingService.BookingManager.cancelBooking({
            appointment_id: selectedAction.appointment.id,
            reason: cancelReason || 'Customer requested cancellation',
            refund_type: 'full',
            notify_customer: false
          });

          // Update local state
          setAppointments(prev =>
            prev.map(apt =>
              apt.id === selectedAction.appointment.id
                ? { ...apt, status: 'cancelled' as any, cancelled_at: new Date().toISOString() }
                : apt
            )
          );
          break;

        case 'reschedule':
          // This would typically redirect to a reschedule flow
          console.log('Reschedule appointment:', selectedAction.appointment.id);
          break;

        default:
          break;
      }

      setActionModalOpen(false);
      setSelectedAction(null);
      setCancelReason('');

    } catch (error) {
      console.error('Action execution error:', error);
      setError('Failed to process request. Please try again.');
    } finally {
      setProcessingAction(false);
    }
  };

  const renderAppointmentCard = (appointment: AppointmentWithDetails) => (
    <div key={appointment.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{appointment.service.name}</h3>
          <p className="text-sm text-gray-600">
            with {appointment.staff.first_name} {appointment.staff.last_name}
          </p>
        </div>
        <div className="flex gap-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
          </span>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(appointment.payment_status)}`}>
            {appointment.payment_status === 'partial' ? 'Deposit Paid' : appointment.payment_status.charAt(0).toUpperCase() + appointment.payment_status.slice(1)}
          </span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {formatDateTime(appointment.start_time)}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {BookingService.BookingUtils.formatDuration(appointment.duration_minutes)}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
          {BookingService.BookingUtils.formatPrice(appointment.price_cents)}
          {appointment.deposit_cents && (
            <span className="ml-1 text-xs text-gray-500">
              (Deposit: {BookingService.BookingUtils.formatPrice(appointment.deposit_cents)})
            </span>
          )}
        </div>
        {appointment.notes && (
          <div className="flex items-start text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{appointment.notes}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-4 border-t">
        <button
          onClick={() => handleAction('download_calendar', appointment)}
          className="inline-flex items-center px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Add to Calendar
        </button>

        {selectedTab === 'upcoming' && (
          <>
            {canRescheduleAppointment(appointment) && (
              <button
                onClick={() => handleAction('reschedule', appointment)}
                className="inline-flex items-center px-3 py-1.5 text-sm text-orange-600 hover:text-orange-800 transition-colors"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Reschedule
              </button>
            )}

            {canCancelAppointment(appointment) && (
              <button
                onClick={() => handleAction('cancel', appointment)}
                className="inline-flex items-center px-3 py-1.5 text-sm text-red-600 hover:text-red-800 transition-colors"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={`customer-booking-manager ${className}`}>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading appointments...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`customer-booking-manager ${className}`}>
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={loadAppointments}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const upcomingAppointments = getUpcomingAppointments();
  const pastAppointments = getPastAppointments();

  return (
    <div className={`customer-booking-manager ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">My Appointments</h2>
        <p className="text-gray-600">Manage your upcoming and past appointments</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setSelectedTab('upcoming')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'upcoming'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Upcoming ({upcomingAppointments.length})
          </button>
          <button
            onClick={() => setSelectedTab('past')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'past'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Past ({pastAppointments.length})
          </button>
        </nav>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {selectedTab === 'upcoming' ? (
          upcomingAppointments.length > 0 ? (
            upcomingAppointments.map(renderAppointmentCard)
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming appointments</h3>
              <p className="text-gray-600 mb-4">Book your next appointment today!</p>
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Book Appointment
              </button>
            </div>
          )
        ) : (
          pastAppointments.length > 0 ? (
            pastAppointments.map(renderAppointmentCard)
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No appointment history</h3>
              <p className="text-gray-600">Your completed appointments will appear here</p>
            </div>
          )
        )}
      </div>

      {/* Action Modal */}
      {actionModalOpen && selectedAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedAction.type === 'cancel' ? 'Cancel Appointment' : 'Reschedule Appointment'}
            </h3>

            {selectedAction.type === 'cancel' && (
              <div className="space-y-4">
                <p className="text-gray-600">
                  Are you sure you want to cancel your appointment for {selectedAction.appointment.service.name} on {formatDateTime(selectedAction.appointment.start_time)}?
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for cancellation (optional)
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Please let us know why you're cancelling..."
                  />
                </div>

                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Cancellation Policy:</strong> Free cancellation up to 24 hours before your appointment.
                    {selectedAction.appointment.deposit_cents && (
                      <span className="block mt-1">
                        Your deposit of {BookingService.BookingUtils.formatPrice(selectedAction.appointment.deposit_cents)} will be refunded.
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setActionModalOpen(false);
                  setSelectedAction(null);
                  setCancelReason('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={processingAction}
              >
                Cancel
              </button>
              <button
                onClick={executeAction}
                disabled={processingAction}
                className={`px-6 py-2 text-white rounded-lg transition-colors ${
                  selectedAction.type === 'cancel'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                } disabled:opacity-50`}
              >
                {processingAction
                  ? 'Processing...'
                  : selectedAction.type === 'cancel'
                  ? 'Cancel Appointment'
                  : 'Continue to Reschedule'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}