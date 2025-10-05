'use client';

import React, { useState, useEffect } from 'react';

interface Staff {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  specialties?: string[];
  rating?: number;
  experience_years?: number;
}

interface StaffSelectionProps {
  serviceId?: string;
  selectedStaff?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  onStaffSelect: (staff: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  }) => void;
  className?: string;
}

export function StaffSelection({
  serviceId,
  selectedStaff,
  onStaffSelect,
  className = ''
}: StaffSelectionProps) {
  const [availableStaff, setAvailableStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (serviceId) {
      loadAvailableStaff();
    }
  }, [serviceId]);

  const loadAvailableStaff = async () => {
    if (!serviceId) return;

    setLoading(true);
    setError(null);

    try {
      // In a real implementation, this would be an API call
      // For now, we'll use mock data
      const mockStaff: Staff[] = [
        {
          id: 'staff1',
          first_name: 'Maria',
          last_name: 'Schmidt',
          avatar_url: '/avatars/maria.jpg',
          specialties: ['Hair Cuts', 'Hair Coloring', 'Styling'],
          rating: 4.9,
          experience_years: 8
        },
        {
          id: 'staff2',
          first_name: 'Anna',
          last_name: 'Müller',
          avatar_url: '/avatars/anna.jpg',
          specialties: ['Hair Coloring', 'Highlights', 'Treatments'],
          rating: 4.8,
          experience_years: 6
        },
        {
          id: 'staff3',
          first_name: 'Lisa',
          last_name: 'Weber',
          avatar_url: '/avatars/lisa.jpg',
          specialties: ['Hair Cuts', 'Styling', 'Bridal'],
          rating: 4.7,
          experience_years: 5
        }
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      setAvailableStaff(mockStaff);

    } catch (err) {
      console.error('Error loading staff:', err);
      setError('Failed to load available staff. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStaffSelect = (staff: Staff) => {
    onStaffSelect({
      id: staff.id,
      first_name: staff.first_name,
      last_name: staff.last_name,
      avatar_url: staff.avatar_url
    });
  };

  const handleAnyStaffSelect = () => {
    onStaffSelect({
      id: 'any',
      first_name: 'Any',
      last_name: 'Available Staff',
      avatar_url: undefined
    });
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <svg key="half" className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
          <defs>
            <linearGradient id="half">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path fill="url(#half)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }

    return stars;
  };

  if (!serviceId) {
    return (
      <div className={`staff-selection ${className}`}>
        <div className="text-center py-12">
          <p className="text-gray-600">Please select a service first.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`staff-selection ${className}`}>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading available staff...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`staff-selection ${className}`}>
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={loadAvailableStaff}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`staff-selection ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Stylist</h2>
        <p className="text-gray-600">Select your preferred stylist or let us assign the best available</p>
      </div>

      <div className="space-y-4">
        {/* Any Available Staff Option */}
        <div
          onClick={handleAnyStaffSelect}
          className={`staff-card p-6 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
            selectedStaff?.id === 'any'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>

            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-gray-900">Any Available Stylist</h3>
              <p className="text-gray-600 text-sm mt-1">
                We'll assign the best available stylist for your appointment time
              </p>
              <div className="flex items-center mt-2">
                <span className="text-sm text-blue-600 font-medium">
                  Fastest booking • Best availability
                </span>
              </div>
            </div>

            {selectedStaff?.id === 'any' && (
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Individual Staff Members */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableStaff.map(staff => (
            <div
              key={staff.id}
              onClick={() => handleStaffSelect(staff)}
              className={`staff-card p-6 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                selectedStaff?.id === staff.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {staff.avatar_url ? (
                    <img
                      src={staff.avatar_url}
                      alt={`${staff.first_name} ${staff.last_name}`}
                      className="w-16 h-16 rounded-full object-cover"
                      onError={(e) => {
                        // Fallback to initials if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-16 h-16 bg-gradient-to-br from-pink-500 to-orange-500 rounded-full flex items-center justify-center text-white font-semibold text-lg ${staff.avatar_url ? 'hidden' : ''}`}>
                    {staff.first_name[0]}{staff.last_name[0]}
                  </div>
                </div>

                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {staff.first_name} {staff.last_name}
                  </h3>

                  {staff.rating && (
                    <div className="flex items-center mt-1">
                      <div className="flex items-center">
                        {renderStars(staff.rating)}
                      </div>
                      <span className="ml-2 text-sm text-gray-600">
                        {staff.rating} ({staff.experience_years} years)
                      </span>
                    </div>
                  )}

                  {staff.specialties && staff.specialties.length > 0 && (
                    <div className="mt-2">
                      <div className="flex flex-wrap gap-1">
                        {staff.specialties.slice(0, 3).map(specialty => (
                          <span
                            key={specialty}
                            className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full"
                          >
                            {specialty}
                          </span>
                        ))}
                        {staff.specialties.length > 3 && (
                          <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                            +{staff.specialties.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {selectedStaff?.id === staff.id && (
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {availableStaff.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No staff available</h3>
          <p className="text-gray-600">
            No staff members are currently available for this service.
          </p>
        </div>
      )}
    </div>
  );
}