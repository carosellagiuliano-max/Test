'use client';

import { useState } from 'react';
import {
  Save,
  Settings,
  Clock,
  DollarSign,
  Mail,
  Bell,
  Shield,
  Database,
  CreditCard,
  Smartphone,
  Globe,
  Calendar,
  Users,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react';

// Mock settings data
const mockSettings = {
  business: {
    name: 'Schnittwerk - Your Style',
    address: {
      street: 'Bahnhofstrasse 123',
      city: 'Zurich',
      postalCode: '8001',
      country: 'Switzerland'
    },
    phone: '+41 44 123 45 67',
    email: 'info@schnittwerk.ch',
    website: 'https://schnittwerk.ch',
    taxId: 'CHE-123.456.789'
  },
  businessHours: {
    monday: { isOpen: true, start: '09:00', end: '18:00' },
    tuesday: { isOpen: true, start: '09:00', end: '18:00' },
    wednesday: { isOpen: true, start: '09:00', end: '18:00' },
    thursday: { isOpen: true, start: '09:00', end: '19:00' },
    friday: { isOpen: true, start: '09:00', end: '18:00' },
    saturday: { isOpen: true, start: '09:00', end: '16:00' },
    sunday: { isOpen: false, start: '10:00', end: '16:00' }
  },
  booking: {
    advanceBookingDays: 60,
    cancellationHours: 24,
    reminderHours: 24,
    autoConfirm: true,
    allowOnlineBooking: true,
    requireDeposit: false,
    depositPercentage: 20,
    maxAppointmentsPerDay: 50,
    bufferMinutes: 15
  },
  payment: {
    currency: 'CHF',
    taxRate: 7.7,
    stripeEnabled: true,
    stripePublishableKey: 'pk_test_...',
    stripeSecretKey: '••••••••••••••••',
    sumupEnabled: true,
    sumupAppId: 'com.sumup.merchant',
    sumupApiKey: '••••••••••••••••',
    cashEnabled: true,
    requirePaymentOnBooking: false
  },
  notifications: {
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: true,
    appointmentReminders: true,
    paymentConfirmations: true,
    marketingEmails: false,
    systemAlerts: true
  },
  security: {
    passwordMinLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSymbols: false,
    sessionTimeout: 480, // minutes
    maxLoginAttempts: 5,
    twoFactorEnabled: false,
    auditLogRetention: 365 // days
  },
  backup: {
    autoBackup: true,
    backupFrequency: 'daily',
    retentionDays: 30,
    includeImages: true,
    backupLocation: 'cloud',
    lastBackup: '2024-10-04T02:00:00Z'
  }
};

interface SettingsSectionProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

function SettingsSection({ title, description, icon: Icon, children }: SettingsSectionProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="flex items-center mb-4">
        <Icon className="h-6 w-6 text-blue-600 mr-3" />
        <div>
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

interface InputFieldProps {
  label: string;
  value: string | number;
  onChange: (value: string | number) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
}

function InputField({ label, value, onChange, type = 'text', required = false, placeholder, helpText }: InputFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
      />
      {helpText && <p className="text-xs text-gray-500 mt-1">{helpText}</p>}
    </div>
  );
}

interface ToggleFieldProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

function ToggleField({ label, description, value, onChange }: ToggleFieldProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-medium text-gray-900">{label}</div>
        {description && <div className="text-sm text-gray-500">{description}</div>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`${value ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
      >
        <span
          className={`${value ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        />
      </button>
    </div>
  );
}

function PasswordField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-gray-400" />
          ) : (
            <Eye className="h-4 w-4 text-gray-400" />
          )}
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState(mockSettings);
  const [activeTab, setActiveTab] = useState('business');
  const [hasChanges, setHasChanges] = useState(false);

  const tabs = [
    { id: 'business', name: 'Business Info', icon: Settings },
    { id: 'hours', name: 'Business Hours', icon: Clock },
    { id: 'booking', name: 'Booking Settings', icon: Calendar },
    { id: 'payment', name: 'Payment Settings', icon: CreditCard },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'backup', name: 'Backup & Data', icon: Database }
  ];

  const updateSettings = (section: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const updateNestedSettings = (section: string, subSection: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [subSection]: {
          ...(prev[section as keyof typeof prev] as any)[subSection],
          [field]: value
        }
      }
    }));
    setHasChanges(true);
  };

  const saveSettings = async () => {
    try {
      // In a real app, this would make an API call
      console.log('Saving settings:', settings);
      setHasChanges(false);
      // Show success message
    } catch (error) {
      console.error('Failed to save settings:', error);
      // Show error message
    }
  };

  const renderBusinessInfo = () => (
    <SettingsSection
      title="Business Information"
      description="Basic information about your salon"
      icon={Settings}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField
          label="Business Name"
          value={settings.business.name}
          onChange={(value) => updateSettings('business', 'name', value)}
          required
        />
        <InputField
          label="Phone Number"
          value={settings.business.phone}
          onChange={(value) => updateSettings('business', 'phone', value)}
          type="tel"
        />
        <InputField
          label="Email Address"
          value={settings.business.email}
          onChange={(value) => updateSettings('business', 'email', value)}
          type="email"
          required
        />
        <InputField
          label="Website"
          value={settings.business.website}
          onChange={(value) => updateSettings('business', 'website', value)}
          type="url"
        />
        <div className="md:col-span-2">
          <InputField
            label="Street Address"
            value={settings.business.address.street}
            onChange={(value) => updateNestedSettings('business', 'address', 'street', value)}
          />
        </div>
        <InputField
          label="City"
          value={settings.business.address.city}
          onChange={(value) => updateNestedSettings('business', 'address', 'city', value)}
        />
        <InputField
          label="Postal Code"
          value={settings.business.address.postalCode}
          onChange={(value) => updateNestedSettings('business', 'address', 'postalCode', value)}
        />
        <InputField
          label="Country"
          value={settings.business.address.country}
          onChange={(value) => updateNestedSettings('business', 'address', 'country', value)}
        />
        <InputField
          label="Tax ID"
          value={settings.business.taxId}
          onChange={(value) => updateSettings('business', 'taxId', value)}
        />
      </div>
    </SettingsSection>
  );

  const renderBusinessHours = () => (
    <SettingsSection
      title="Business Hours"
      description="Set your operating hours for each day of the week"
      icon={Clock}
    >
      <div className="space-y-4">
        {Object.entries(settings.businessHours).map(([day, hours]) => (
          <div key={day} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-20">
              <span className="text-sm font-medium capitalize">{day}</span>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={hours.isOpen}
                onChange={(e) => updateNestedSettings('businessHours', day, 'isOpen', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">Open</span>
            </div>
            {hours.isOpen && (
              <div className="flex items-center space-x-2">
                <input
                  type="time"
                  value={hours.start}
                  onChange={(e) => updateNestedSettings('businessHours', day, 'start', e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <span>to</span>
                <input
                  type="time"
                  value={hours.end}
                  onChange={(e) => updateNestedSettings('businessHours', day, 'end', e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </SettingsSection>
  );

  const renderBookingSettings = () => (
    <SettingsSection
      title="Booking Settings"
      description="Configure how customers can book appointments"
      icon={Calendar}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField
          label="Advance Booking Days"
          value={settings.booking.advanceBookingDays}
          onChange={(value) => updateSettings('booking', 'advanceBookingDays', value)}
          type="number"
          helpText="How many days in advance customers can book"
        />
        <InputField
          label="Cancellation Hours"
          value={settings.booking.cancellationHours}
          onChange={(value) => updateSettings('booking', 'cancellationHours', value)}
          type="number"
          helpText="Minimum hours before appointment to cancel"
        />
        <InputField
          label="Reminder Hours"
          value={settings.booking.reminderHours}
          onChange={(value) => updateSettings('booking', 'reminderHours', value)}
          type="number"
          helpText="Hours before appointment to send reminder"
        />
        <InputField
          label="Buffer Minutes"
          value={settings.booking.bufferMinutes}
          onChange={(value) => updateSettings('booking', 'bufferMinutes', value)}
          type="number"
          helpText="Buffer time between appointments"
        />
        <InputField
          label="Max Appointments/Day"
          value={settings.booking.maxAppointmentsPerDay}
          onChange={(value) => updateSettings('booking', 'maxAppointmentsPerDay', value)}
          type="number"
        />
        <InputField
          label="Deposit Percentage"
          value={settings.booking.depositPercentage}
          onChange={(value) => updateSettings('booking', 'depositPercentage', value)}
          type="number"
          helpText="Percentage of total price for deposit"
        />
      </div>

      <div className="mt-6 space-y-4">
        <ToggleField
          label="Auto-confirm Appointments"
          description="Automatically confirm new appointments"
          value={settings.booking.autoConfirm}
          onChange={(value) => updateSettings('booking', 'autoConfirm', value)}
        />
        <ToggleField
          label="Allow Online Booking"
          description="Enable customers to book online"
          value={settings.booking.allowOnlineBooking}
          onChange={(value) => updateSettings('booking', 'allowOnlineBooking', value)}
        />
        <ToggleField
          label="Require Deposit"
          description="Require deposit payment when booking"
          value={settings.booking.requireDeposit}
          onChange={(value) => updateSettings('booking', 'requireDeposit', value)}
        />
      </div>
    </SettingsSection>
  );

  const renderPaymentSettings = () => (
    <SettingsSection
      title="Payment Settings"
      description="Configure payment methods and processing"
      icon={CreditCard}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
          <select
            value={settings.payment.currency}
            onChange={(e) => updateSettings('payment', 'currency', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="CHF">Swiss Franc (CHF)</option>
            <option value="EUR">Euro (EUR)</option>
            <option value="USD">US Dollar (USD)</option>
          </select>
        </div>
        <InputField
          label="Tax Rate (%)"
          value={settings.payment.taxRate}
          onChange={(value) => updateSettings('payment', 'taxRate', value)}
          type="number"
          helpText="VAT/Sales tax rate"
        />
      </div>

      {/* Stripe Settings */}
      <div className="border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-center mb-4">
          <CreditCard className="h-5 w-5 text-blue-600 mr-2" />
          <h4 className="text-lg font-medium">Stripe Settings</h4>
        </div>
        <div className="space-y-4">
          <ToggleField
            label="Enable Stripe"
            description="Accept online card payments"
            value={settings.payment.stripeEnabled}
            onChange={(value) => updateSettings('payment', 'stripeEnabled', value)}
          />
          {settings.payment.stripeEnabled && (
            <div className="grid grid-cols-1 gap-4">
              <InputField
                label="Publishable Key"
                value={settings.payment.stripePublishableKey}
                onChange={(value) => updateSettings('payment', 'stripePublishableKey', value)}
                placeholder="pk_test_..."
              />
              <PasswordField
                label="Secret Key"
                value={settings.payment.stripeSecretKey}
                onChange={(value) => updateSettings('payment', 'stripeSecretKey', value)}
                placeholder="sk_test_..."
              />
            </div>
          )}
        </div>
      </div>

      {/* SumUp Settings */}
      <div className="border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-center mb-4">
          <Smartphone className="h-5 w-5 text-green-600 mr-2" />
          <h4 className="text-lg font-medium">SumUp Settings</h4>
        </div>
        <div className="space-y-4">
          <ToggleField
            label="Enable SumUp"
            description="Accept payments via SumUp card reader"
            value={settings.payment.sumupEnabled}
            onChange={(value) => updateSettings('payment', 'sumupEnabled', value)}
          />
          {settings.payment.sumupEnabled && (
            <div className="grid grid-cols-1 gap-4">
              <InputField
                label="App ID"
                value={settings.payment.sumupAppId}
                onChange={(value) => updateSettings('payment', 'sumupAppId', value)}
                placeholder="com.sumup.merchant"
              />
              <PasswordField
                label="API Key"
                value={settings.payment.sumupApiKey}
                onChange={(value) => updateSettings('payment', 'sumupApiKey', value)}
                placeholder="Enter SumUp API key"
              />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <ToggleField
          label="Accept Cash Payments"
          description="Allow cash payments at the salon"
          value={settings.payment.cashEnabled}
          onChange={(value) => updateSettings('payment', 'cashEnabled', value)}
        />
        <ToggleField
          label="Require Payment on Booking"
          description="Require full payment when booking online"
          value={settings.payment.requirePaymentOnBooking}
          onChange={(value) => updateSettings('payment', 'requirePaymentOnBooking', value)}
        />
      </div>
    </SettingsSection>
  );

  const renderNotificationSettings = () => (
    <SettingsSection
      title="Notification Settings"
      description="Configure how and when to send notifications"
      icon={Bell}
    >
      <div className="space-y-4">
        <ToggleField
          label="Email Notifications"
          description="Send notifications via email"
          value={settings.notifications.emailEnabled}
          onChange={(value) => updateSettings('notifications', 'emailEnabled', value)}
        />
        <ToggleField
          label="SMS Notifications"
          description="Send notifications via SMS"
          value={settings.notifications.smsEnabled}
          onChange={(value) => updateSettings('notifications', 'smsEnabled', value)}
        />
        <ToggleField
          label="Push Notifications"
          description="Send push notifications to mobile app"
          value={settings.notifications.pushEnabled}
          onChange={(value) => updateSettings('notifications', 'pushEnabled', value)}
        />
        <ToggleField
          label="Appointment Reminders"
          description="Send reminders before appointments"
          value={settings.notifications.appointmentReminders}
          onChange={(value) => updateSettings('notifications', 'appointmentReminders', value)}
        />
        <ToggleField
          label="Payment Confirmations"
          description="Send confirmations for successful payments"
          value={settings.notifications.paymentConfirmations}
          onChange={(value) => updateSettings('notifications', 'paymentConfirmations', value)}
        />
        <ToggleField
          label="Marketing Emails"
          description="Send promotional and marketing emails"
          value={settings.notifications.marketingEmails}
          onChange={(value) => updateSettings('notifications', 'marketingEmails', value)}
        />
        <ToggleField
          label="System Alerts"
          description="Send alerts for system events and errors"
          value={settings.notifications.systemAlerts}
          onChange={(value) => updateSettings('notifications', 'systemAlerts', value)}
        />
      </div>
    </SettingsSection>
  );

  const renderSecuritySettings = () => (
    <SettingsSection
      title="Security Settings"
      description="Configure security and access controls"
      icon={Shield}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <InputField
          label="Minimum Password Length"
          value={settings.security.passwordMinLength}
          onChange={(value) => updateSettings('security', 'passwordMinLength', value)}
          type="number"
        />
        <InputField
          label="Session Timeout (minutes)"
          value={settings.security.sessionTimeout}
          onChange={(value) => updateSettings('security', 'sessionTimeout', value)}
          type="number"
        />
        <InputField
          label="Max Login Attempts"
          value={settings.security.maxLoginAttempts}
          onChange={(value) => updateSettings('security', 'maxLoginAttempts', value)}
          type="number"
        />
        <InputField
          label="Audit Log Retention (days)"
          value={settings.security.auditLogRetention}
          onChange={(value) => updateSettings('security', 'auditLogRetention', value)}
          type="number"
        />
      </div>

      <div className="space-y-4">
        <ToggleField
          label="Require Uppercase Letters"
          description="Passwords must contain uppercase letters"
          value={settings.security.requireUppercase}
          onChange={(value) => updateSettings('security', 'requireUppercase', value)}
        />
        <ToggleField
          label="Require Numbers"
          description="Passwords must contain numbers"
          value={settings.security.requireNumbers}
          onChange={(value) => updateSettings('security', 'requireNumbers', value)}
        />
        <ToggleField
          label="Require Symbols"
          description="Passwords must contain special characters"
          value={settings.security.requireSymbols}
          onChange={(value) => updateSettings('security', 'requireSymbols', value)}
        />
        <ToggleField
          label="Two-Factor Authentication"
          description="Enable 2FA for admin accounts"
          value={settings.security.twoFactorEnabled}
          onChange={(value) => updateSettings('security', 'twoFactorEnabled', value)}
        />
      </div>
    </SettingsSection>
  );

  const renderBackupSettings = () => (
    <SettingsSection
      title="Backup & Data Management"
      description="Configure automatic backups and data retention"
      icon={Database}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Backup Frequency</label>
          <select
            value={settings.backup.backupFrequency}
            onChange={(e) => updateSettings('backup', 'backupFrequency', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <InputField
          label="Retention Days"
          value={settings.backup.retentionDays}
          onChange={(value) => updateSettings('backup', 'retentionDays', value)}
          type="number"
          helpText="How long to keep backups"
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Backup Location</label>
          <select
            value={settings.backup.backupLocation}
            onChange={(e) => updateSettings('backup', 'backupLocation', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="cloud">Cloud Storage</option>
            <option value="local">Local Storage</option>
            <option value="both">Both</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Backup</label>
          <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm">
            {new Date(settings.backup.lastBackup).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <ToggleField
          label="Automatic Backups"
          description="Enable scheduled automatic backups"
          value={settings.backup.autoBackup}
          onChange={(value) => updateSettings('backup', 'autoBackup', value)}
        />
        <ToggleField
          label="Include Images"
          description="Include uploaded images in backups"
          value={settings.backup.includeImages}
          onChange={(value) => updateSettings('backup', 'includeImages', value)}
        />
      </div>

      <div className="flex space-x-4">
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Create Backup Now
        </button>
        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
          Restore from Backup
        </button>
      </div>
    </SettingsSection>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'business': return renderBusinessInfo();
      case 'hours': return renderBusinessHours();
      case 'booking': return renderBookingSettings();
      case 'payment': return renderPaymentSettings();
      case 'notifications': return renderNotificationSettings();
      case 'security': return renderSecuritySettings();
      case 'backup': return renderBackupSettings();
      default: return renderBusinessInfo();
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Settings
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Configure your salon's system settings and preferences
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            onClick={saveSettings}
            disabled={!hasChanges}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              hasChanges
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </button>
        </div>
      </div>

      {/* Changes Alert */}
      {hasChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Unsaved Changes</h3>
              <p className="text-sm text-yellow-700">You have unsaved changes. Don't forget to save your settings.</p>
            </div>
          </div>
        </div>
      )}

      <div className="lg:grid lg:grid-cols-12 lg:gap-x-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-3">
          <nav className="space-y-1 bg-white rounded-lg shadow p-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } group flex items-center w-full px-3 py-2 text-sm font-medium rounded-md`}
              >
                <tab.icon
                  className={`${
                    activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                  } flex-shrink-0 -ml-1 mr-3 h-5 w-5`}
                />
                <span className="truncate">{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="mt-6 lg:mt-0 lg:col-span-9">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}