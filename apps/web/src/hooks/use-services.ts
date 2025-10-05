import { useEffect, useState } from 'react'
import { clientDatabase, type Service, type ServiceCategory } from '@/lib/services/database.service'

export function useServices() {
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

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
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchServices()
  }, [])

  return { services, categories, loading, error }
}

export function useServicesByCategory(categoryId?: string) {
  const { services, ...rest } = useServices()

  const filteredServices = categoryId
    ? services.filter(s => s.category_id === categoryId)
    : services

  return { services: filteredServices, ...rest }
}