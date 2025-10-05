'use client';

import { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  User,
  ShieldCheck,
  MoreVertical,
  UserPlus,
  History,
  Star,
  AlertCircle
} from 'lucide-react';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';

// Mock customer data - in real app, this would come from Supabase
const mockCustomers = [
  {
    id: 'CUST-001',
    firstName: 'Maria',
    lastName: 'Schmidt',
    email: 'maria.schmidt@email.com',
    phone: '+41 79 123 45 67',
    dateOfBirth: '1985-03-15',
    address: {
      street: 'Bahnhofstrasse 123',
      city: 'Zurich',
      postalCode: '8001',
      country: 'Switzerland'
    },
    status: 'active',
    preferences: {
      notifications: true,
      marketing: true,
      language: 'de'
    },
    stats: {
      totalVisits: 24,
      totalSpent: 120000, // in cents
      lastVisit: '2024-10-02T14:30:00Z',
      avgSpent: 5000,
      noShows: 1,
      cancellations: 2
    },
    tags: ['VIP', 'Regular'],
    notes: 'Prefers afternoon appointments, allergic to certain chemicals',
    createdAt: '2023-01-15T10:00:00Z',
    gdprConsent: true,
    marketingConsent: true
  },
  {
    id: 'CUST-002',
    firstName: 'Hans',
    lastName: 'Weber',
    email: 'hans.weber@email.com',
    phone: '+41 79 234 56 78',
    dateOfBirth: '1978-08-22',
    address: {
      street: 'Limmatstrasse 45',
      city: 'Zurich',
      postalCode: '8005',
      country: 'Switzerland'
    },
    status: 'active',
    preferences: {
      notifications: true,
      marketing: false,
      language: 'de'
    },
    stats: {
      totalVisits: 8,
      totalSpent: 28000,
      lastVisit: '2024-09-28T11:00:00Z',
      avgSpent: 3500,
      noShows: 0,
      cancellations: 1
    },
    tags: ['New'],
    notes: 'First-time customer, referred by Maria Schmidt',
    createdAt: '2024-06-01T09:00:00Z',
    gdprConsent: true,
    marketingConsent: false
  },
  {
    id: 'CUST-003',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@email.com',
    phone: '+41 79 345 67 89',
    dateOfBirth: '1992-12-03',
    address: {
      street: 'Seestrasse 789',
      city: 'Zurich',
      postalCode: '8008',
      country: 'Switzerland'
    },
    status: 'active',
    preferences: {
      notifications: true,
      marketing: true,
      language: 'en'
    },
    stats: {
      totalVisits: 12,
      totalSpent: 84000,
      lastVisit: '2024-10-01T16:00:00Z',
      avgSpent: 7000,
      noShows: 0,
      cancellations: 0
    },
    tags: ['Premium', 'Color Specialist'],
    notes: 'Prefers complex coloring treatments, very reliable',
    createdAt: '2023-08-10T14:00:00Z',
    gdprConsent: true,
    marketingConsent: true
  }
];

const recentAppointments = [
  {
    id: 'APT-001',
    customerId: 'CUST-001',
    service: 'Haircut & Styling',
    staff: 'Anna Mueller',
    date: '2024-10-02T14:30:00Z',
    status: 'completed',
    amount: 8500
  },
  {
    id: 'APT-002',
    customerId: 'CUST-002',
    service: 'Beard Trim',
    staff: 'Tom Fischer',
    date: '2024-09-28T11:00:00Z',
    status: 'completed',
    amount: 3500
  }
];

interface CustomerFormProps {
  customer?: any;
  onSave: (customer: any) => void;
  onCancel: () => void;
}

function CustomerForm({ customer, onSave, onCancel }: CustomerFormProps) {
  const [formData, setFormData] = useState(customer || {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: {
      street: '',
      city: '',
      postalCode: '',
      country: 'Switzerland'
    },
    preferences: {
      notifications: true,
      marketing: false,
      language: 'de'
    },
    notes: '',
    tags: []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: customer?.id || `CUST-${Date.now()}`,
      status: 'active',
      createdAt: customer?.createdAt || new Date().toISOString(),
      gdprConsent: true,
      marketingConsent: formData.preferences.marketing
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            {customer ? 'Edit Customer' : 'Add New Customer'}
          </h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <Trash2 className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Personal Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Address</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  value={formData.address?.street || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: {...formData.address, street: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={formData.address?.city || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: {...formData.address, city: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={formData.address?.postalCode || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: {...formData.address, postalCode: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Preferences</h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.preferences?.notifications || false}
                  onChange={(e) => setFormData({
                    ...formData,
                    preferences: {...formData.preferences, notifications: e.target.checked}
                  })}
                  className="mr-2"
                />
                <label className="text-sm text-gray-700">Email notifications</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.preferences?.marketing || false}
                  onChange={(e) => setFormData({
                    ...formData,
                    preferences: {...formData.preferences, marketing: e.target.checked}
                  })}
                  className="mr-2"
                />
                <label className="text-sm text-gray-700">Marketing communications</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Language
                </label>
                <select
                  value={formData.preferences?.language || 'de'}
                  onChange={(e) => setFormData({
                    ...formData,
                    preferences: {...formData.preferences, language: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="de">German</option>
                  <option value="en">English</option>
                  <option value="fr">French</option>
                  <option value="it">Italian</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Additional notes about the customer..."
            />
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
              {customer ? 'Update' : 'Create'} Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface CustomerDetailsProps {
  customer: any;
  onClose: () => void;
  onEdit: () => void;
}

function CustomerDetails({ customer, onClose, onEdit }: CustomerDetailsProps) {
  const customerAppointments = recentAppointments.filter(apt => apt.customerId === customer.id);

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
                {customer.firstName} {customer.lastName}
              </h3>
              <p className="text-sm text-gray-500">{customer.email}</p>
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
          {/* Customer Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Contact Information</h4>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm">{customer.email}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm">{customer.phone || 'Not provided'}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm">
                    {customer.address ?
                      `${customer.address.street}, ${customer.address.city} ${customer.address.postalCode}` :
                      'Not provided'
                    }
                  </span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm">
                    Born: {customer.dateOfBirth ? formatDate(customer.dateOfBirth) : 'Not provided'}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Appointments */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Appointments</h4>
              {customerAppointments.length > 0 ? (
                <div className="space-y-3">
                  {customerAppointments.map((appointment) => (
                    <div key={appointment.id} className="bg-white p-3 rounded border">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">{appointment.service}</p>
                          <p className="text-sm text-gray-600">with {appointment.staff}</p>
                          <p className="text-xs text-gray-500">{formatDateTime(appointment.date)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm">{formatCurrency(appointment.amount)}</p>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                            appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {appointment.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No recent appointments</p>
              )}
            </div>

            {/* Notes */}
            {customer.notes && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Notes</h4>
                <p className="text-sm text-gray-700">{customer.notes}</p>
              </div>
            )}
          </div>

          {/* Stats and Tags */}
          <div className="space-y-6">
            {/* Customer Stats */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Statistics</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Visits</span>
                  <span className="font-medium">{customer.stats.totalVisits}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Spent</span>
                  <span className="font-medium">{formatCurrency(customer.stats.totalSpent)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg. per Visit</span>
                  <span className="font-medium">{formatCurrency(customer.stats.avgSpent)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Last Visit</span>
                  <span className="font-medium">{formatDate(customer.stats.lastVisit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">No-Shows</span>
                  <span className="font-medium">{customer.stats.noShows}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Cancellations</span>
                  <span className="font-medium">{customer.stats.cancellations}</span>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {customer.tags?.map((tag: string) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* GDPR Compliance */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Privacy & Consent</h4>
              <div className="space-y-2">
                <div className="flex items-center">
                  <ShieldCheck className={`h-4 w-4 mr-2 ${customer.gdprConsent ? 'text-green-500' : 'text-red-500'}`} />
                  <span className="text-sm">GDPR Consent: {customer.gdprConsent ? 'Given' : 'Not given'}</span>
                </div>
                <div className="flex items-center">
                  <Mail className={`h-4 w-4 mr-2 ${customer.marketingConsent ? 'text-green-500' : 'text-red-500'}`} />
                  <span className="text-sm">Marketing: {customer.marketingConsent ? 'Allowed' : 'Declined'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState(mockCustomers);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch =
      `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm) ||
      customer.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleSaveCustomer = (customerData: any) => {
    if (editingCustomer) {
      setCustomers(customers.map(c => c.id === customerData.id ? customerData : c));
    } else {
      setCustomers([...customers, customerData]);
    }
    setShowForm(false);
    setEditingCustomer(null);
  };

  const handleEditCustomer = (customer: any) => {
    setEditingCustomer(customer);
    setShowForm(true);
    setSelectedCustomer(null);
  };

  const handleDeleteCustomer = (customerId: string) => {
    if (confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      setCustomers(customers.filter(c => c.id !== customerId));
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'inactive':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      case 'blocked':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Customer Management
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage customer information, history, and preferences
          </p>
        </div>
        <div className="mt-4 flex space-x-3 md:mt-0 md:ml-4">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Customers</dt>
                  <dd className="text-lg font-medium text-gray-900">{customers.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserPlus className="h-8 w-8 text-green-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">New This Month</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {customers.filter(c => new Date(c.createdAt) > new Date('2024-09-01')).length}
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
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">VIP Customers</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {customers.filter(c => c.tags?.includes('VIP')).length}
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
                <DollarSign className="h-8 w-8 text-purple-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg. Lifetime Value</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(Math.round(customers.reduce((sum, c) => sum + (c.stats?.totalSpent || 0), 0) / customers.length))}
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
              placeholder="Search customers..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="blocked">Blocked</option>
          </select>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
            }}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Filter className="h-4 w-4 mr-2" />
            Clear
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stats
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Visit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {customer.firstName} {customer.lastName}
                        </div>
                        <div className="text-sm text-gray-500">ID: {customer.id}</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {customer.tags?.map((tag: string) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">{customer.email}</div>
                      <div className="text-sm text-gray-500">{customer.phone || 'No phone'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {customer.stats?.totalVisits || 0} visits
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatCurrency(customer.stats?.totalSpent || 0)} total
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getStatusBadge(customer.status)}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.stats?.lastVisit ? formatDate(customer.stats.lastVisit) : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedCustomer(customer)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditCustomer(customer)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCustomer(customer.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Form Modal */}
      {showForm && (
        <CustomerForm
          customer={editingCustomer}
          onSave={handleSaveCustomer}
          onCancel={() => {
            setShowForm(false);
            setEditingCustomer(null);
          }}
        />
      )}

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <CustomerDetails
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onEdit={() => handleEditCustomer(selectedCustomer)}
        />
      )}
    </div>
  );
}