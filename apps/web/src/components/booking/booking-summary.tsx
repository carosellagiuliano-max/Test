'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@coiffeur/ui/card'
import { Alert, AlertDescription } from '@coiffeur/ui/alert'
import { Badge } from '@coiffeur/ui/badge'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Calendar, Clock, User, Mail, Phone, CreditCard, AlertCircle } from 'lucide-react'
import type { Service, Staff } from '@/lib/services/database.service'

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

interface BookingSummaryProps {
  bookingData: BookingData
  onConfirm: () => void
  loading?: boolean
  error?: string | null
}

export function BookingSummary({ bookingData, error }: BookingSummaryProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF'
    }).format(price)
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}min` : ''}`
    }
    return `${mins}min`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Buchungsübersicht</CardTitle>
        <CardDescription>
          Bitte überprüfen Sie Ihre Angaben
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Service Details */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-gray-500">Service</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-medium">{bookingData.service?.name}</p>
            {bookingData.service?.description && (
              <p className="text-sm text-gray-600 mt-1">
                {bookingData.service.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center text-sm">
                <Clock className="h-4 w-4 mr-1 text-gray-400" />
                {bookingData.service && formatDuration(bookingData.service.duration_minutes)}
              </div>
              <Badge variant="secondary">
                {bookingData.service && formatPrice(bookingData.service.price)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Staff */}
        {bookingData.staff && (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-gray-500">Mitarbeiter</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 text-gray-400" />
                <p className="font-medium">{bookingData.staff.full_name}</p>
              </div>
            </div>
          </div>
        )}

        {/* Date and Time */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-gray-500">Termin</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
              <p className="font-medium">
                {bookingData.date && format(bookingData.date, 'EEEE, dd. MMMM yyyy', { locale: de })}
              </p>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-gray-400" />
              <p className="font-medium">{bookingData.time} Uhr</p>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-gray-500">Kontaktdaten</h3>
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2 text-gray-400" />
              <p>{bookingData.customerInfo.full_name}</p>
            </div>
            <div className="flex items-center">
              <Mail className="h-4 w-4 mr-2 text-gray-400" />
              <p>{bookingData.customerInfo.email}</p>
            </div>
            <div className="flex items-center">
              <Phone className="h-4 w-4 mr-2 text-gray-400" />
              <p>{bookingData.customerInfo.phone}</p>
            </div>
            {bookingData.customerInfo.notes && (
              <div className="pt-2 border-t">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Bemerkungen:</span> {bookingData.customerInfo.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Information */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-gray-500">Zahlung</h3>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <CreditCard className="h-4 w-4 mr-2 text-blue-600" />
                <p className="font-medium">Gesamtbetrag</p>
              </div>
              <p className="text-xl font-bold text-blue-600">
                {bookingData.service && formatPrice(bookingData.service.price)}
              </p>
            </div>
            <p className="text-sm text-blue-700">
              Sie werden nach der Buchung zur sicheren Zahlung weitergeleitet
            </p>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="bg-amber-50 p-4 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>Stornierungsbedingungen:</strong> Termine können bis zu 24 Stunden vor dem
            Termin kostenlos storniert werden. Bei späterer Stornierung oder Nichterscheinen
            wird der volle Betrag fällig.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}