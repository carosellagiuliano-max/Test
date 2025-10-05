'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@coiffeur/ui/card'
import { Button } from '@coiffeur/ui/button'
import { Calendar } from '@coiffeur/ui/calendar'
import { Badge } from '@coiffeur/ui/badge'
import { clientDatabase } from '@/lib/services/database.service'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Clock, Loader2 } from 'lucide-react'

interface DateTimeSelectionProps {
  serviceId: string
  staffId?: string
  onSelect: (date: Date, time: string) => void
  selectedDate?: Date | null
  selectedTime?: string | null
}

export function DateTimeSelection({
  serviceId,
  staffId,
  onSelect,
  selectedDate,
  selectedTime
}: DateTimeSelectionProps) {
  const [date, setDate] = useState<Date | undefined>(selectedDate || undefined)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(selectedTime || null)

  useEffect(() => {
    if (date) {
      fetchAvailableSlots(date)
    }
  }, [date, serviceId, staffId])

  const fetchAvailableSlots = async (selectedDate: Date) => {
    setLoading(true)
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const slots = await clientDatabase.getAvailableSlots(
        staffId || '',
        serviceId,
        dateStr
      )
      setAvailableSlots(slots)
    } catch (error) {
      console.error('Error fetching slots:', error)
      setAvailableSlots([])
    } finally {
      setLoading(false)
    }
  }

  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate)
    setSelectedSlot(null) // Reset time selection when date changes
  }

  const handleTimeSelect = (time: string) => {
    setSelectedSlot(time)
    if (date) {
      onSelect(date, time)
    }
  }

  // Disable past dates and Sundays
  const isDateDisabled = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today || date.getDay() === 0 // Sunday is 0
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Datum wählen</CardTitle>
          <CardDescription>
            Wählen Sie Ihren Wunschtermin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            disabled={isDateDisabled}
            locale={de}
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Zeit wählen</CardTitle>
          <CardDescription>
            {date
              ? `Verfügbare Zeiten am ${format(date, 'dd. MMMM yyyy', { locale: de })}`
              : 'Bitte wählen Sie zuerst ein Datum'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!date && (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Bitte wählen Sie zuerst ein Datum</p>
            </div>
          )}

          {date && loading && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="mt-2 text-sm text-gray-500">Verfügbare Zeiten werden geladen...</p>
            </div>
          )}

          {date && !loading && availableSlots.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>Keine verfügbaren Zeiten an diesem Tag</p>
              <p className="text-sm mt-2">Bitte wählen Sie einen anderen Tag</p>
            </div>
          )}

          {date && !loading && availableSlots.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {availableSlots.map((slot) => (
                <Button
                  key={slot}
                  variant={selectedSlot === slot ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTimeSelect(slot)}
                  className="w-full"
                >
                  {slot}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}