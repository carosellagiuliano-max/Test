'use client';

import React, { useState, useEffect } from 'react';
import { Service, ServiceCategory } from '@repo/types';

interface ServiceSelectionProps {
  selectedService?: {
    id: string;
    name: string;
    duration_minutes: number;
    price_cents: number;
    description?: string;
  };
  onServiceSelect: (service: {
    id: string;
    name: string;
    duration_minutes: number;
    price_cents: number;
    description?: string;
  }) => void;
  className?: string;
}

export function ServiceSelection({
  selectedService,
  onServiceSelect,
  className = ''
}: ServiceSelectionProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadServicesAndCategories();
  }, []);

  const loadServicesAndCategories = async () => {
    try {
      setLoading(true);

      // In a real implementation, these would be API calls
      // For now, we'll use mock data
      const mockCategories: ServiceCategory[] = [
        {
          id: '1',
          name: 'Hair Cuts',
          description: 'Professional haircuts and styling',
          color: '#3B82F6',
          sort_order: 1,
          status: 'active',
          created_at: '',
          updated_at: ''
        },
        {
          id: '2',
          name: 'Hair Coloring',
          description: 'Hair coloring and highlights',
          color: '#8B5CF6',
          sort_order: 2,
          status: 'active',
          created_at: '',
          updated_at: ''
        },
        {
          id: '3',
          name: 'Hair Treatments',
          description: 'Deep conditioning and repair treatments',
          color: '#10B981',
          sort_order: 3,
          status: 'active',
          created_at: '',
          updated_at: ''
        }
      ];

      const mockServices: Service[] = [
        {
          id: '1',
          name: 'Classic Cut',
          description: 'Professional haircut with wash and blow-dry',
          duration_minutes: 60,
          price_cents: 5500,
          category_id: '1',
          status: 'active',
          requires_consultation: false,
          max_advance_booking_days: 90,
          min_advance_booking_hours: 2,
          staff_ids: ['staff1', 'staff2'],
          color: '#3B82F6',
          created_at: '',
          updated_at: ''
        },
        {
          id: '2',
          name: 'Premium Cut & Style',
          description: 'Luxury haircut with premium styling and treatment',
          duration_minutes: 90,
          price_cents: 8500,
          category_id: '1',
          status: 'active',
          requires_consultation: false,
          max_advance_booking_days: 90,
          min_advance_booking_hours: 2,
          staff_ids: ['staff1'],
          color: '#3B82F6',
          created_at: '',
          updated_at: ''
        },
        {
          id: '3',
          name: 'Full Color',
          description: 'Complete hair coloring service',
          duration_minutes: 180,
          price_cents: 12000,
          category_id: '2',
          status: 'active',
          requires_consultation: true,
          max_advance_booking_days: 90,
          min_advance_booking_hours: 4,
          staff_ids: ['staff1', 'staff2'],
          color: '#8B5CF6',
          created_at: '',
          updated_at: ''
        },
        {
          id: '4',
          name: 'Highlights',
          description: 'Partial highlights and toning',
          duration_minutes: 120,
          price_cents: 9500,
          category_id: '2',
          status: 'active',
          requires_consultation: false,
          max_advance_booking_days: 90,
          min_advance_booking_hours: 2,
          staff_ids: ['staff1', 'staff2'],
          color: '#8B5CF6',
          created_at: '',
          updated_at: ''
        },
        {
          id: '5',
          name: 'Deep Conditioning Treatment',
          description: 'Intensive moisture and repair treatment',
          duration_minutes: 45,
          price_cents: 4500,
          category_id: '3',
          status: 'active',
          requires_consultation: false,
          max_advance_booking_days: 90,
          min_advance_booking_hours: 2,
          staff_ids: ['staff1', 'staff2'],
          color: '#10B981',
          created_at: '',
          updated_at: ''
        }
      ];

      setCategories(mockCategories);
      setServices(mockServices);

    } catch (err) {
      console.error('Error loading services:', err);
      setError('Failed to load services. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (cents: number): string => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF'
    }).format(cents / 100);
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}min`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}min`;
    }
  };

  const filteredServices = selectedCategory
    ? services.filter(service => service.category_id === selectedCategory)
    : services;

  const handleServiceSelect = (service: Service) => {
    onServiceSelect({
      id: service.id,
      name: service.name,
      duration_minutes: service.duration_minutes,
      price_cents: service.price_cents,
      description: service.description
    });
  };

  if (loading) {
    return (
      <div className={`service-selection ${className}`}>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading services...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`service-selection ${className}`}>
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={loadServicesAndCategories}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`service-selection ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select a Service</h2>
        <p className="text-gray-600">Choose the service you would like to book</p>
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Services
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={{
                  backgroundColor: selectedCategory === category.id ? category.color : undefined
                }}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map(service => (
          <div
            key={service.id}
            onClick={() => handleServiceSelect(service)}
            className={`service-card p-6 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
              selectedService?.id === service.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
              {service.requires_consultation && (
                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                  Consultation Required
                </span>
              )}
            </div>

            {service.description && (
              <p className="text-gray-600 text-sm mb-4">{service.description}</p>
            )}

            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formatDuration(service.duration_minutes)}
                </div>
              </div>

              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  {formatPrice(service.price_cents)}
                </div>
              </div>
            </div>

            {selectedService?.id === service.id && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <div className="flex items-center text-blue-600 text-sm">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Selected
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
          <p className="text-gray-600">
            {selectedCategory
              ? 'No services available in this category.'
              : 'No services are currently available.'}
          </p>
        </div>
      )}
    </div>
  );
}