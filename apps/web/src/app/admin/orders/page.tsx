'use client';

import { useState } from 'react';
import {
  Search,
  Filter,
  Eye,
  CreditCard,
  Smartphone,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Download,
  Plus,
  MoreVertical
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import SumUpPayment, { SumUpWebhookHandler } from '@/components/admin/SumUpPayment';

// Mock data - in real app, this would come from APIs
const mockOrders = [
  {
    id: 'ORD-001',
    customer: {
      name: 'Maria Schmidt',
      email: 'maria.schmidt@email.com',
      phone: '+41 79 123 45 67'
    },
    items: [
      { id: '1', name: 'Haircut & Styling', quantity: 1, price: 8500 },
      { id: '2', name: 'Hair Products Set', quantity: 1, price: 4500 }
    ],
    total: 13000,
    status: 'pending_payment',
    paymentMethod: null,
    paymentStatus: 'pending',
    createdAt: '2024-10-04T09:00:00Z',
    appointmentId: 'APT-001',
    staff: 'Anna Mueller',
    notes: 'Customer requested natural look'
  },
  {
    id: 'ORD-002',
    customer: {
      name: 'Hans Weber',
      email: 'hans.weber@email.com',
      phone: '+41 79 234 56 78'
    },
    items: [
      { id: '3', name: 'Beard Trim', quantity: 1, price: 3500 }
    ],
    total: 3500,
    status: 'completed',
    paymentMethod: 'sumup',
    paymentStatus: 'paid',
    createdAt: '2024-10-04T10:30:00Z',
    appointmentId: 'APT-002',
    staff: 'Tom Fischer',
    notes: null
  },
  {
    id: 'ORD-003',
    customer: {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      phone: '+41 79 345 67 89'
    },
    items: [
      { id: '4', name: 'Hair Coloring', quantity: 1, price: 12000 },
      { id: '5', name: 'Conditioning Treatment', quantity: 1, price: 2500 }
    ],
    total: 14500,
    status: 'in_progress',
    paymentMethod: 'stripe',
    paymentStatus: 'paid',
    createdAt: '2024-10-04T11:00:00Z',
    appointmentId: 'APT-003',
    staff: 'Lisa Weber',
    notes: 'Color consultation completed'
  }
];

interface OrderDetailsProps {
  order: any;
  onClose: () => void;
  onProcessPayment: (orderId: string, method: 'stripe' | 'sumup') => void;
}

function OrderDetails({ order, onClose, onProcessPayment }: OrderDetailsProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Order Details - {order.id}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Information */}
          <div className="space-y-6">
            {/* Customer Info */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Customer Information</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium">{order.customer.name}</p>
                <p className="text-sm text-gray-600">{order.customer.email}</p>
                <p className="text-sm text-gray-600">{order.customer.phone}</p>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Order Items</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-3">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium">{formatCurrency(item.price)}</p>
                    </div>
                  ))}
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between items-center font-medium">
                      <span>Total</span>
                      <span>{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Service Details */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Service Details</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><span className="font-medium">Appointment:</span> {order.appointmentId}</p>
                <p><span className="font-medium">Staff:</span> {order.staff}</p>
                <p><span className="font-medium">Date:</span> {formatDateTime(order.createdAt)}</p>
                {order.notes && (
                  <p><span className="font-medium">Notes:</span> {order.notes}</p>
                )}
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="space-y-6">
            {/* Order Status */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Order Status</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  {getStatusIcon(order.status)}
                  <span className="ml-2 font-medium capitalize">{order.status.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center">
                  {getPaymentStatusIcon(order.paymentStatus)}
                  <span className="ml-2 text-sm">Payment: {order.paymentStatus}</span>
                </div>
              </div>
            </div>

            {/* Payment Actions */}
            {order.paymentStatus === 'pending' && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Process Payment</h4>
                <div className="space-y-3">
                  <button
                    onClick={() => onProcessPayment(order.id, 'sumup')}
                    className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Smartphone className="h-5 w-5 mr-2" />
                    Collect with SumUp
                  </button>
                  <button
                    onClick={() => onProcessPayment(order.id, 'stripe')}
                    className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    <CreditCard className="h-5 w-5 mr-2" />
                    Process with Stripe
                  </button>
                </div>
              </div>
            )}

            {/* Payment History */}
            {order.paymentMethod && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Payment Information</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    {order.paymentMethod === 'sumup' ? (
                      <Smartphone className="h-5 w-5 text-blue-500 mr-2" />
                    ) : (
                      <CreditCard className="h-5 w-5 text-green-500 mr-2" />
                    )}
                    <span className="font-medium capitalize">{order.paymentMethod}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Processed: {formatDateTime(order.createdAt)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Amount: {formatCurrency(order.total)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <Download className="h-4 w-4 mr-2 inline" />
            Download Receipt
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  const filteredOrders = mockOrders.filter(order => {
    const matchesSearch =
      order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || order.paymentStatus === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  const handleProcessPayment = (orderId: string, method: 'stripe' | 'sumup') => {
    const order = mockOrders.find(o => o.id === orderId);
    if (order && method === 'sumup') {
      setShowPaymentModal({
        order,
        method
      });
    } else {
      // Handle Stripe payment
      console.log('Processing Stripe payment for order:', orderId);
    }
    setSelectedOrder(null);
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'in_progress':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'pending_payment':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'cancelled':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getPaymentBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case 'paid':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'failed':
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
            Order Management
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage orders, process payments, and track fulfillment
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </button>
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
              placeholder="Search orders, customers..."
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
            <option value="pending_payment">Pending Payment</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Payment Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Payments</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
          </select>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setPaymentFilter('all');
            }}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Filter className="h-4 w-4 mr-2" />
            Clear
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.id}</div>
                      <div className="text-sm text-gray-500">{order.appointmentId}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.customer.name}</div>
                      <div className="text-sm text-gray-500">{order.customer.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(order.total)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getStatusBadge(order.status)}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={getPaymentBadge(order.paymentStatus)}>
                        {order.paymentStatus}
                      </span>
                      {order.paymentMethod && (
                        <div className="ml-2">
                          {order.paymentMethod === 'sumup' ? (
                            <Smartphone className="h-4 w-4 text-blue-500" />
                          ) : (
                            <CreditCard className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDateTime(order.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {order.paymentStatus === 'pending' && (
                        <button
                          onClick={() => handleProcessPayment(order.id, 'sumup')}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Smartphone className="h-4 w-4" />
                        </button>
                      )}
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

      {/* SumUp Webhook Handler */}
      <div className="mt-8">
        <SumUpWebhookHandler />
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetails
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onProcessPayment={handleProcessPayment}
        />
      )}

      {/* SumUp Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-8 mx-auto p-5 border max-w-md shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Process Payment</h3>
              <button
                onClick={() => setShowPaymentModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <SumUpPayment
              orderId={showPaymentModal.order.id}
              amount={showPaymentModal.order.total}
              description={`Payment for ${showPaymentModal.order.id}`}
              customerName={showPaymentModal.order.customer.name}
              onPaymentSuccess={(paymentId) => {
                console.log('Payment successful:', paymentId);
                setShowPaymentModal(null);
                // Update order status in real app
              }}
              onPaymentError={(error) => {
                console.error('Payment error:', error);
                // Handle payment error
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}