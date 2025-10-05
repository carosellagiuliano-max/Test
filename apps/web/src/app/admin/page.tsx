'use client';

import { useState, useEffect } from 'react';
import {
  Calendar,
  DollarSign,
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  XCircle,
  CreditCard,
  Smartphone
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

// Mock data - in real app, this would come from APIs
const mockStats = {
  todayRevenue: 85000, // cents
  todayAppointments: 24,
  totalCustomers: 1247,
  avgAppointmentDuration: 45,
  weeklyGrowth: 12.5,
  monthlyGrowth: -2.3,
  pendingAppointments: 8,
  completedAppointments: 16,
  cancelledAppointments: 2,
  stripeRevenue: 65000,
  sumupRevenue: 20000,
};

const recentAppointments = [
  {
    id: '1',
    customer: 'Maria Schmidt',
    service: 'Haircut & Styling',
    time: '09:00',
    status: 'completed',
    amount: 8500,
    staff: 'Anna Mueller'
  },
  {
    id: '2',
    customer: 'Hans Weber',
    service: 'Beard Trim',
    time: '10:30',
    status: 'in_progress',
    amount: 3500,
    staff: 'Tom Fischer'
  },
  {
    id: '3',
    customer: 'Sarah Johnson',
    service: 'Hair Coloring',
    time: '11:00',
    status: 'pending',
    amount: 12000,
    staff: 'Anna Mueller'
  },
  {
    id: '4',
    customer: 'Peter Müller',
    service: 'Men\'s Cut',
    time: '14:00',
    status: 'confirmed',
    amount: 4500,
    staff: 'Tom Fischer'
  }
];

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: number;
  subtitle?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red';
}

function StatCard({ title, value, icon: Icon, trend, subtitle, color = 'blue' }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`${colorClasses[color]} rounded-md p-3`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">{value}</div>
              {trend !== undefined && (
                <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                  trend >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {trend >= 0 ? (
                    <TrendingUp className="self-center flex-shrink-0 h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="self-center flex-shrink-0 h-4 w-4 text-red-500" />
                  )}
                  <span className="sr-only">{trend >= 0 ? 'Increased' : 'Decreased'} by</span>
                  {Math.abs(trend)}%
                </div>
              )}
            </dd>
            {subtitle && (
              <dd className="text-sm text-gray-500">{subtitle}</dd>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'in_progress':
      return <Clock className="h-5 w-5 text-blue-500" />;
    case 'cancelled':
      return <XCircle className="h-5 w-5 text-red-500" />;
    case 'confirmed':
    case 'pending':
    default:
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'in_progress':
      return 'In Progress';
    case 'cancelled':
      return 'Cancelled';
    case 'confirmed':
      return 'Confirmed';
    case 'pending':
    default:
      return 'Pending';
  }
}

export default function AdminDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Dashboard
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {formatDate(currentTime)} - {currentTime.toLocaleTimeString('de-CH')}
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Export Report
          </button>
          <button
            type="button"
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            New Appointment
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Revenue"
          value={formatCurrency(mockStats.todayRevenue)}
          icon={DollarSign}
          trend={mockStats.weeklyGrowth}
          subtitle="vs last week"
          color="green"
        />
        <StatCard
          title="Today's Appointments"
          value={mockStats.todayAppointments}
          icon={Calendar}
          subtitle={`${mockStats.pendingAppointments} pending`}
          color="blue"
        />
        <StatCard
          title="Total Customers"
          value={mockStats.totalCustomers.toLocaleString()}
          icon={Users}
          trend={mockStats.monthlyGrowth}
          subtitle="vs last month"
          color="blue"
        />
        <StatCard
          title="Avg. Duration"
          value={`${mockStats.avgAppointmentDuration}min`}
          icon={Clock}
          subtitle="per appointment"
          color="yellow"
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Recent Appointments */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Today's Appointments
            </h3>
            <div className="mt-6 flow-root">
              <ul className="-my-5 divide-y divide-gray-200">
                {recentAppointments.map((appointment) => (
                  <li key={appointment.id} className="py-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {getStatusIcon(appointment.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {appointment.customer}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {appointment.service} • {appointment.staff}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {appointment.time}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatCurrency(appointment.amount)}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                          appointment.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {getStatusText(appointment.status)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-6">
              <a
                href="/admin/calendar"
                className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                View all appointments
              </a>
            </div>
          </div>
        </div>

        {/* Payment Methods Revenue */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Payment Methods (Today)
            </h3>
            <div className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CreditCard className="h-8 w-8 text-blue-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Stripe</p>
                      <p className="text-sm text-gray-500">Online payments</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(mockStats.stripeRevenue)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {Math.round((mockStats.stripeRevenue / mockStats.todayRevenue) * 100)}%
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Smartphone className="h-8 w-8 text-green-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">SumUp</p>
                      <p className="text-sm text-gray-500">Card terminal</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(mockStats.sumupRevenue)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {Math.round((mockStats.sumupRevenue / mockStats.todayRevenue) * 100)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress bars */}
              <div className="mt-6">
                <div className="text-sm font-medium text-gray-700 mb-2">Revenue Distribution</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-l-full"
                    style={{ width: `${(mockStats.stripeRevenue / mockStats.todayRevenue) * 100}%` }}
                  />
                  <div
                    className="bg-green-500 h-2 rounded-r-full"
                    style={{ width: `${(mockStats.sumupRevenue / mockStats.todayRevenue) * 100}%` }}
                  />
                </div>
              </div>

              <div className="mt-6">
                <a
                  href="/admin/analytics"
                  className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  View detailed analytics
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button className="relative bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <div className="text-center">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <span className="mt-2 block text-sm font-medium text-gray-900">
                Schedule Appointment
              </span>
            </div>
          </button>

          <button className="relative bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <div className="text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <span className="mt-2 block text-sm font-medium text-gray-900">
                Add Customer
              </span>
            </div>
          </button>

          <button className="relative bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <div className="text-center">
              <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
              <span className="mt-2 block text-sm font-medium text-gray-900">
                Process Payment
              </span>
            </div>
          </button>

          <button className="relative bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <div className="text-center">
              <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
              <span className="mt-2 block text-sm font-medium text-gray-900">
                View Reports
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}