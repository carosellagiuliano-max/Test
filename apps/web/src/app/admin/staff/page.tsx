'use client';

import { useState } from 'react';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Award,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye
} from 'lucide-react';
import { formatCurrency, formatTime, formatDate } from '@/lib/utils';

// Mock staff data
const mockStaff = [
  {
    id: 'STAFF-001',
    firstName: 'Anna',
    lastName: 'Mueller',
    email: 'anna.mueller@salon.com',
    phone: '+41 79 111 22 33',
    role: 'senior_stylist',
    status: 'active',
    avatar: null,
    schedule: {
      monday: { start: '09:00', end: '18:00', available: true },
      tuesday: { start: '09:00', end: '18:00', available: true },
      wednesday: { start: '09:00', end: '18:00', available: true },
      thursday: { start: '09:00', end: '18:00', available: true },
      friday: { start: '09:00', end: '18:00', available: true },
      saturday: { start: '09:00', end: '16:00', available: true },
      sunday: { start: null, end: null, available: false }
    },
    specialties: ['Hair Cutting', 'Styling', 'Color Consultation'],
    stats: {
      totalAppointments: 342,
      monthlyRevenue: 28500,
      avgRating: 4.8,
      utilization: 85,
      noShows: 8
    },
    timeOff: [
      {
        id: '1',
        start: '2024-10-15',
        end: '2024-10-20',
        type: 'vacation',
        status: 'approved',
        reason: 'Annual vacation'
      }
    ],
    createdAt: '2023-01-10T10:00:00Z'
  },
  {
    id: 'STAFF-002',
    firstName: 'Tom',
    lastName: 'Fischer',
    email: 'tom.fischer@salon.com',
    phone: '+41 79 222 33 44',
    role: 'barber',
    status: 'active',
    avatar: null,
    schedule: {
      monday: { start: '10:00', end: '19:00', available: true },
      tuesday: { start: '10:00', end: '19:00', available: true },
      wednesday: { start: null, end: null, available: false },
      thursday: { start: '10:00', end: '19:00', available: true },
      friday: { start: '10:00', end: '19:00', available: true },
      saturday: { start: '10:00', end: '17:00', available: true },
      sunday: { start: null, end: null, available: false }
    },
    specialties: ['Men\'s Haircuts', 'Beard Trimming', 'Traditional Shaving'],
    stats: {
      totalAppointments: 289,
      monthlyRevenue: 18200,
      avgRating: 4.6,
      utilization: 78,
      noShows: 5
    },
    timeOff: [],
    createdAt: '2023-03-15T09:00:00Z'
  },
  {
    id: 'STAFF-003',
    firstName: 'Lisa',
    lastName: 'Weber',
    email: 'lisa.weber@salon.com',
    phone: '+41 79 333 44 55',
    role: 'color_specialist',
    status: 'active',
    avatar: null,
    schedule: {
      monday: { start: '09:00', end: '17:00', available: true },
      tuesday: { start: '09:00', end: '17:00', available: true },
      wednesday: { start: '09:00', end: '17:00', available: true },
      thursday: { start: '09:00', end: '17:00', available: true },
      friday: { start: '09:00', end: '17:00', available: true },
      saturday: { start: null, end: null, available: false },
      sunday: { start: null, end: null, available: false }
    },
    specialties: ['Hair Coloring', 'Highlights', 'Color Correction', 'Balayage'],
    stats: {
      totalAppointments: 156,
      monthlyRevenue: 31200,
      avgRating: 4.9,
      utilization: 82,
      noShows: 3
    },
    timeOff: [],
    createdAt: '2023-05-20T14:00:00Z'
  }
];

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const roleColors = {
  senior_stylist: 'bg-blue-100 text-blue-800',
  stylist: 'bg-green-100 text-green-800',
  barber: 'bg-orange-100 text-orange-800',
  color_specialist: 'bg-purple-100 text-purple-800',
  junior_stylist: 'bg-gray-100 text-gray-800'
};

interface StaffFormProps {
  staff?: any;
  onSave: (staff: any) => void;
  onCancel: () => void;
}

function StaffForm({ staff, onSave, onCancel }: StaffFormProps) {
  const [formData, setFormData] = useState(staff || {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'stylist',
    status: 'active',
    specialties: [],
    schedule: {
      monday: { start: '09:00', end: '18:00', available: true },
      tuesday: { start: '09:00', end: '18:00', available: true },
      wednesday: { start: '09:00', end: '18:00', available: true },
      thursday: { start: '09:00', end: '18:00', available: true },
      friday: { start: '09:00', end: '18:00', available: true },
      saturday: { start: '09:00', end: '16:00', available: true },
      sunday: { start: null, end: null, available: false }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: staff?.id || `STAFF-${Date.now()}`,
      createdAt: staff?.createdAt || new Date().toISOString(),
      stats: staff?.stats || {
        totalAppointments: 0,
        monthlyRevenue: 0,
        avgRating: 0,
        utilization: 0,
        noShows: 0
      },
      timeOff: staff?.timeOff || []
    });
  };

  const handleScheduleChange = (day: string, field: string, value: any) => {
    setFormData({
      ...formData,
      schedule: {
        ...formData.schedule,
        [day]: {
          ...formData.schedule[day],
          [field]: value
        }
      }
    });
  };

  const handleSpecialtyChange = (specialty: string) => {
    const specialties = formData.specialties || [];
    if (specialties.includes(specialty)) {
      setFormData({
        ...formData,
        specialties: specialties.filter((s: string) => s !== specialty)
      });
    } else {
      setFormData({
        ...formData,
        specialties: [...specialties, specialty]
      });
    }
  };

  const availableSpecialties = [
    'Hair Cutting', 'Styling', 'Hair Coloring', 'Highlights', 'Balayage',
    'Color Correction', 'Men\'s Haircuts', 'Beard Trimming', 'Traditional Shaving',
    'Perms', 'Treatments', 'Extensions', 'Updos', 'Bridal Styling'
  ];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            {staff ? 'Edit Staff Member' : 'Add New Staff Member'}
          </h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Personal Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="junior_stylist">Junior Stylist</option>
                  <option value="stylist">Stylist</option>
                  <option value="senior_stylist">Senior Stylist</option>
                  <option value="color_specialist">Color Specialist</option>
                  <option value="barber">Barber</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="on_leave">On Leave</option>
                </select>
              </div>
            </div>

            {/* Schedule */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Weekly Schedule</h4>
              <div className="space-y-3">
                {Object.entries(formData.schedule).map(([day, schedule]: [string, any]) => (
                  <div key={day} className="flex items-center space-x-4">
                    <div className="w-20">
                      <span className="text-sm font-medium capitalize">{day}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={schedule.available}
                        onChange={(e) => handleScheduleChange(day, 'available', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm">Available</span>
                    </div>
                    {schedule.available && (
                      <div className="flex items-center space-x-2">
                        <input
                          type="time"
                          value={schedule.start || ''}
                          onChange={(e) => handleScheduleChange(day, 'start', e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <span>to</span>
                        <input
                          type="time"
                          value={schedule.end || ''}
                          onChange={(e) => handleScheduleChange(day, 'end', e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Specialties */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Specialties</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {availableSpecialties.map((specialty) => (
                <div key={specialty} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.specialties?.includes(specialty) || false}
                    onChange={() => handleSpecialtyChange(specialty)}
                    className="mr-2"
                  />
                  <span className="text-sm">{specialty}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {staff ? 'Update' : 'Create'} Staff Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface StaffDetailsProps {
  staff: any;
  onClose: () => void;
  onEdit: () => void;
}

function StaffDetails({ staff, onClose, onEdit }: StaffDetailsProps) {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {staff.firstName} {staff.lastName}
              </h3>
              <p className="text-sm text-gray-500 capitalize">{staff.role.replace('_', ' ')}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onEdit}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Edit className="h-4 w-4 mr-1 inline" />
              Edit
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact & Basic Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Contact Information</h4>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm">{staff.email}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm">{staff.phone}</span>
                </div>
                <div className="flex items-center">
                  <Shield className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm capitalize">{staff.role.replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            {/* Weekly Schedule */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Weekly Schedule</h4>
              <div className="space-y-2">
                {Object.entries(staff.schedule).map(([day, schedule]: [string, any]) => (
                  <div key={day} className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{day}</span>
                    <div className="text-sm">
                      {schedule.available ? (
                        <span className="text-green-600">
                          {formatTime(`2024-01-01T${schedule.start}:00`)} - {formatTime(`2024-01-01T${schedule.end}:00`)}
                        </span>
                      ) : (
                        <span className="text-gray-500">Closed</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Specialties */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Specialties</h4>
              <div className="flex flex-wrap gap-2">
                {staff.specialties?.map((specialty: string) => (
                  <span
                    key={specialty}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            </div>

            {/* Time Off */}
            {staff.timeOff && staff.timeOff.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Upcoming Time Off</h4>
                <div className="space-y-2">
                  {staff.timeOff.map((timeOff: any) => (
                    <div key={timeOff.id} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div>
                        <p className="text-sm font-medium">{timeOff.reason}</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(timeOff.start)} - {formatDate(timeOff.end)}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        timeOff.status === 'approved' ? 'bg-green-100 text-green-800' :
                        timeOff.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {timeOff.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Performance Stats</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Appointments</span>
                  <span className="font-medium">{staff.stats.totalAppointments}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Monthly Revenue</span>
                  <span className="font-medium">{formatCurrency(staff.stats.monthlyRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg. Rating</span>
                  <span className="font-medium flex items-center">
                    {staff.stats.avgRating}
                    <Award className="h-4 w-4 text-yellow-500 ml-1" />
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Utilization</span>
                  <span className="font-medium">{staff.stats.utilization}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">No-Shows</span>
                  <span className="font-medium">{staff.stats.noShows}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h4>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 text-sm bg-white border rounded hover:bg-gray-50">
                  <Calendar className="h-4 w-4 inline mr-2" />
                  View Schedule
                </button>
                <button className="w-full text-left px-3 py-2 text-sm bg-white border rounded hover:bg-gray-50">
                  <Clock className="h-4 w-4 inline mr-2" />
                  Request Time Off
                </button>
                <button className="w-full text-left px-3 py-2 text-sm bg-white border rounded hover:bg-gray-50">
                  <Award className="h-4 w-4 inline mr-2" />
                  View Performance
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StaffPage() {
  const [staff, setStaff] = useState(mockStaff);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);

  const filteredStaff = staff.filter(member => {
    const matchesSearch =
      `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.specialties?.some((specialty: string) => specialty.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = roleFilter === 'all' || member.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const handleSaveStaff = (staffData: any) => {
    if (editingStaff) {
      setStaff(staff.map(s => s.id === staffData.id ? staffData : s));
    } else {
      setStaff([...staff, staffData]);
    }
    setShowForm(false);
    setEditingStaff(null);
  };

  const handleEditStaff = (staffMember: any) => {
    setEditingStaff(staffMember);
    setShowForm(true);
    setSelectedStaff(null);
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'inactive':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      case 'on_leave':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getRoleBadge = (role: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    const colorClass = roleColors[role as keyof typeof roleColors] || 'bg-gray-100 text-gray-800';
    return `${baseClasses} ${colorClass}`;
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Staff Management
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage staff schedules, availability, and performance
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Staff Member
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <User className="h-8 w-8 text-blue-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Staff</dt>
                  <dd className="text-lg font-medium text-gray-900">{staff.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Today</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {staff.filter(s => s.status === 'active').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-purple-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg. Utilization</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {Math.round(staff.reduce((sum, s) => sum + (s.stats?.utilization || 0), 0) / staff.length)}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Award className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg. Rating</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {(staff.reduce((sum, s) => sum + (s.stats?.avgRating || 0), 0) / staff.length).toFixed(1)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search staff..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Roles</option>
            <option value="senior_stylist">Senior Stylist</option>
            <option value="stylist">Stylist</option>
            <option value="junior_stylist">Junior Stylist</option>
            <option value="color_specialist">Color Specialist</option>
            <option value="barber">Barber</option>
          </select>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchTerm('');
              setRoleFilter('all');
            }}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map((staffMember) => (
          <div key={staffMember.id} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-medium text-gray-900">
                    {staffMember.firstName} {staffMember.lastName}
                  </h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={getRoleBadge(staffMember.role)}>
                      {staffMember.role.replace('_', ' ')}
                    </span>
                    <span className={getStatusBadge(staffMember.status)}>
                      {staffMember.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <Mail className="h-4 w-4 mr-2" />
                  {staffMember.email}
                </div>
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <Phone className="h-4 w-4 mr-2" />
                  {staffMember.phone}
                </div>
              </div>

              {/* Stats */}
              <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-lg font-medium text-gray-900">
                    {staffMember.stats.utilization}%
                  </div>
                  <div className="text-xs text-gray-500">Utilization</div>
                </div>
                <div>
                  <div className="text-lg font-medium text-gray-900">
                    {staffMember.stats.avgRating}
                  </div>
                  <div className="text-xs text-gray-500">Rating</div>
                </div>
              </div>

              {/* Specialties */}
              <div className="mt-4">
                <div className="flex flex-wrap gap-1">
                  {staffMember.specialties?.slice(0, 3).map((specialty: string) => (
                    <span
                      key={specialty}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {specialty}
                    </span>
                  ))}
                  {staffMember.specialties?.length > 3 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      +{staffMember.specialties.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={() => setSelectedStaff(staffMember)}
                  className="text-blue-600 hover:text-blue-900"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleEditStaff(staffMember)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button className="text-gray-400 hover:text-gray-600">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Staff Form Modal */}
      {showForm && (
        <StaffForm
          staff={editingStaff}
          onSave={handleSaveStaff}
          onCancel={() => {
            setShowForm(false);
            setEditingStaff(null);
          }}
        />
      )}

      {/* Staff Details Modal */}
      {selectedStaff && (
        <StaffDetails
          staff={selectedStaff}
          onClose={() => setSelectedStaff(null)}
          onEdit={() => handleEditStaff(selectedStaff)}
        />
      )}
    </div>
  );
}