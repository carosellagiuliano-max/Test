'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@coiffeur/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@coiffeur/ui/avatar'
import { Badge } from '@coiffeur/ui/badge'
import { clientDatabase, type Staff } from '@/lib/services/database.service'
import { User } from 'lucide-react'

interface StaffSelectionProps {
  serviceId: string
  onSelect: (staff: Staff) => void
  selectedStaff?: Staff | null
}

export function StaffSelection({ serviceId, onSelect, selectedStaff }: StaffSelectionProps) {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStaff() {
      try {
        setLoading(true)
        const data = await clientDatabase.getStaff()
        setStaff(data)
      } catch (error) {
        console.error('Error fetching staff:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStaff()
  }, [serviceId])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mitarbeiter wählen</CardTitle>
          <CardDescription>Laden...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mitarbeiter wählen</CardTitle>
        <CardDescription>
          Wählen Sie Ihren bevorzugten Mitarbeiter
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        {staff.map((member) => (
          <div
            key={member.id}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              selectedStaff?.id === member.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onSelect(member)}
          >
            <div className="flex items-start space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={member.avatar_url || undefined} alt={member.full_name} />
                <AvatarFallback>
                  <User className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{member.full_name}</h3>
                {member.bio && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {member.bio}
                  </p>
                )}
                {member.specialties && member.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {member.specialties.slice(0, 3).map((specialty) => (
                      <Badge key={specialty} variant="secondary" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Option for no preference */}
        <div
          className={`p-4 border rounded-lg cursor-pointer transition-all ${
            selectedStaff === null
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => onSelect(null as any)}
        >
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <User className="h-12 w-12 mx-auto text-gray-400" />
              <h3 className="font-semibold text-lg mt-2">Keine Präferenz</h3>
              <p className="text-sm text-gray-600 mt-1">
                Nächster verfügbarer Mitarbeiter
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}