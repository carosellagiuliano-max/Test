'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ServiceSelection } from './service-selection'
import { StaffSelection } from './staff-selection'
import { DateTimeSelection } from './date-time-selection'
import { CustomerInfo } from './customer-info'
import { BookingSummary } from './booking-summary'
import { Button } from '@coiffeur/ui/button'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { clientDatabase, type Service, type Staff } from '@/lib/services/database.service'
import { useAuth } from '@/hooks/use-auth'
import { paymentService } from '@/lib/services/payment.service'

type BookingStep = 'service' | 'staff' | 'datetime' | 'info' | 'summary'

interface BookingData {
  service: Service | null
  staff: Staff | null
  date: Date | null
  time: string | null
  customerInfo: {
    email: string
    full_name: string
    phone: string
    notes?: string
  }
}

export function BookingForm() {
  const router = useRouter()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState<BookingStep>('service')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [bookingData, setBookingData] = useState<BookingData>({
    service: null,
    staff: null,
    date: null,
    time: null,
    customerInfo: {
      email: user?.email || '',
      full_name: '',
      phone: '',
      notes: ''
    }
  })

  const steps: BookingStep[] = ['service', 'staff', 'datetime', 'info', 'summary']
  const currentStepIndex = steps.indexOf(currentStep)

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1])
    }
  }

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1])
    }
  }

  const handleServiceSelect = (service: Service) => {
    setBookingData({ ...bookingData, service })
  }

  const handleStaffSelect = (staff: Staff | null) => {
    setBookingData({ ...bookingData, staff })
  }

  const handleDateTimeSelect = (date: Date, time: string) => {
    setBookingData({ ...bookingData, date, time })
  }

  const handleCustomerInfoSubmit = (info: BookingData['customerInfo']) => {
    setBookingData({ ...bookingData, customerInfo: info })
    handleNext()
  }

  const handleBookingSubmit = async () => {
    if (!bookingData.service || !bookingData.date || !bookingData.time) {
      setError('Bitte füllen Sie alle erforderlichen Felder aus')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Create the booking
      const startsAt = new Date(bookingData.date)
      const [hours, minutes] = bookingData.time.split(':')
      startsAt.setHours(parseInt(hours), parseInt(minutes))

      const booking = await clientDatabase.createBooking({
        staff_id: bookingData.staff?.id || '',
        service_id: bookingData.service.id,
        starts_at: startsAt.toISOString(),
        customer_data: bookingData.customerInfo,
        notes: bookingData.customerInfo.notes
      })

      // Create payment session
      if (booking.appointment_id && bookingData.service.price > 0) {
        const checkout = await paymentService.createStripeCheckout(
          booking.appointment_id,
          `${window.location.origin}/booking/success`,
          `${window.location.origin}/booking/cancel`
        )

        // Redirect to payment
        if (checkout.url) {
          window.location.href = checkout.url
        } else {
          router.push('/booking/success')
        }
      } else {
        router.push('/booking/success')
      }
    } catch (err: any) {
      console.error('Booking error:', err)
      setError(err.message || 'Ein Fehler ist aufgetreten')
    } finally {
      setLoading(false)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 'service':
        return bookingData.service !== null
      case 'staff':
        return true // Staff selection is optional
      case 'datetime':
        return bookingData.date !== null && bookingData.time !== null
      case 'info':
        return (
          bookingData.customerInfo.email !== '' &&
          bookingData.customerInfo.full_name !== '' &&
          bookingData.customerInfo.phone !== ''
        )
      default:
        return true
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex justify-between">
          {steps.map((step, index) => (
            <div
              key={step}
              className={`flex-1 ${index < steps.length - 1 ? 'mr-2' : ''}`}
            >
              <div
                className={`h-2 rounded-full ${
                  index <= currentStepIndex ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              />
              <p className="text-xs mt-1 text-center">
                {step === 'service' && 'Service'}
                {step === 'staff' && 'Mitarbeiter'}
                {step === 'datetime' && 'Datum & Zeit'}
                {step === 'info' && 'Kontaktdaten'}
                {step === 'summary' && 'Übersicht'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="mb-8">
        {currentStep === 'service' && (
          <ServiceSelection
            onSelect={handleServiceSelect}
            selectedService={bookingData.service}
          />
        )}

        {currentStep === 'staff' && bookingData.service && (
          <StaffSelection
            serviceId={bookingData.service.id}
            onSelect={handleStaffSelect}
            selectedStaff={bookingData.staff}
          />
        )}

        {currentStep === 'datetime' && bookingData.service && (
          <DateTimeSelection
            serviceId={bookingData.service.id}
            staffId={bookingData.staff?.id}
            onSelect={handleDateTimeSelect}
            selectedDate={bookingData.date}
            selectedTime={bookingData.time}
          />
        )}

        {currentStep === 'info' && (
          <CustomerInfo
            initialData={bookingData.customerInfo}
            onSubmit={handleCustomerInfoSubmit}
          />
        )}

        {currentStep === 'summary' && (
          <BookingSummary
            bookingData={bookingData}
            onConfirm={handleBookingSubmit}
            loading={loading}
            error={error}
          />
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStepIndex === 0 || loading}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Zurück
        </Button>

        {currentStep !== 'summary' && (
          <Button
            onClick={handleNext}
            disabled={!canProceed() || loading}
          >
            Weiter
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}

        {currentStep === 'summary' && (
          <Button
            onClick={handleBookingSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Buchung wird erstellt...
              </>
            ) : (
              'Buchung bestätigen'
            )}
          </Button>
        )}
      </div>
    </div>
  )
}