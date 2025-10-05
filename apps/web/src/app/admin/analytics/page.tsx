'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  CreditCard,
  Smartphone,
  Clock,
  Target,
  AlertTriangle,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

// Mock data for analytics
const revenueData = [
  { date: '2024-09-01', stripe: 2400, sumup: 800, total: 3200 },
  { date: '2024-09-02', stripe: 1800, sumup: 1200, total: 3000 },
  { date: '2024-09-03', stripe: 2200, sumup: 900, total: 3100 },
  { date: '2024-09-04', stripe: 2800, sumup: 1400, total: 4200 },
  { date: '2024-09-05', stripe: 2600, sumup: 1100, total: 3700 },
  { date: '2024-09-06', stripe: 3200, sumup: 1600, total: 4800 },
  { date: '2024-09-07', stripe: 3000, sumup: 1300, total: 4300 },
  { date: '2024-09-08', stripe: 2900, sumup: 1500, total: 4400 },
  { date: '2024-09-09', stripe: 3100, sumup: 1200, total: 4300 },
  { date: '2024-09-10', stripe: 2700, sumup: 1700, total: 4400 },
  { date: '2024-09-11', stripe: 3300, sumup: 1400, total: 4700 },
  { date: '2024-09-12', stripe: 3500, sumup: 1800, total: 5300 },
  { date: '2024-09-13', stripe: 3200, sumup: 1600, total: 4800 },
  { date: '2024-09-14', stripe: 2800, sumup: 1900, total: 4700 }
];

const servicePopularity = [
  { name: 'Haircut & Styling', value: 45, revenue: 38250, count: 85 },
  { name: 'Hair Coloring', value: 25, revenue: 30000, count: 25 },
  { name: 'Beard Trim', value: 15, revenue: 10500, count: 30 },
  { name: 'Treatments', value: 10, revenue: 8000, count: 20 },
  { name: 'Others', value: 5, revenue: 3750, count: 15 }
];

const staffUtilization = [
  { name: 'Anna Mueller', appointments: 28, capacity: 35, utilization: 80, revenue: 25200 },
  { name: 'Tom Fischer', appointments: 25, capacity: 35, utilization: 71, revenue: 17500 },
  { name: 'Lisa Weber', appointments: 22, capacity: 30, utilization: 73, revenue: 26400 },
  { name: 'Marc Klein', appointments: 18, capacity: 30, utilization: 60, revenue: 14400 }
];

const noShowData = [
  { date: '2024-09-01', appointments: 12, noShows: 1, rate: 8.3 },
  { date: '2024-09-02', appointments: 10, noShows: 0, rate: 0 },
  { date: '2024-09-03', appointments: 11, noShows: 2, rate: 18.2 },
  { date: '2024-09-04', appointments: 15, noShows: 1, rate: 6.7 },
  { date: '2024-09-05', appointments: 13, noShows: 0, rate: 0 },
  { date: '2024-09-06', appointments: 16, noShows: 2, rate: 12.5 },
  { date: '2024-09-07', appointments: 14, noShows: 1, rate: 7.1 }
];

const paymentMethodData = [
  { name: 'Stripe', value: 65, amount: 65000 },
  { name: 'SumUp', value: 35, amount: 35000 }
];

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
  subtitle?: string;
}

function MetricCard({ title, value, change, changeLabel, icon: Icon, color = 'blue', subtitle }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500'
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`${colorClasses[color as keyof typeof colorClasses]} rounded-md p-3`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">{value}</div>
                {change !== undefined && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                    change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {change >= 0 ? (
                      <TrendingUp className="self-center flex-shrink-0 h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="self-center flex-shrink-0 h-4 w-4 text-red-500" />
                    )}
                    <span className="sr-only">{change >= 0 ? 'Increased' : 'Decreased'} by</span>
                    {Math.abs(change)}%
                  </div>
                )}
              </dd>
              {(changeLabel || subtitle) && (
                <dd className="text-sm text-gray-500">{changeLabel || subtitle}</dd>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-900">{`Date: ${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {`${entry.name}: ${typeof entry.value === 'number' && entry.dataKey !== 'rate' ? formatCurrency(entry.value) : entry.value}${entry.dataKey === 'rate' ? '%' : ''}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const totalRevenue = revenueData.reduce((sum, day) => sum + day.total, 0);
  const stripeRevenue = revenueData.reduce((sum, day) => sum + day.stripe, 0);
  const sumupRevenue = revenueData.reduce((sum, day) => sum + day.sumup, 0);
  const totalAppointments = staffUtilization.reduce((sum, staff) => sum + staff.appointments, 0);
  const avgUtilization = Math.round(staffUtilization.reduce((sum, staff) => sum + staff.utilization, 0) / staffUtilization.length);
  const noShowRate = Math.round((noShowData.reduce((sum, day) => sum + day.noShows, 0) / noShowData.reduce((sum, day) => sum + day.appointments, 0)) * 100);

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Analytics Dashboard
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Comprehensive business insights and performance metrics
          </p>
        </div>
        <div className="mt-4 flex space-x-3 md:mt-0 md:ml-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          change={12.5}
          changeLabel="vs last period"
          icon={DollarSign}
          color="green"
        />
        <MetricCard
          title="Total Appointments"
          value={totalAppointments}
          change={8.3}
          changeLabel="vs last period"
          icon={Calendar}
          color="blue"
        />
        <MetricCard
          title="Avg. Utilization"
          value={`${avgUtilization}%`}
          change={-2.1}
          changeLabel="vs last period"
          icon={Target}
          color="purple"
        />
        <MetricCard
          title="No-Show Rate"
          value={`${noShowRate}%`}
          change={-15.2}
          changeLabel="vs last period"
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* Revenue Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Revenue Trend */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Revenue Trend</h3>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span>Stripe</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span>SumUp</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => new Date(value).getDate().toString()}
              />
              <YAxis tickFormatter={(value) => `CHF ${value / 100}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="stripe"
                stackId="1"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="sumup"
                stackId="1"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Methods */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Methods</h3>
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-3">
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 text-blue-500 mr-2" />
                <span className="text-sm font-medium">Stripe</span>
                <span className="ml-auto text-sm text-gray-600">{formatCurrency(stripeRevenue)}</span>
              </div>
              <div className="flex items-center">
                <Smartphone className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-sm font-medium">SumUp</span>
                <span className="ml-auto text-sm text-gray-600">{formatCurrency(sumupRevenue)}</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={paymentMethodData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {paymentMethodData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#3B82F6' : '#10B981'} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${value}%`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Service Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Service Popularity */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Service Popularity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={servicePopularity} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(value) => `${value}%`} />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip
                formatter={(value, name) => [
                  name === 'value' ? `${value}%` : value,
                  name === 'value' ? 'Popularity' : name === 'revenue' ? 'Revenue' : 'Count'
                ]}
              />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {servicePopularity.map((service, index) => (
              <div key={service.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ backgroundColor: COLORS[index] }}
                  ></div>
                  <span>{service.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatCurrency(service.revenue)}</div>
                  <div className="text-gray-500">{service.count} bookings</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Staff Utilization */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Staff Utilization</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={staffUtilization}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis tickFormatter={(value) => `${value}%`} />
              <Tooltip
                formatter={(value, name) => [
                  name === 'utilization' ? `${value}%` : value,
                  name === 'utilization' ? 'Utilization' : name === 'appointments' ? 'Appointments' : name === 'capacity' ? 'Capacity' : 'Revenue'
                ]}
              />
              <Bar dataKey="utilization" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {staffUtilization.map((staff) => (
              <div key={staff.name} className="flex items-center justify-between text-sm">
                <span className="font-medium">{staff.name}</span>
                <div className="text-right">
                  <div>{staff.appointments}/{staff.capacity} appointments</div>
                  <div className="text-gray-500">{formatCurrency(staff.revenue)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* No-Show Analysis */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">No-Show Analysis</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={noShowData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => new Date(value).getDate().toString()}
            />
            <YAxis yAxisId="left" orientation="left" />
            <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value}%`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar yAxisId="left" dataKey="appointments" fill="#3B82F6" name="Total Appointments" />
            <Bar yAxisId="left" dataKey="noShows" fill="#EF4444" name="No-Shows" />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="rate"
              stroke="#F59E0B"
              strokeWidth={3}
              name="No-Show Rate (%)"
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{noShowData.reduce((sum, day) => sum + day.noShows, 0)}</div>
            <div className="text-sm text-gray-500">Total No-Shows</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{noShowRate}%</div>
            <div className="text-sm text-gray-500">Average Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(noShowData.reduce((sum, day) => sum + day.noShows, 0) * 5500)}
            </div>
            <div className="text-sm text-gray-500">Estimated Lost Revenue</div>
          </div>
        </div>
      </div>
    </div>
  );
}