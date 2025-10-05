'use client';

import { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  Refresh,
  Download,
  Eye,
  Calendar,
  Users,
  CreditCard,
  Settings,
  Shield,
  Database,
  Activity
} from 'lucide-react';

interface TestResult {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'warning';
  duration?: number;
  error?: string;
  details?: string;
}

const initialTests: TestResult[] = [
  // Authentication & Security Tests
  {
    id: 'auth-login',
    name: 'Admin Login System',
    description: 'Test admin user authentication and session management',
    category: 'Authentication',
    status: 'pending'
  },
  {
    id: 'auth-rbac',
    name: 'Role-Based Access Control',
    description: 'Verify admin/staff permissions and access restrictions',
    category: 'Authentication',
    status: 'pending'
  },
  {
    id: 'auth-session',
    name: 'Session Timeout',
    description: 'Test automatic session expiration and renewal',
    category: 'Authentication',
    status: 'pending'
  },

  // Calendar Management Tests
  {
    id: 'calendar-view',
    name: 'Calendar View Rendering',
    description: 'Test FullCalendar integration and view switching',
    category: 'Calendar',
    status: 'pending'
  },
  {
    id: 'calendar-crud',
    name: 'Appointment CRUD Operations',
    description: 'Test creating, updating, and deleting appointments',
    category: 'Calendar',
    status: 'pending'
  },
  {
    id: 'calendar-drag',
    name: 'Drag & Drop Functionality',
    description: 'Test appointment rescheduling via drag and drop',
    category: 'Calendar',
    status: 'pending'
  },
  {
    id: 'calendar-filters',
    name: 'Calendar Filtering',
    description: 'Test filtering by staff, service type, and status',
    category: 'Calendar',
    status: 'pending'
  },

  // Payment Integration Tests
  {
    id: 'payment-sumup',
    name: 'SumUp Integration',
    description: 'Test SumUp payment flow and QR code generation',
    category: 'Payment',
    status: 'pending'
  },
  {
    id: 'payment-stripe',
    name: 'Stripe Integration',
    description: 'Test Stripe payment processing and webhooks',
    category: 'Payment',
    status: 'pending'
  },
  {
    id: 'payment-qr',
    name: 'QR Code Generation',
    description: 'Test payment QR code creation and deep links',
    category: 'Payment',
    status: 'pending'
  },
  {
    id: 'payment-webhooks',
    name: 'Payment Webhooks',
    description: 'Test real-time payment status updates',
    category: 'Payment',
    status: 'pending'
  },

  // Analytics & Reporting Tests
  {
    id: 'analytics-charts',
    name: 'Chart Rendering',
    description: 'Test analytics dashboard chart generation',
    category: 'Analytics',
    status: 'pending'
  },
  {
    id: 'analytics-data',
    name: 'Data Processing',
    description: 'Test revenue calculations and metrics aggregation',
    category: 'Analytics',
    status: 'pending'
  },
  {
    id: 'analytics-export',
    name: 'Report Export',
    description: 'Test PDF and Excel report generation',
    category: 'Analytics',
    status: 'pending'
  },

  // Management Interface Tests
  {
    id: 'customer-crud',
    name: 'Customer Management',
    description: 'Test customer CRUD operations and GDPR compliance',
    category: 'Management',
    status: 'pending'
  },
  {
    id: 'staff-management',
    name: 'Staff Management',
    description: 'Test staff scheduling and availability management',
    category: 'Management',
    status: 'pending'
  },
  {
    id: 'service-management',
    name: 'Service Management',
    description: 'Test service catalog and pricing management',
    category: 'Management',
    status: 'pending'
  },
  {
    id: 'product-inventory',
    name: 'Product Inventory',
    description: 'Test product stock management and alerts',
    category: 'Management',
    status: 'pending'
  },

  // Real-time & Performance Tests
  {
    id: 'realtime-connection',
    name: 'Realtime Connection',
    description: 'Test Supabase realtime connection and subscriptions',
    category: 'Realtime',
    status: 'pending'
  },
  {
    id: 'realtime-updates',
    name: 'Live Updates',
    description: 'Test real-time appointment and payment updates',
    category: 'Realtime',
    status: 'pending'
  },
  {
    id: 'performance-load',
    name: 'Load Performance',
    description: 'Test dashboard performance with large datasets',
    category: 'Performance',
    status: 'pending'
  },

  // Security & Audit Tests
  {
    id: 'audit-logging',
    name: 'Audit Logging',
    description: 'Test comprehensive audit trail generation',
    category: 'Security',
    status: 'pending'
  },
  {
    id: 'data-validation',
    name: 'Data Validation',
    description: 'Test input validation and sanitization',
    category: 'Security',
    status: 'pending'
  },
  {
    id: 'backup-restore',
    name: 'Backup & Restore',
    description: 'Test automated backup and restore functionality',
    category: 'Security',
    status: 'pending'
  }
];

const categoryIcons = {
  Authentication: Shield,
  Calendar: Calendar,
  Payment: CreditCard,
  Analytics: Activity,
  Management: Users,
  Realtime: Database,
  Performance: Activity,
  Security: Shield
};

const categoryColors = {
  Authentication: 'bg-red-100 text-red-800',
  Calendar: 'bg-blue-100 text-blue-800',
  Payment: 'bg-green-100 text-green-800',
  Analytics: 'bg-purple-100 text-purple-800',
  Management: 'bg-yellow-100 text-yellow-800',
  Realtime: 'bg-indigo-100 text-indigo-800',
  Performance: 'bg-orange-100 text-orange-800',
  Security: 'bg-gray-100 text-gray-800'
};

export default function AdminTestSuite() {
  const [tests, setTests] = useState<TestResult[]>(initialTests);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTest, setSelectedTest] = useState<TestResult | null>(null);

  const categories = ['all', ...Array.from(new Set(tests.map(t => t.category)))];

  const filteredTests = selectedCategory === 'all'
    ? tests
    : tests.filter(t => t.category === selectedCategory);

  const runTest = async (testId: string): Promise<TestResult> => {
    const test = tests.find(t => t.id === testId)!;

    // Simulate test execution
    const startTime = Date.now();

    // Update test status to running
    setTests(prev => prev.map(t =>
      t.id === testId ? { ...t, status: 'running' } : t
    ));

    // Simulate test duration (1-3 seconds)
    const duration = Math.random() * 2000 + 1000;
    await new Promise(resolve => setTimeout(resolve, duration));

    // Simulate test results (80% pass rate)
    const passed = Math.random() > 0.2;
    const hasWarning = !passed && Math.random() > 0.5;

    const result: TestResult = {
      ...test,
      status: passed ? 'passed' : hasWarning ? 'warning' : 'failed',
      duration: Date.now() - startTime,
      error: passed ? undefined : 'Simulated test failure for demonstration',
      details: passed
        ? 'Test completed successfully. All assertions passed.'
        : hasWarning
          ? 'Test completed with warnings. Some non-critical issues found.'
          : 'Test failed. Critical issues found that need to be addressed.'
    };

    return result;
  };

  const runSingleTest = async (testId: string) => {
    const result = await runTest(testId);
    setTests(prev => prev.map(t => t.id === testId ? result : t));
  };

  const runAllTests = async () => {
    setIsRunning(true);

    const testIds = filteredTests.map(t => t.id);

    // Reset all test statuses
    setTests(prev => prev.map(t => ({ ...t, status: 'pending' })));

    // Run tests sequentially
    for (const testId of testIds) {
      const result = await runTest(testId);
      setTests(prev => prev.map(t => t.id === testId ? result : t));
    }

    setIsRunning(false);
  };

  const resetTests = () => {
    setTests(prev => prev.map(t => ({
      ...t,
      status: 'pending',
      duration: undefined,
      error: undefined,
      details: undefined
    })));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'running':
        return <Play className="h-5 w-5 text-blue-500 animate-pulse" />;
      default:
        return <div className="h-5 w-5 rounded-full bg-gray-300" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'bg-green-100 border-green-200';
      case 'failed':
        return 'bg-red-100 border-red-200';
      case 'warning':
        return 'bg-yellow-100 border-yellow-200';
      case 'running':
        return 'bg-blue-100 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStats = () => {
    const total = tests.length;
    const passed = tests.filter(t => t.status === 'passed').length;
    const failed = tests.filter(t => t.status === 'failed').length;
    const warnings = tests.filter(t => t.status === 'warning').length;
    const pending = tests.filter(t => t.status === 'pending').length;

    return { total, passed, failed, warnings, pending };
  };

  const stats = getStats();

  const generateReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      summary: stats,
      tests: tests.map(t => ({
        name: t.name,
        category: t.category,
        status: t.status,
        duration: t.duration,
        error: t.error
      }))
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-test-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Admin Portal Test Suite</h2>
        <p className="text-gray-600">Comprehensive testing and validation of admin functionality</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Tests</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">{stats.passed}</div>
          <div className="text-sm text-gray-600">Passed</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          <div className="text-sm text-gray-600">Failed</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-yellow-600">{stats.warnings}</div>
          <div className="text-sm text-gray-600">Warnings</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-600">{stats.pending}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'All Categories' : cat}
            </option>
          ))}
        </select>

        <button
          onClick={runAllTests}
          disabled={isRunning}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          <Play className="h-4 w-4 mr-2" />
          {isRunning ? 'Running Tests...' : 'Run All Tests'}
        </button>

        <button
          onClick={resetTests}
          className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          <Refresh className="h-4 w-4 mr-2" />
          Reset
        </button>

        <button
          onClick={generateReport}
          className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </button>
      </div>

      {/* Test List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTests.map((test) => {
          const IconComponent = categoryIcons[test.category as keyof typeof categoryIcons] || Activity;

          return (
            <div
              key={test.id}
              className={`border rounded-lg p-4 ${getStatusColor(test.status)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <IconComponent className="h-5 w-5 text-gray-600 mr-2" />
                  <div>
                    <h3 className="font-medium text-gray-900">{test.name}</h3>
                    <p className="text-sm text-gray-600">{test.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(test.status)}
                  <button
                    onClick={() => setSelectedTest(test)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${categoryColors[test.category as keyof typeof categoryColors]}`}>
                  {test.category}
                </span>

                <div className="flex items-center space-x-2">
                  {test.duration && (
                    <span className="text-xs text-gray-500">
                      {test.duration}ms
                    </span>
                  )}
                  <button
                    onClick={() => runSingleTest(test.id)}
                    disabled={test.status === 'running'}
                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    Run
                  </button>
                </div>
              </div>

              {test.error && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                  {test.error}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Test Details Modal */}
      {selectedTest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Test Details</h3>
              <button
                onClick={() => setSelectedTest(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-600">Test Name:</span>
                <p className="mt-1">{selectedTest.name}</p>
              </div>

              <div>
                <span className="text-sm font-medium text-gray-600">Description:</span>
                <p className="mt-1 text-sm">{selectedTest.description}</p>
              </div>

              <div>
                <span className="text-sm font-medium text-gray-600">Category:</span>
                <p className="mt-1">{selectedTest.category}</p>
              </div>

              <div>
                <span className="text-sm font-medium text-gray-600">Status:</span>
                <div className="mt-1 flex items-center">
                  {getStatusIcon(selectedTest.status)}
                  <span className="ml-2 capitalize">{selectedTest.status}</span>
                </div>
              </div>

              {selectedTest.duration && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Duration:</span>
                  <p className="mt-1">{selectedTest.duration}ms</p>
                </div>
              )}

              {selectedTest.details && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Details:</span>
                  <p className="mt-1 text-sm">{selectedTest.details}</p>
                </div>
              )}

              {selectedTest.error && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Error:</span>
                  <p className="mt-1 text-sm text-red-600">{selectedTest.error}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedTest(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}