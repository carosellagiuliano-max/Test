'use client';

import { useState } from 'react';
import {
  Search,
  Filter,
  Download,
  Eye,
  Clock,
  User,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  FileText,
  Shield,
  Database,
  CreditCard,
  Users,
  Settings
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

// Mock audit log data
const mockAuditLogs = [
  {
    id: 'AUDIT-001',
    timestamp: '2024-10-04T14:30:25Z',
    userId: 'USER-001',
    userName: 'Anna Mueller',
    userRole: 'admin',
    action: 'CREATE',
    resource: 'appointment',
    resourceId: 'APT-123',
    details: {
      description: 'Created new appointment for Maria Schmidt',
      changes: {
        customer_id: 'CUST-001',
        service_id: 'SRV-001',
        staff_id: 'STAFF-001',
        start_time: '2024-10-05T10:00:00Z',
        end_time: '2024-10-05T11:00:00Z'
      }
    },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    severity: 'info',
    category: 'booking'
  },
  {
    id: 'AUDIT-002',
    timestamp: '2024-10-04T14:15:12Z',
    userId: 'USER-002',
    userName: 'Tom Fischer',
    userRole: 'staff',
    action: 'UPDATE',
    resource: 'customer',
    resourceId: 'CUST-001',
    details: {
      description: 'Updated customer phone number',
      changes: {
        phone: {
          old: '+41 79 123 45 67',
          new: '+41 79 123 45 68'
        }
      }
    },
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    severity: 'info',
    category: 'customer_management'
  },
  {
    id: 'AUDIT-003',
    timestamp: '2024-10-04T13:45:33Z',
    userId: 'USER-001',
    userName: 'Anna Mueller',
    userRole: 'admin',
    action: 'DELETE',
    resource: 'service',
    resourceId: 'SRV-999',
    details: {
      description: 'Deleted outdated service "Old Hair Treatment"',
      changes: {
        name: 'Old Hair Treatment',
        price: 5000,
        duration: 45
      }
    },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    severity: 'warning',
    category: 'service_management'
  },
  {
    id: 'AUDIT-004',
    timestamp: '2024-10-04T13:30:18Z',
    userId: 'SYSTEM',
    userName: 'System',
    userRole: 'system',
    action: 'PAYMENT_PROCESSED',
    resource: 'payment',
    resourceId: 'PAY-456',
    details: {
      description: 'SumUp payment processed successfully',
      changes: {
        amount: 8500,
        currency: 'CHF',
        payment_method: 'sumup',
        transaction_id: 'SUMUP-789123'
      }
    },
    ipAddress: '192.168.1.102',
    userAgent: 'SumUp-Webhook/1.0',
    severity: 'info',
    category: 'payment'
  },
  {
    id: 'AUDIT-005',
    timestamp: '2024-10-04T12:15:44Z',
    userId: 'USER-003',
    userName: 'Lisa Weber',
    userRole: 'staff',
    action: 'LOGIN_FAILED',
    resource: 'auth',
    resourceId: null,
    details: {
      description: 'Failed login attempt - incorrect password',
      changes: {
        email: 'lisa.weber@salon.com',
        reason: 'invalid_credentials'
      }
    },
    ipAddress: '192.168.1.103',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    severity: 'error',
    category: 'authentication'
  },
  {
    id: 'AUDIT-006',
    timestamp: '2024-10-04T11:45:22Z',
    userId: 'USER-001',
    userName: 'Anna Mueller',
    userRole: 'admin',
    action: 'SETTINGS_UPDATE',
    resource: 'settings',
    resourceId: 'business_hours',
    details: {
      description: 'Updated business hours for Saturday',
      changes: {
        saturday_hours: {
          old: { start: '09:00', end: '18:00' },
          new: { start: '09:00', end: '16:00' }
        }
      }
    },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    severity: 'info',
    category: 'settings'
  },
  {
    id: 'AUDIT-007',
    timestamp: '2024-10-04T10:30:15Z',
    userId: 'USER-001',
    userName: 'Anna Mueller',
    userRole: 'admin',
    action: 'DATA_EXPORT',
    resource: 'customers',
    resourceId: null,
    details: {
      description: 'Exported customer data to CSV',
      changes: {
        export_type: 'csv',
        record_count: 1247,
        date_range: '2024-01-01 to 2024-10-04'
      }
    },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    severity: 'warning',
    category: 'data_export'
  }
];

const actionIcons = {
  CREATE: CheckCircle,
  UPDATE: Activity,
  DELETE: XCircle,
  LOGIN_FAILED: AlertTriangle,
  PAYMENT_PROCESSED: CreditCard,
  SETTINGS_UPDATE: Settings,
  DATA_EXPORT: Database
};

const categoryIcons = {
  booking: Calendar,
  customer_management: Users,
  service_management: Activity,
  payment: CreditCard,
  authentication: Shield,
  settings: Settings,
  data_export: Database
};

const severityColors = {
  info: 'bg-blue-100 text-blue-800',
  warning: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  critical: 'bg-red-200 text-red-900'
};

interface AuditDetailsProps {
  log: any;
  onClose: () => void;
}

function AuditDetails({ log, onClose }: AuditDetailsProps) {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Audit Log Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Basic Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Event Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600">Timestamp:</span>
                <p className="font-medium">{formatDateTime(log.timestamp)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Event ID:</span>
                <p className="font-medium font-mono text-sm">{log.id}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Action:</span>
                <p className="font-medium">{log.action}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Resource:</span>
                <p className="font-medium">{log.resource}</p>
              </div>
              {log.resourceId && (
                <div>
                  <span className="text-sm text-gray-600">Resource ID:</span>
                  <p className="font-medium font-mono text-sm">{log.resourceId}</p>
                </div>
              )}
              <div>
                <span className="text-sm text-gray-600">Severity:</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${severityColors[log.severity as keyof typeof severityColors]}`}>
                  {log.severity}
                </span>
              </div>
            </div>
          </div>

          {/* User Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-3">User Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600">User:</span>
                <p className="font-medium">{log.userName}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Role:</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {log.userRole}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-600">IP Address:</span>
                <p className="font-medium font-mono text-sm">{log.ipAddress}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">User Agent:</span>
                <p className="text-sm text-gray-700 break-all">{log.userAgent}</p>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Event Details</h4>
            <div>
              <span className="text-sm text-gray-600">Description:</span>
              <p className="mt-1">{log.details.description}</p>
            </div>

            {log.details.changes && (
              <div className="mt-4">
                <span className="text-sm text-gray-600">Changes:</span>
                <pre className="mt-2 p-3 bg-white border rounded text-sm overflow-x-auto">
                  {JSON.stringify(log.details.changes, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AuditPage() {
  const [logs, setLogs] = useState(mockAuditLogs);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;
    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;

    let matchesDate = true;
    if (dateRange !== 'all') {
      const logDate = new Date(log.timestamp);
      const now = new Date();
      const dayInMs = 24 * 60 * 60 * 1000;

      switch (dateRange) {
        case '1d':
          matchesDate = (now.getTime() - logDate.getTime()) <= dayInMs;
          break;
        case '7d':
          matchesDate = (now.getTime() - logDate.getTime()) <= 7 * dayInMs;
          break;
        case '30d':
          matchesDate = (now.getTime() - logDate.getTime()) <= 30 * dayInMs;
          break;
      }
    }

    return matchesSearch && matchesAction && matchesCategory && matchesSeverity && matchesDate;
  });

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'User', 'Action', 'Resource', 'Resource ID', 'Description', 'Severity', 'IP Address'].join(','),
      ...filteredLogs.map(log => [
        log.timestamp,
        log.userName,
        log.action,
        log.resource,
        log.resourceId || '',
        `"${log.details.description}"`,
        log.severity,
        log.ipAddress
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getActionIcon = (action: string) => {
    const IconComponent = actionIcons[action as keyof typeof actionIcons] || Activity;
    return IconComponent;
  };

  const getCategoryIcon = (category: string) => {
    const IconComponent = categoryIcons[category as keyof typeof categoryIcons] || FileText;
    return IconComponent;
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Audit Log
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Track all system activities and user actions for security and compliance
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            onClick={exportLogs}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-8 w-8 text-blue-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Events</dt>
                  <dd className="text-lg font-medium text-gray-900">{logs.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-green-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Today's Events</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {logs.filter(log => {
                      const logDate = new Date(log.timestamp);
                      const today = new Date();
                      return logDate.toDateString() === today.toDateString();
                    }).length}
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
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Warnings</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {logs.filter(log => log.severity === 'warning').length}
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
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Errors</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {logs.filter(log => log.severity === 'error' || log.severity === 'critical').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search logs..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="LOGIN_FAILED">Login Failed</option>
            <option value="PAYMENT_PROCESSED">Payment Processed</option>
            <option value="SETTINGS_UPDATE">Settings Update</option>
            <option value="DATA_EXPORT">Data Export</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="booking">Booking</option>
            <option value="customer_management">Customer Management</option>
            <option value="service_management">Service Management</option>
            <option value="payment">Payment</option>
            <option value="authentication">Authentication</option>
            <option value="settings">Settings</option>
            <option value="data_export">Data Export</option>
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Severities</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="critical">Critical</option>
          </select>

          {/* Date Range Filter */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Time</option>
            <option value="1d">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchTerm('');
              setActionFilter('all');
              setCategoryFilter('all');
              setSeverityFilter('all');
              setDateRange('all');
            }}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Filter className="h-4 w-4 mr-2" />
            Clear
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User & Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resource
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log) => {
                const ActionIcon = getActionIcon(log.action);
                const CategoryIcon = getCategoryIcon(log.category);

                return (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{log.userName}</div>
                          <div className="flex items-center text-sm text-gray-500">
                            <ActionIcon className="h-3 w-3 mr-1" />
                            {log.action}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CategoryIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{log.resource}</div>
                          {log.resourceId && (
                            <div className="text-sm text-gray-500 font-mono">{log.resourceId}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {log.details.description}
                      </div>
                      <div className="text-sm text-gray-500">{log.ipAddress}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${severityColors[log.severity as keyof typeof severityColors]}`}>
                        {log.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Details Modal */}
      {selectedLog && (
        <AuditDetails
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
}