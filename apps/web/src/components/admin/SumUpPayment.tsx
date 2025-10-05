'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Smartphone,
  QrCode,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Copy,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface SumUpPaymentProps {
  orderId: string;
  amount: number; // in cents
  currency?: string;
  description: string;
  customerName?: string;
  onPaymentSuccess?: (paymentId: string) => void;
  onPaymentError?: (error: string) => void;
}

interface PaymentStatus {
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled';
  paymentId?: string;
  transactionId?: string;
  errorMessage?: string;
  timestamp: string;
}

export default function SumUpPayment({
  orderId,
  amount,
  currency = 'CHF',
  description,
  customerName,
  onPaymentSuccess,
  onPaymentError
}: SumUpPaymentProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [deepLink, setDeepLink] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({
    status: 'pending',
    timestamp: new Date().toISOString()
  });
  const [isPolling, setIsPolling] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate SumUp payment deep link
  const generateSumUpLink = () => {
    const amountFormatted = (amount / 100).toFixed(2);
    const params = new URLSearchParams({
      amount: amountFormatted,
      currency,
      title: description,
      ...(customerName && { customer_name: customerName }),
      reference: orderId,
      callback_url: `${window.location.origin}/admin/payments/callback`
    });

    return `sumupmerchant://pay?${params.toString()}`;
  };

  // Generate QR code for the payment link
  const generateQRCode = async (link: string) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(link, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(qrDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  // Poll payment status
  const pollPaymentStatus = async () => {
    if (isPolling) return;

    setIsPolling(true);
    try {
      // In a real implementation, this would call your backend API
      // which would check SumUp's API for payment status
      const response = await fetch(`/api/payments/sumup/${orderId}/status`);
      const data = await response.json();

      setPaymentStatus({
        status: data.status,
        paymentId: data.paymentId,
        transactionId: data.transactionId,
        errorMessage: data.errorMessage,
        timestamp: new Date().toISOString()
      });

      if (data.status === 'succeeded' && onPaymentSuccess) {
        onPaymentSuccess(data.paymentId);
      } else if (data.status === 'failed' && onPaymentError) {
        onPaymentError(data.errorMessage || 'Payment failed');
      }
    } catch (error) {
      console.error('Error polling payment status:', error);
    } finally {
      setIsPolling(false);
    }
  };

  // Copy deep link to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Initialize payment flow
  const initializePayment = () => {
    const link = generateSumUpLink();
    setDeepLink(link);
    generateQRCode(link);
    setPaymentStatus({
      status: 'pending',
      timestamp: new Date().toISOString()
    });
  };

  useEffect(() => {
    initializePayment();
  }, [orderId, amount]);

  // Auto-poll for payment status updates
  useEffect(() => {
    if (paymentStatus.status === 'pending' || paymentStatus.status === 'processing') {
      const interval = setInterval(pollPaymentStatus, 3000); // Poll every 3 seconds
      return () => clearInterval(interval);
    }
  }, [paymentStatus.status]);

  const getStatusIcon = () => {
    switch (paymentStatus.status) {
      case 'succeeded':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="h-8 w-8 text-red-500" />;
      case 'processing':
        return <Clock className="h-8 w-8 text-blue-500" />;
      default:
        return <AlertCircle className="h-8 w-8 text-yellow-500" />;
    }
  };

  const getStatusText = () => {
    switch (paymentStatus.status) {
      case 'succeeded':
        return 'Payment Successful';
      case 'failed':
        return 'Payment Failed';
      case 'cancelled':
        return 'Payment Cancelled';
      case 'processing':
        return 'Processing Payment...';
      default:
        return 'Waiting for Payment';
    }
  };

  const getStatusColor = () => {
    switch (paymentStatus.status) {
      case 'succeeded':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-4">
          <Smartphone className="h-8 w-8 text-blue-600 mr-2" />
          <h3 className="text-xl font-semibold text-gray-900">SumUp Payment</h3>
        </div>
        <p className="text-2xl font-bold text-gray-900">{formatCurrency(amount, currency)}</p>
        <p className="text-sm text-gray-600">{description}</p>
        {customerName && (
          <p className="text-sm text-gray-500">Customer: {customerName}</p>
        )}
      </div>

      {/* Payment Status */}
      <div className={`border rounded-lg p-4 mb-6 ${getStatusColor()}`}>
        <div className="flex items-center justify-center mb-2">
          {getStatusIcon()}
          <span className="ml-2 font-medium">{getStatusText()}</span>
        </div>
        {paymentStatus.status === 'processing' && (
          <div className="flex items-center justify-center">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm">Checking payment status...</span>
          </div>
        )}
        {paymentStatus.errorMessage && (
          <p className="text-sm text-center mt-2">{paymentStatus.errorMessage}</p>
        )}
      </div>

      {/* QR Code */}
      {qrCodeUrl && paymentStatus.status === 'pending' && (
        <div className="text-center mb-6">
          <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
            <img src={qrCodeUrl} alt="Payment QR Code" className="w-48 h-48" />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Scan with SumUp app to process payment
          </p>
        </div>
      )}

      {/* Action Buttons */}
      {paymentStatus.status === 'pending' && (
        <div className="space-y-3">
          {/* Open SumUp App Button */}
          <button
            onClick={() => window.open(deepLink, '_blank')}
            className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Smartphone className="h-5 w-5 mr-2" />
            Open SumUp App
            <ExternalLink className="h-4 w-4 ml-2" />
          </button>

          {/* Copy Link Button */}
          <button
            onClick={() => copyToClipboard(deepLink)}
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Copy className="h-4 w-4 mr-2" />
            {copied ? 'Copied!' : 'Copy Payment Link'}
          </button>

          {/* Manual Status Check */}
          <button
            onClick={pollPaymentStatus}
            disabled={isPolling}
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isPolling ? 'animate-spin' : ''}`} />
            {isPolling ? 'Checking...' : 'Check Status'}
          </button>
        </div>
      )}

      {/* Payment Success Actions */}
      {paymentStatus.status === 'succeeded' && (
        <div className="space-y-3">
          <div className="text-center text-sm text-gray-600">
            <p>Transaction ID: {paymentStatus.transactionId}</p>
            <p>Payment ID: {paymentStatus.paymentId}</p>
          </div>
          <button
            onClick={() => window.print()}
            className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Print Receipt
          </button>
        </div>
      )}

      {/* Retry Payment */}
      {(paymentStatus.status === 'failed' || paymentStatus.status === 'cancelled') && (
        <button
          onClick={initializePayment}
          className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="h-5 w-5 mr-2" />
          Retry Payment
        </button>
      )}

      {/* Additional Info */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Order ID: {orderId}</span>
          <span>Updated: {new Date(paymentStatus.timestamp).toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}

// Webhook handler component for processing SumUp callbacks
export function SumUpWebhookHandler() {
  const [recentPayments, setRecentPayments] = useState<any[]>([]);

  useEffect(() => {
    // In a real implementation, this would subscribe to real-time updates
    // from your backend when SumUp webhooks are received
    const handlePaymentUpdate = (event: CustomEvent) => {
      const paymentData = event.detail;
      setRecentPayments(prev => [paymentData, ...prev.slice(0, 9)]);
    };

    window.addEventListener('sumup-payment-update', handlePaymentUpdate as EventListener);
    return () => {
      window.removeEventListener('sumup-payment-update', handlePaymentUpdate as EventListener);
    };
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h4 className="font-medium text-gray-900 mb-4">Recent SumUp Payments</h4>
      {recentPayments.length === 0 ? (
        <p className="text-sm text-gray-500">No recent payments</p>
      ) : (
        <div className="space-y-2">
          {recentPayments.map((payment, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div>
                <p className="text-sm font-medium">{formatCurrency(payment.amount)}</p>
                <p className="text-xs text-gray-500">{payment.description}</p>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  payment.status === 'succeeded' ? 'bg-green-100 text-green-800' :
                  payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {payment.status}
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(payment.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}