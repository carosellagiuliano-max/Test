import {
  AvailabilityRequest,
  AvailabilityResponse,
  BookingValidationResult,
  CreateBookingRequest,
  CancelBookingRequest,
  BookingConfirmation,
  RescheduleRequest,
  UUID,
  TimeSlot,
  AvailabilitySlot,
  BookingCalendarEvent
} from '@repo/types';

// Swiss timezone utilities
export const SALON_TIMEZONE = 'Europe/Zurich';

export class BookingError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400,
    public suggestedActions?: string[]
  ) {
    super(message);
    this.name = 'BookingError';
  }
}

export class TimezoneManager {
  static toSalonTime(date: Date | string): Date {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Date(d.toLocaleString('en-US', { timeZone: SALON_TIMEZONE }));
  }

  static toUTC(dateString: string, timezone: string = SALON_TIMEZONE): Date {
    // Parse date in the specified timezone and convert to UTC
    const tempDate = new Date(dateString);
    const offset = this.getTimezoneOffset(timezone);
    return new Date(tempDate.getTime() - offset * 60000);
  }

  static formatForDisplay(date: Date | string, timezone: string = SALON_TIMEZONE): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('de-CH', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  static getTimezoneOffset(timezone: string): number {
    const now = new Date();
    const utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
    const target = new Date(utc.toLocaleString('en-US', { timeZone: timezone }));
    return (utc.getTime() - target.getTime()) / 60000;
  }

  static isDST(date: Date, timezone: string = SALON_TIMEZONE): boolean {
    const january = new Date(date.getFullYear(), 0, 1);
    const july = new Date(date.getFullYear(), 6, 1);
    const stdOffset = Math.max(
      january.getTimezoneOffset(),
      july.getTimezoneOffset()
    );
    return date.getTimezoneOffset() < stdOffset;
  }
}

export class AvailabilityCalculator {
  static async calculateAvailableSlots(
    serviceId: UUID,
    staffId: UUID | null,
    date: string,
    daysAhead: number = 1
  ): Promise<AvailabilitySlot[]> {
    const response = await fetch('/api/bookings/availability', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: serviceId,
        staff_id: staffId,
        date,
        days_ahead: daysAhead
      })
    });

    if (!response.ok) {
      throw new BookingError(
        'Failed to calculate availability',
        'AVAILABILITY_ERROR',
        response.status
      );
    }

    return response.json();
  }

  static generateTimeSlots(
    startTime: string,
    endTime: string,
    durationMinutes: number,
    intervalMinutes: number = 15
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);

    // Subtract service duration to ensure full service fits
    const availableEnd = new Date(end.getTime() - durationMinutes * 60000);

    let current = new Date(start);
    while (current <= availableEnd) {
      slots.push({
        time: current.toTimeString().substring(0, 5), // HH:MM format
        available: true,
        staff_id: '', // Will be filled by caller
        reason: undefined
      });
      current = new Date(current.getTime() + intervalMinutes * 60000);
    }

    return slots;
  }

  static findNextAvailable(
    slots: AvailabilitySlot[],
    fromDate: Date,
    maxDaysAhead: number = 30
  ): { date: string; time: string; staff_id: UUID; staff_name: string } | null {
    // Sort slots by date and time
    const availableSlots = slots
      .filter(slot => slot.available)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    const firstAvailable = availableSlots[0];
    if (!firstAvailable) return null;

    const slotDate = new Date(firstAvailable.start_time);
    const maxDate = new Date(fromDate.getTime() + maxDaysAhead * 24 * 60 * 60 * 1000);

    if (slotDate > maxDate) return null;

    return {
      date: slotDate.toISOString().split('T')[0],
      time: slotDate.toTimeString().substring(0, 5),
      staff_id: firstAvailable.staff_id,
      staff_name: firstAvailable.staff_name
    };
  }
}

export class BookingValidator {
  static async validateBookingRequest(
    request: CreateBookingRequest
  ): Promise<BookingValidationResult> {
    const response = await fetch('/api/bookings/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new BookingError(
        'Failed to validate booking request',
        'VALIDATION_ERROR',
        response.status
      );
    }

    return response.json();
  }

  static validateDateTimeInput(dateTime: string, timezone: string = SALON_TIMEZONE): boolean {
    try {
      const date = new Date(dateTime);
      if (isNaN(date.getTime())) return false;

      const now = new Date();
      if (date <= now) return false;

      // Check if date is too far in the future (max 90 days)
      const maxDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
      if (date > maxDate) return false;

      return true;
    } catch {
      return false;
    }
  }

  static isBusinessHours(time: string, dayOfWeek: number): boolean {
    // Basic business hours validation (can be made configurable)
    const businessHours = {
      1: { start: '09:00', end: '18:00' }, // Monday
      2: { start: '09:00', end: '18:00' }, // Tuesday
      3: { start: '09:00', end: '18:00' }, // Wednesday
      4: { start: '09:00', end: '18:00' }, // Thursday
      5: { start: '09:00', end: '18:00' }, // Friday
      6: { start: '09:00', end: '16:00' }, // Saturday
      0: null // Sunday - closed
    };

    const hours = businessHours[dayOfWeek as keyof typeof businessHours];
    if (!hours) return false;

    return time >= hours.start && time <= hours.end;
  }
}

export class BookingManager {
  static async createBooking(request: CreateBookingRequest): Promise<BookingConfirmation> {
    // First validate the request
    const validation = await BookingValidator.validateBookingRequest(request);
    if (!validation.valid) {
      throw new BookingError(
        validation.errors.join(', '),
        'VALIDATION_FAILED',
        400,
        validation.errors
      );
    }

    const response = await fetch('/api/bookings/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': request.idempotency_key || crypto.randomUUID()
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new BookingError(
        error.message || 'Failed to create booking',
        error.code || 'CREATE_BOOKING_ERROR',
        response.status,
        error.suggested_actions
      );
    }

    return response.json();
  }

  static async cancelBooking(request: CancelBookingRequest): Promise<{ success: boolean; refund_amount?: number }> {
    const response = await fetch('/api/bookings/cancel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new BookingError(
        error.message || 'Failed to cancel booking',
        error.code || 'CANCEL_BOOKING_ERROR',
        response.status
      );
    }

    return response.json();
  }

  static async rescheduleBooking(request: RescheduleRequest): Promise<BookingConfirmation> {
    const response = await fetch('/api/bookings/reschedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new BookingError(
        error.message || 'Failed to reschedule booking',
        error.code || 'RESCHEDULE_BOOKING_ERROR',
        response.status
      );
    }

    return response.json();
  }

  static async getAvailability(request: AvailabilityRequest): Promise<AvailabilityResponse> {
    const params = new URLSearchParams({
      service_id: request.service_id,
      date: request.date,
      ...(request.staff_id && { staff_id: request.staff_id }),
      ...(request.duration_minutes && { duration_minutes: request.duration_minutes.toString() })
    });

    const response = await fetch(`/api/bookings/availability?${params}`);

    if (!response.ok) {
      throw new BookingError(
        'Failed to get availability',
        'AVAILABILITY_ERROR',
        response.status
      );
    }

    return response.json();
  }
}

export class CalendarIntegration {
  static generateICSEvent(booking: BookingConfirmation): string {
    const event = booking.calendar_event;
    const startDate = new Date(event.start);
    const endDate = new Date(event.end);

    const formatDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Schnittwerk Salon//Booking System//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${event.uid}`,
      `DTSTAMP:${event.dtstamp}`,
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description || ''}`,
      `LOCATION:${event.location || 'Schnittwerk Salon'}`,
      `STATUS:${event.status}`,
      `SEQUENCE:${event.sequence}`,
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Appointment reminder',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    return icsContent;
  }

  static downloadICSFile(booking: BookingConfirmation): void {
    const icsContent = this.generateICSEvent(booking);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `appointment-${booking.booking_reference}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  static generateGoogleCalendarUrl(booking: BookingConfirmation): string {
    const event = booking.calendar_event;
    const startDate = new Date(event.start);
    const endDate = new Date(event.end);

    const formatGoogleDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const baseUrl = 'https://calendar.google.com/calendar/render';
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
      details: event.description || '',
      location: event.location || 'Schnittwerk Salon',
      sf: 'true',
      output: 'xml'
    });

    return `${baseUrl}?${params.toString()}`;
  }

  static generateOutlookCalendarUrl(booking: BookingConfirmation): string {
    const event = booking.calendar_event;
    const startDate = new Date(event.start);
    const endDate = new Date(event.end);

    const baseUrl = 'https://outlook.live.com/calendar/0/deeplink/compose';
    const params = new URLSearchParams({
      subject: event.title,
      startdt: startDate.toISOString(),
      enddt: endDate.toISOString(),
      body: event.description || '',
      location: event.location || 'Schnittwerk Salon'
    });

    return `${baseUrl}?${params.toString()}`;
  }
}

export class BookingUtils {
  static generateBookingReference(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `BK-${timestamp}-${random}`.toUpperCase();
  }

  static formatPrice(cents: number, currency: string = 'CHF'): string {
    const amount = cents / 100;
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  static formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}min`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}min`;
    }
  }

  static getTimeDifference(dateTime1: string, dateTime2: string): {
    hours: number;
    minutes: number;
    isPast: boolean;
  } {
    const date1 = new Date(dateTime1);
    const date2 = new Date(dateTime2);
    const diffMs = date2.getTime() - date1.getTime();
    const isPast = diffMs < 0;
    const absDiffMs = Math.abs(diffMs);

    const hours = Math.floor(absDiffMs / (1000 * 60 * 60));
    const minutes = Math.floor((absDiffMs % (1000 * 60 * 60)) / (1000 * 60));

    return { hours, minutes, isPast };
  }

  static canCancelBooking(appointmentTime: string, cancellationPolicyHours: number = 24): boolean {
    const timeDiff = this.getTimeDifference(new Date().toISOString(), appointmentTime);
    return !timeDiff.isPast && timeDiff.hours >= cancellationPolicyHours;
  }

  static canRescheduleBooking(appointmentTime: string, rescheduleMinHours: number = 4): boolean {
    const timeDiff = this.getTimeDifference(new Date().toISOString(), appointmentTime);
    return !timeDiff.isPast && timeDiff.hours >= rescheduleMinHours;
  }
}

// Export all utilities as a single object for easier importing
export const BookingService = {
  TimezoneManager,
  AvailabilityCalculator,
  BookingValidator,
  BookingManager,
  CalendarIntegration,
  BookingUtils,
  BookingError
};