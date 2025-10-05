'use client';

import { useState } from 'react';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Upload,
  Download,
  MoreVertical,
  Image as ImageIcon,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

// Mock products data
const mockProducts = [
  {
    id: 'PROD-001',
    name: 'Premium Shampoo',
    description: 'Professional grade shampoo for all hair types',
    category: 'Hair Care',
    brand: 'SalonPro',
    sku: 'SP-SHAM-001',
    price: 2500, // in cents
    costPrice: 1200,
    stock: {
      current: 45,
      minimum: 10,
      maximum: 100
    },
    isActive: true,
    images: [],
    tags: ['Professional', 'Best Seller'],
    stats: {
      totalSold: 234,
      monthlyRevenue: 58500,
      profitMargin: 52,
      popularityRank: 1
    },
    supplier: {
      name: 'Beauty Supply Co.',
      contact: 'orders@beautysupply.ch',
      leadTime: 7
    },
    createdAt: '2023-01-01T10:00:00Z'
  },
  {
    id: 'PROD-002',
    name: 'Hair Styling Gel',
    description: 'Strong hold styling gel with natural finish',
    category: 'Styling',
    brand: 'StyleMaster',
    sku: 'SM-GEL-002',
    price: 1800,
    costPrice: 900,
    stock: {
      current: 23,
      minimum: 15,
      maximum: 50
    },
    isActive: true,
    images: [],
    tags: ['Men\'s Products', 'Strong Hold'],
    stats: {
      totalSold: 156,
      monthlyRevenue: 28080,
      profitMargin: 50,
      popularityRank: 2
    },
    supplier: {
      name: 'Style Products Inc.',
      contact: 'info@styleproducts.com',
      leadTime: 14
    },
    createdAt: '2023-01-15T10:00:00Z'
  },
  {
    id: 'PROD-003',
    name: 'Hair Oil Treatment',
    description: 'Nourishing oil treatment for dry and damaged hair',
    category: 'Treatments',
    brand: 'NatureCare',
    sku: 'NC-OIL-003',
    price: 3200,
    costPrice: 1600,
    stock: {
      current: 8,
      minimum: 10,
      maximum: 30
    },
    isActive: true,
    images: [],
    tags: ['Natural', 'Treatment', 'Low Stock'],
    stats: {
      totalSold: 89,
      monthlyRevenue: 28480,
      profitMargin: 50,
      popularityRank: 3
    },
    supplier: {
      name: 'Natural Beauty Ltd.',
      contact: 'sales@naturalbeauty.ch',
      leadTime: 10
    },
    createdAt: '2023-02-01T10:00:00Z'
  },
  {
    id: 'PROD-004',
    name: 'Color Protection Conditioner',
    description: 'Specially formulated conditioner for color-treated hair',
    category: 'Hair Care',
    brand: 'ColorGuard',
    sku: 'CG-COND-004',
    price: 2800,
    costPrice: 1400,
    stock: {
      current: 0,
      minimum: 12,
      maximum: 40
    },
    isActive: false,
    images: [],
    tags: ['Color Care', 'Out of Stock'],
    stats: {
      totalSold: 67,
      monthlyRevenue: 18760,
      profitMargin: 50,
      popularityRank: 4
    },
    supplier: {
      name: 'Color Specialists Co.',
      contact: 'orders@colorspec.com',
      leadTime: 21
    },
    createdAt: '2023-03-01T10:00:00Z'
  }
];

const categories = ['Hair Care', 'Styling', 'Treatments', 'Tools', 'Accessories'];

interface ProductFormProps {
  product?: any;
  onSave: (product: any) => void;
  onCancel: () => void;
}

function ProductForm({ product, onSave, onCancel }: ProductFormProps) {
  const [formData, setFormData] = useState(product || {
    name: '',
    description: '',
    category: 'Hair Care',
    brand: '',
    sku: '',
    price: 0,
    costPrice: 0,
    stock: {
      current: 0,
      minimum: 5,
      maximum: 50
    },
    isActive: true,
    tags: [],
    supplier: {
      name: '',
      contact: '',
      leadTime: 7
    }
  });

  const [newTag, setNewTag] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: product?.id || `PROD-${Date.now()}`,
      price: formData.price * 100, // Convert to cents
      costPrice: formData.costPrice * 100,
      createdAt: product?.createdAt || new Date().toISOString(),
      stats: product?.stats || {
        totalSold: 0,
        monthlyRevenue: 0,
        profitMargin: Math.round(((formData.price - formData.costPrice) / formData.price) * 100),
        popularityRank: 999
      }
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

  const profitMargin = formData.price > 0 ? Math.round(((formData.price - formData.costPrice) / formData.price) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            {product ? 'Edit Product' : 'Add New Product'}
          </h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Product Information</h4>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
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
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({...formData, brand: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SKU *
                </label>
                <input
                  type="text"
                  required
                  value={formData.sku}
                  onChange={(e) => setFormData({...formData, sku: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Pricing and Stock */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Pricing & Inventory</h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Selling Price (CHF) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.50"
                    value={product ? formData.price / 100 : formData.price}
                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost Price (CHF) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.50"
                    value={product ? formData.costPrice / 100 : formData.costPrice}
                    onChange={(e) => setFormData({...formData, costPrice: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded">
                <span className="text-sm text-gray-600">Profit Margin: </span>
                <span className={`font-medium ${profitMargin > 30 ? 'text-green-600' : profitMargin > 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {profitMargin}%
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Stock *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stock.current}
                    onChange={(e) => setFormData({
                      ...formData,
                      stock: {...formData.stock, current: parseInt(e.target.value)}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Stock *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stock.minimum}
                    onChange={(e) => setFormData({
                      ...formData,
                      stock: {...formData.stock, minimum: parseInt(e.target.value)}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Stock *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stock.maximum}
                    onChange={(e) => setFormData({
                      ...formData,
                      stock: {...formData.stock, maximum: parseInt(e.target.value)}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="mr-2"
                />
                <label className="text-sm text-gray-700">Product is active and available for sale</label>
              </div>
            </div>
          </div>

          {/* Supplier Information */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Supplier Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier Name
                </label>
                <input
                  type="text"
                  value={formData.supplier.name}
                  onChange={(e) => setFormData({
                    ...formData,
                    supplier: {...formData.supplier, name: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={formData.supplier.contact}
                  onChange={(e) => setFormData({
                    ...formData,
                    supplier: {...formData.supplier, contact: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lead Time (days)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.supplier.leadTime}
                  onChange={(e) => setFormData({
                    ...formData,
                    supplier: {...formData.supplier, leadTime: parseInt(e.target.value)}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
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
              {product ? 'Update' : 'Create'} Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ProductDetailsProps {
  product: any;
  onClose: () => void;
  onEdit: () => void;
}

function ProductDetails({ product, onClose, onEdit }: ProductDetailsProps) {
  const profitMargin = Math.round(((product.price - product.costPrice) / product.price) * 100);
  const stockStatus = product.stock.current <= product.stock.minimum ? 'low' :
                     product.stock.current === 0 ? 'out' : 'good';

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Product Information */}
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Product Information</h4>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-600">SKU:</span>
                  <p className="font-medium">{product.sku}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Category:</span>
                  <p className="font-medium">{product.category}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Brand:</span>
                  <p className="font-medium">{product.brand}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {product.description && (
                  <div>
                    <span className="text-sm text-gray-600">Description:</span>
                    <p className="mt-1">{product.description}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Pricing</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Selling Price:</span>
                  <span className="font-medium">{formatCurrency(product.price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Cost Price:</span>
                  <span className="font-medium">{formatCurrency(product.costPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Profit Margin:</span>
                  <span className={`font-medium ${profitMargin > 30 ? 'text-green-600' : profitMargin > 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {profitMargin}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Supplier</h4>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-600">Name:</span>
                  <p className="font-medium">{product.supplier.name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Contact:</span>
                  <p className="font-medium">{product.supplier.contact}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Lead Time:</span>
                  <p className="font-medium">{product.supplier.leadTime} days</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stock and Performance */}
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Stock Status</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Current Stock:</span>
                  <div className="flex items-center">
                    <span className="font-medium mr-2">{product.stock.current}</span>
                    {stockStatus === 'out' && <XCircle className="h-4 w-4 text-red-500" />}
                    {stockStatus === 'low' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                    {stockStatus === 'good' && <CheckCircle className="h-4 w-4 text-green-500" />}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Minimum Stock:</span>
                  <span className="font-medium">{product.stock.minimum}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Maximum Stock:</span>
                  <span className="font-medium">{product.stock.maximum}</span>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Stock Level</span>
                    <span>{Math.round((product.stock.current / product.stock.maximum) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        stockStatus === 'out' ? 'bg-red-500' :
                        stockStatus === 'low' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${(product.stock.current / product.stock.maximum) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Performance Stats</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Sold:</span>
                  <span className="font-medium">{product.stats.totalSold}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Monthly Revenue:</span>
                  <span className="font-medium">{formatCurrency(product.stats.monthlyRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Popularity Rank:</span>
                  <span className="font-medium">#{product.stats.popularityRank}</span>
                </div>
              </div>
            </div>

            {product.tags && product.tags.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag: string, index: number) => (
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState(mockProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;

    let matchesStock = true;
    if (stockFilter === 'low') {
      matchesStock = product.stock.current <= product.stock.minimum;
    } else if (stockFilter === 'out') {
      matchesStock = product.stock.current === 0;
    } else if (stockFilter === 'good') {
      matchesStock = product.stock.current > product.stock.minimum;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  const handleSaveProduct = (productData: any) => {
    if (editingProduct) {
      setProducts(products.map(p => p.id === productData.id ? productData : p));
    } else {
      setProducts([...products, productData]);
    }
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setShowForm(true);
    setSelectedProduct(null);
  };

  const handleToggleStatus = (productId: string) => {
    setProducts(products.map(p =>
      p.id === productId ? { ...p, isActive: !p.isActive } : p
    ));
  };

  const getStockStatus = (product: any) => {
    if (product.stock.current === 0) return { status: 'out', color: 'text-red-600', icon: XCircle };
    if (product.stock.current <= product.stock.minimum) return { status: 'low', color: 'text-yellow-600', icon: AlertTriangle };
    return { status: 'good', color: 'text-green-600', icon: CheckCircle };
  };

  const getTotalValue = () => {
    return products.reduce((sum, p) => sum + (p.price * p.stock.current), 0);
  };

  const getLowStockCount = () => {
    return products.filter(p => p.stock.current <= p.stock.minimum).length;
  };

  const getOutOfStockCount = () => {
    return products.filter(p => p.stock.current === 0).length;
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Product Management
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage inventory, pricing, and product information
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
            Add Product
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-8 w-8 text-blue-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Products</dt>
                  <dd className="text-lg font-medium text-gray-900">{products.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Low Stock</dt>
                  <dd className="text-lg font-medium text-gray-900">{getLowStockCount()}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Out of Stock</dt>
                  <dd className="text-lg font-medium text-gray-900">{getOutOfStockCount()}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Value</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatCurrency(getTotalValue())}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
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
              placeholder="Search products..."
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

          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Stock Levels</option>
            <option value="good">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('all');
              setStockFilter('all');
            }}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => {
                const stockInfo = getStockStatus(product);
                const IconComponent = stockInfo.icon;

                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center mr-4">
                          <ImageIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                          <div className="text-sm text-gray-500">{product.brand}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(product.price)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Cost: {formatCurrency(product.costPrice)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`text-sm font-medium ${stockInfo.color}`}>
                          {product.stock.current}
                        </span>
                        <IconComponent className={`h-4 w-4 ml-2 ${stockInfo.color}`} />
                      </div>
                      <div className="text-xs text-gray-500">
                        Min: {product.stock.minimum}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(product.id)}
                        className="flex items-center"
                      >
                        {product.isActive ? (
                          <ToggleRight className="h-6 w-6 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedProduct(product)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <ProductForm
          product={editingProduct}
          onSave={handleSaveProduct}
          onCancel={() => {
            setShowForm(false);
            setEditingProduct(null);
          }}
        />
      )}

      {/* Product Details Modal */}
      {selectedProduct && (
        <ProductDetails
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onEdit={() => handleEditProduct(selectedProduct)}
        />
      )}
    </div>
  );
}