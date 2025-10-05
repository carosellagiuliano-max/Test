import { BookingForm } from '@/components/booking/booking-form'

export default function BookingPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Termin buchen
          </h1>
          <p className="text-lg text-gray-600">
            Wählen Sie Ihren Wunschtermin in wenigen Schritten
          </p>
        </div>

        <BookingForm />
      </div>
    </div>
  )
}