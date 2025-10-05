'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@coiffeur/ui/card'
import { Button } from '@coiffeur/ui/button'
import { Badge } from '@coiffeur/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@coiffeur/ui/tabs'
import { Clock, ChevronRight } from 'lucide-react'
import { clientDatabase, type Service, type ServiceCategory } from '@/lib/services/database.service'

interface ServiceSelectionProps {
  onSelect: (service: Service) => void
  selectedService?: Service | null
}

export function ServiceSelection({ onSelect, selectedService }: ServiceSelectionProps) {
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string>('all')

  useEffect(() => {
    async function fetchServices() {
      try {
        setLoading(true)
        const [servicesData, categoriesData] = await Promise.all([
          clientDatabase.getServices(),
          clientDatabase.getServiceCategories()
        ])
        setServices(servicesData)
        setCategories(categoriesData)
        if (categoriesData.length > 0) {
          setActiveCategory(categoriesData[0].id)
        }
      } catch (error) {
        console.error('Error fetching services:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchServices()
  }, [])

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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Service wählen</CardTitle>
          <CardDescription>Laden...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const filteredServices = activeCategory === 'all'
    ? services
    : services.filter(s => s.category_id === activeCategory)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Service wählen</CardTitle>
        <CardDescription>
          Wählen Sie den gewünschten Service aus
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="grid w-full grid-cols-4">
            {categories.map((category) => (
              <TabsTrigger key={category.id} value={category.id}>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id} className="space-y-4">
              {filteredServices
                .filter(service => service.category_id === category.id)
                .map((service) => (
                  <div
                    key={service.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedService?.id === service.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => onSelect(service)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-lg">{service.name}</h3>
                        {service.description && (
                          <p className="text-gray-600 text-sm mt-1">
                            {service.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="h-4 w-4 mr-1" />
                            {formatDuration(service.duration_minutes)}
                          </div>
                          {service.requires_consultation && (
                            <Badge variant="secondary">Beratung erforderlich</Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-xl font-semibold">{formatPrice(service.price)}</p>
                        {selectedService?.id === service.id && (
                          <ChevronRight className="h-5 w-5 text-blue-500 ml-auto mt-2" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </TabsContent>
          ))}
        </Tabs>

        {selectedService && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-900">Ausgewählter Service:</p>
            <p className="text-lg font-semibold text-blue-900">{selectedService.name}</p>
            <p className="text-sm text-blue-700">
              {formatDuration(selectedService.duration_minutes)} • {formatPrice(selectedService.price)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}