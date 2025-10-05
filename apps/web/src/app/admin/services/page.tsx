'use client';

import { useState } from 'react';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Clock,
  DollarSign,
  Tag,
  Image,
  MoreVertical,
  Upload,
  Download,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

// Mock services data
const mockServices = [
  {
    id: 'SRV-001',
    name: 'Haircut & Styling',
    description: 'Professional haircut with styling and finishing touches',
    category: 'Hair Services',
    duration: 60,
    price: 8500,
    isActive: true,
    image: null,
    requirements: ['Consultation', 'Hair wash'],
    tags: ['Popular', 'Unisex'],
    staff: ['Anna Mueller', 'Tom Fischer', 'Marc Klein'],
    stats: {
      totalBookings: 342,
      monthlyRevenue: 290700,
      avgRating: 4.8,
      popularityRank: 1
    },
    createdAt: '2023-01-01T10:00:00Z'
  },
  {
    id: 'SRV-002',
    name: 'Hair Coloring',
    description: 'Full color transformation including consultation and aftercare',
    category: 'Color Services',
    duration: 120,
    price: 12000,
    isActive: true,
    image: null,
    requirements: ['Color consultation', 'Patch test 48h before', 'Hair wash'],
    tags: ['Premium', 'Color Specialist'],
    staff: ['Lisa Weber', 'Anna Mueller'],
    stats: {
      totalBookings: 156,
      monthlyRevenue: 187200,
      avgRating: 4.9,
      popularityRank: 2
    },
    createdAt: '2023-01-01T10:00:00Z'
  },
  {
    id: 'SRV-003',
    name: 'Beard Trim',
    description: 'Professional beard trimming and shaping',
    category: 'Men\'s Services',
    duration: 30,
    price: 3500,
    isActive: true,
    image: null,
    requirements: ['Consultation'],
    tags: ['Men Only', 'Quick Service'],
    staff: ['Tom Fischer'],
    stats: {
      totalBookings: 289,
      monthlyRevenue: 101150,
      avgRating: 4.6,
      popularityRank: 3
    },
    createdAt: '2023-01-01T10:00:00Z'
  },
  {
    id: 'SRV-004',
    name: 'Hair Treatment',
    description: 'Deep conditioning and repair treatment for damaged hair',
    category: 'Treatment Services',
    duration: 45,
    price: 6500,
    isActive: true,
    image: null,
    requirements: ['Hair analysis', 'Hair wash'],
    tags: ['Repair', 'Conditioning'],
    staff: ['Lisa Weber', 'Anna Mueller'],
    stats: {
      totalBookings: 89,
      monthlyRevenue: 57850,
      avgRating: 4.7,
      popularityRank: 4
    },
    createdAt: '2023-02-15T10:00:00Z'
  },
  {
    id: 'SRV-005',
    name: 'Bridal Styling',
    description: 'Complete bridal hair and makeup package',
    category: 'Special Occasions',
    duration: 180,
    price: 25000,
    isActive: false,
    image: null,
    requirements: ['Trial session required', 'Advanced booking', 'Deposit required'],
    tags: ['Premium', 'Special Event', 'Bridal'],
    staff: ['Anna Mueller', 'Lisa Weber'],
    stats: {
      totalBookings: 12,
      monthlyRevenue: 30000,
      avgRating: 5.0,
      popularityRank: 5
    },
    createdAt: '2023-03-01T10:00:00Z'
  }
];

const categories = ['Hair Services', 'Color Services', 'Men\'s Services', 'Treatment Services', 'Special Occasions'];

interface ServiceFormProps {
  service?: any;
  onSave: (service: any) => void;
  onCancel: () => void;
}

function ServiceForm({ service, onSave, onCancel }: ServiceFormProps) {
  const [formData, setFormData] = useState(service || {
    name: '',
    description: '',
    category: 'Hair Services',
    duration: 60,
    price: 0,
    isActive: true,
    requirements: [],
    tags: []
  });

  const [newRequirement, setNewRequirement] = useState('');
  const [newTag, setNewTag] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: service?.id || `SRV-${Date.now()}`,
      price: formData.price * 100, // Convert to cents
      createdAt: service?.createdAt || new Date().toISOString(),
      stats: service?.stats || {
        totalBookings: 0,
        monthlyRevenue: 0,
        avgRating: 0,
        popularityRank: 999
      }
    });
  };

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setFormData({
        ...formData,
        requirements: [...(formData.requirements || []), newRequirement.trim()]
      });
      setNewRequirement('');
    }
  };

  const removeRequirement = (index: number) => {
    setFormData({
      ...formData,
      requirements: formData.requirements.filter((_: any, i: number) => i !== index)
    });
  };

  const addTag = () => {
    if (newTag.trim()) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), newTag.trim()]
      });
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((_: any, i: number) => i !== index)
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            {service ? 'Edit Service' : 'Add New Service'}
          </h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <Trash2 className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Describe what this service includes..."
            />
          </div>

          {/* Duration and Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (minutes) *
              </label>
              <input
                type="number"
                required
                min="15"
                step="15"
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (CHF) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.50"
                value={service ? formData.price / 100 : formData.price}
                onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
              className="mr-2"
            />
            <label className="text-sm text-gray-700">Service is active and available for booking</label>
          </div>

          {/* Requirements */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Requirements
            </label>
            <div className="space-y-2">
              {formData.requirements?.map((req: string, index: number) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <span className="text-sm">{req}</span>
                  <button
                    type="button"
                    onClick={() => removeRequirement(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newRequirement}
                  onChange={(e) => setNewRequirement(e.target.value)}
                  placeholder="Add a requirement..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={addRequirement}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {formData.tags?.map((tag: string, index: number) => (
                  <div key={index} className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(index)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
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
              {service ? 'Update' : 'Create'} Service
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ServiceDetailsProps {
  service: any;
  onClose: () => void;
  onEdit: () => void;
}

function ServiceDetails({ service, onClose, onEdit }: ServiceDetailsProps) {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">{service.name}</h3>
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

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Service Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600">Category:</span>
                <p className="font-medium">{service.category}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Duration:</span>
                <p className="font-medium">{service.duration} minutes</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Price:</span>
                <p className="font-medium">{formatCurrency(service.price)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  service.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {service.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            {service.description && (
              <div className="mt-3">
                <span className="text-sm text-gray-600">Description:</span>
                <p className="mt-1">{service.description}</p>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Performance Stats</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600">Total Bookings:</span>
                <p className="font-medium">{service.stats.totalBookings}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Monthly Revenue:</span>
                <p className="font-medium">{formatCurrency(service.stats.monthlyRevenue)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Average Rating:</span>
                <p className="font-medium">{service.stats.avgRating}/5.0</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Popularity Rank:</span>
                <p className="font-medium">#{service.stats.popularityRank}</p>
              </div>
            </div>
          </div>

          {/* Requirements */}
          {service.requirements && service.requirements.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Requirements</h4>
              <ul className="list-disc list-inside space-y-1">
                {service.requirements.map((req: string, index: number) => (
                  <li key={index} className="text-sm">{req}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Tags */}
          {service.tags && service.tags.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {service.tags.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Staff */}
          {service.staff && service.staff.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Available Staff</h4>
              <div className="space-y-1">
                {service.staff.map((staffName: string, index: number) => (
                  <p key={index} className="text-sm">{staffName}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ServicesPage() {
  const [services, setServices] = useState(mockServices);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedService, setSelectedService] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);

  const filteredServices = services.filter(service => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && service.isActive) ||
      (statusFilter === 'inactive' && !service.isActive);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleSaveService = (serviceData: any) => {
    if (editingService) {
      setServices(services.map(s => s.id === serviceData.id ? serviceData : s));
    } else {
      setServices([...services, serviceData]);
    }
    setShowForm(false);
    setEditingService(null);
  };

  const handleEditService = (service: any) => {
    setEditingService(service);
    setShowForm(true);
    setSelectedService(null);
  };

  const handleToggleStatus = (serviceId: string) => {
    setServices(services.map(s =>
      s.id === serviceId ? { ...s, isActive: !s.isActive } : s
    ));
  };

  const handleDeleteService = (serviceId: string) => {
    if (confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      setServices(services.filter(s => s.id !== serviceId));
    }
  };

  const getCategoryStats = () => {
    const stats: any = {};
    categories.forEach(cat => {
      const categoryServices = services.filter(s => s.category === cat && s.isActive);
      stats[cat] = {
        count: categoryServices.length,
        revenue: categoryServices.reduce((sum, s) => sum + (s.stats?.monthlyRevenue || 0), 0)
      };
    });
    return stats;
  };

  const categoryStats = getCategoryStats();

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Service Management
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your salon services, pricing, and availability
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
            Add Service
          </button>
        </div>
      </div>

      {/* Category Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {categories.map(category => (
          <div key={category} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Tag className="h-6 w-6 text-blue-500" />
                </div>
                <div className="ml-3 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{category}</dt>
                    <dd className="text-lg font-medium text-gray-900">{categoryStats[category]?.count || 0}</dd>
                    <dd className="text-xs text-gray-500">
                      {formatCurrency(categoryStats[category]?.revenue || 0)}/month
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search services..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('all');
              setStatusFilter('all');
            }}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => (
          <div key={service.id} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 truncate">{service.name}</h3>
                <button
                  onClick={() => handleToggleStatus(service.id)}
                  className={`${service.isActive ? 'text-green-600' : 'text-gray-400'} hover:opacity-75`}
                >
                  {service.isActive ? (
                    <ToggleRight className="h-6 w-6" />
                  ) : (
                    <ToggleLeft className="h-6 w-6" />
                  )}
                </button>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Tag className="h-4 w-4 mr-2" />
                  {service.category}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  {service.duration} minutes
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <DollarSign className="h-4 w-4 mr-2" />
                  {formatCurrency(service.price)}
                </div>
              </div>

              {service.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{service.description}</p>
              )}

              {/* Tags */}
              {service.tags && service.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {service.tags.slice(0, 3).map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                    </span>
                  ))}
                  {service.tags.length > 3 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      +{service.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Stats */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-lg font-medium text-gray-900">
                      {service.stats.totalBookings}
                    </div>
                    <div className="text-xs text-gray-500">Bookings</div>
                  </div>
                  <div>
                    <div className="text-lg font-medium text-gray-900">
                      {service.stats.avgRating}
                    </div>
                    <div className="text-xs text-gray-500">Rating</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={() => setSelectedService(service)}
                  className="text-blue-600 hover:text-blue-900"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleEditService(service)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteService(service.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button className="text-gray-400 hover:text-gray-600">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Service Form Modal */}
      {showForm && (
        <ServiceForm
          service={editingService}
          onSave={handleSaveService}
          onCancel={() => {
            setShowForm(false);
            setEditingService(null);
          }}
        />
      )}

      {/* Service Details Modal */}
      {selectedService && (
        <ServiceDetails
          service={selectedService}
          onClose={() => setSelectedService(null)}
          onEdit={() => handleEditService(selectedService)}
        />
      )}
    </div>
  );
}