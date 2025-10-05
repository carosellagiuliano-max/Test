'use client';

import React, { useState, useEffect } from 'react';
import { AvailabilityResponse, AvailabilitySlot } from '@repo/types';
import { BookingService } from '../../lib/booking-service';

interface DateTimeSelectionProps {
  serviceId?: string;
  staffId?: string;
  selectedDateTime?: {
    date: string;
    time: string;
    timezone: string;
  };
  onDateTimeSelect: (dateTime: {
    date: string;
    time: string;
    timezone: string;
  }) => void;
  className?: string;
}

export function DateTimeSelection({
  serviceId,
  staffId,
  selectedDateTime,
  onDateTimeSelect,
  className = ''
}: DateTimeSelectionProps) {
  const [selectedDate, setSelectedDate] = useState<string>(selectedDateTime?.date || '');
  const [selectedTime, setSelectedTime] = useState<string>(selectedDateTime?.time || '');
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calendarDates, setCalendarDates] = useState<Date[]>([]);

  useEffect(() => {
    generateCalendarDates();
  }, []);

  useEffect(() => {
    if (selectedDate && serviceId) {
      loadAvailability();
    }
  }, [selectedDate, serviceId, staffId]);

  useEffect(() => {
    if (selectedDate && selectedTime) {
      onDateTimeSelect({
        date: selectedDate,
        time: selectedTime,
        timezone: BookingService.TimezoneManager.SALON_TIMEZONE
      });
    }
  }, [selectedDate, selectedTime, onDateTimeSelect]);

  const generateCalendarDates = () => {
    const dates: Date[] = [];
    const today = new Date();

    // Generate next 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }

    setCalendarDates(dates);
  };

  const loadAvailability = async () => {
    if (!serviceId || !selectedDate) return;

    setLoading(true);
    setError(null);

    try {
      const availability = await BookingService.BookingManager.getAvailability({
        service_id: serviceId,
        staff_id: staffId,
        date: selectedDate
      });

      setAvailability(availability);
      setAvailableSlots(availability.slots);

      // If previously selected time is no longer available, clear it
      if (selectedTime) {
        const isStillAvailable = availability.slots.some(slot => {
          const slotTime = new Date(slot.start_time).toTimeString().substring(0, 5);
          return slotTime === selectedTime && slot.available;
        });

        if (!isStillAvailable) {
          setSelectedTime('');
        }
      }

    } catch (err) {
      console.error('Error loading availability:', err);
      setError('Failed to load availability. Please try again.');
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('de-CH', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (time: string): string => {
    return time;
  };

  const isDateDisabled = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);

    // Disable past dates and Sundays (day 0)
    return dateToCheck < today || date.getDay() === 0;
  };

  const groupSlotsByStaff = (slots: AvailabilitySlot[]) => {
    const grouped = new Map<string, AvailabilitySlot[]>();

    slots.forEach(slot => {
      if (!grouped.has(slot.staff_id)) {
        grouped.set(slot.staff_id, []);
      }
      grouped.get(slot.staff_id)!.push(slot);
    });

    return Array.from(grouped.entries()).map(([staffId, staffSlots]) => ({
      staffId,
      staffName: staffSlots[0]?.staff_name || 'Unknown Staff',
      slots: staffSlots.sort((a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      )
    }));
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  if (!serviceId) {
    return (
      <div className={`date-time-selection ${className}`}>
        <div className="text-center py-12">
          <p className="text-gray-600">Please select a service first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`date-time-selection ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Date & Time</h2>
        <p className="text-gray-600">Choose your preferred appointment date and time</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Date Selection */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Date</h3>

          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDates.slice(0, 35).map((date, index) => {
              const dateStr = date.toISOString().split('T')[0];
              const isSelected = selectedDate === dateStr;
              const isDisabled = isDateDisabled(date);

              return (
                <button
                  key={index}
                  onClick={() => !isDisabled && setSelectedDate(dateStr)}
                  disabled={isDisabled}
                  className={`
                    p-2 text-sm rounded-lg transition-colors relative
                    ${isSelected
                      ? 'bg-blue-600 text-white'
                      : isDisabled
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                    }
                  `}
                >
                  {date.getDate()}
                  {isSelected && (
                    <div className="absolute inset-0 rounded-lg border-2 border-blue-800"></div>
                  )}
                </button>
              );
            })}
          </div>

          {selectedDate && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-800">
                Selected: {new Date(selectedDate).toLocaleDateString('de-CH', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          )}
        </div>

        {/* Time Selection */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Times</h3>

          {!selectedDate ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-600">Select a date to see available times</p>
            </div>
          ) : loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading availability...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-600 mb-4">{error}</div>
              <button
                onClick={loadAvailability}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-600 mb-2">No available times for this date</p>
              {availability?.next_available && (
                <p className="text-sm text-blue-600">
                  Next available: {availability.next_available.date} at {availability.next_available.time}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {groupSlotsByStaff(availableSlots.filter(slot => slot.available)).map(({ staffId, staffName, slots }) => (
                <div key={staffId}>
                  {!staffId || staffId === 'any' || (
                    <h4 className="font-medium text-gray-800 mb-3">{staffName}</h4>
                  )}

                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {slots.map((slot, index) => {
                      const slotTime = new Date(slot.start_time).toTimeString().substring(0, 5);
                      const isSelected = selectedTime === slotTime;

                      return (
                        <button
                          key={index}
                          onClick={() => handleTimeSelect(slotTime)}
                          disabled={!slot.available}
                          className={`
                            p-2 text-sm rounded-lg border transition-colors
                            ${isSelected
                              ? 'bg-blue-600 text-white border-blue-600'
                              : slot.available
                              ? 'border-gray-300 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                              : 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
                            }
                          `}
                        >
                          {formatTime(slotTime)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedTime && selectedDate && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <div className="text-sm font-medium text-green-800">
                    Appointment Time Selected
                  </div>
                  <div className="text-sm text-green-700">
                    {new Date(`${selectedDate}T${selectedTime}`).toLocaleDateString('de-CH', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}