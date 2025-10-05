'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import {
  Smartphone,
  QrCode,
  Timer,
  CheckCircle,
  AlertCircle,
  Loader2,
  Store,
  RefreshCw,
} from 'lucide-react';
import type {
  ServiceItem,
  CustomerInfo,
  SumUpPaymentRequest,
  SumUpPaymentResponse,
} from '@coiffeur/types/payment-types';

interface SumUpPaymentFlowProps {
  appointmentId: string;
  services: ServiceItem[];
  customerInfo: CustomerInfo;
  paymentType: 'in_store' | 'remote';
  onSuccess: (response: SumUpPaymentResponse) => void;
  onError: (error: string) => void;
  className?: string;
}

type PaymentStatus = 'creating' | 'pending' | 'completed' | 'failed' | 'expired';

export function SumUpPaymentFlow({
  appointmentId,
  services,
  customerInfo,
  paymentType,
  onSuccess,
  onError,
  className = '',
}: SumUpPaymentFlowProps) {
  const [status, setStatus] = useState<PaymentStatus>('creating');
  const [paymentData, setPaymentData] = useState<SumUpPaymentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isPolling, setIsPolling] = useState(false);

  // Create payment on mount
  useEffect(() => {
    createPayment();
  }, []);

  // Timer for payment expiry
  useEffect(() => {
    if (paymentData?.expiresAt && status === 'pending') {
      const expiryTime = new Date(paymentData.expiresAt).getTime();
      const interval = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, expiryTime - now);
        setTimeRemaining(remaining);

        if (remaining === 0) {
          setStatus('expired');
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [paymentData?.expiresAt, status]);

  // Poll payment status
  useEffect(() => {
    if (status === 'pending' && paymentData?.paymentId) {
      const pollInterval = setInterval(async () => {
        await checkPaymentStatus();
      }, 3000); // Poll every 3 seconds

      return () => clearInterval(pollInterval);
    }
  }, [status, paymentData?.paymentId]);

  const createPayment = async () => {
    setStatus('creating');
    setError(null);

    try {
      const request: SumUpPaymentRequest = {
        appointmentId,
        services,
        customerInfo,
        paymentType,
        reservationTtlMinutes: paymentType === 'in_store' ? 30 : undefined,
        metadata: {
          source: 'sumup_flow',
          version: '1.0',
        },
      };

      const response = await fetch('/api/payments/sumup/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `sumup_${appointmentId}_${Date.now()}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Erstellen der Zahlung');
      }

      const result: SumUpPaymentResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Ungültige Antwort vom Server');
      }

      setPaymentData(result);
      setStatus('pending');

    } catch (err) {
      console.error('SumUp payment creation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ein unerwarteter Fehler ist aufgetreten';
      setError(errorMessage);
      setStatus('failed');
      onError(errorMessage);
    }
  };

  const checkPaymentStatus = async () => {
    if (!paymentData?.paymentId || isPolling) return;

    setIsPolling(true);

    try {
      const response = await fetch(`/api/payments/${paymentData.paymentId}/status`);

      if (!response.ok) {
        console.warn('Failed to check payment status');
        return;
      }

      const statusData = await response.json();

      if (statusData.status === 'completed') {
        setStatus('completed');
        onSuccess(paymentData);
      } else if (statusData.status === 'failed') {
        setStatus('failed');
        setError('Die Zahlung ist fehlgeschlagen');
      }

    } catch (err) {
      console.warn('Payment status check failed:', err);
    } finally {
      setIsPolling(false);
    }
  };

  const formatTimeRemaining = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const openSumUpApp = () => {
    if (paymentData?.deepLink) {
      window.location.href = paymentData.deepLink;
    }
  };

  const totalAmount = services.reduce((sum, service) => {
    const vatRate = service.vatRate === 'STANDARD' ? 0.081 :
                   service.vatRate === 'REDUCED' ? 0.026 : 0.038;
    const vatAmount = Math.round(service.price * vatRate);
    return sum + service.price + vatAmount;
  }, 0);

  // Render loading state
  if (status === 'creating') {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="text-center">
              <h3 className="font-medium">Zahlung wird vorbereitet...</h3>
              <p className="text-sm text-muted-foreground">
                Bitte warten Sie einen Moment
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (status === 'failed') {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Ein Fehler ist aufgetreten'}
            </AlertDescription>
          </Alert>
          <Button
            onClick={createPayment}
            className="w-full mt-4"
            variant="outline"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Erneut versuchen
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Render success state
  if (status === 'completed') {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <div className="text-center">
              <h3 className="font-medium text-green-700">Zahlung erfolgreich!</h3>
              <p className="text-sm text-muted-foreground">
                Ihre Zahlung wurde erfolgreich verarbeitet
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render expired state
  if (status === 'expired') {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <Timer className="h-4 w-4" />
            <AlertDescription>
              Die Zahlungssitzung ist abgelaufen. Bitte erstellen Sie eine neue Zahlung.
            </AlertDescription>
          </Alert>
          <Button
            onClick={createPayment}
            className="w-full mt-4"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Neue Zahlung erstellen
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Render pending payment state
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Payment Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Store className="h-5 w-5" />
              <span>
                {paymentType === 'in_store' ? 'Im Salon zahlen' : 'Mobile Zahlung'}
              </span>
            </div>
            <Badge variant="secondary">
              {timeRemaining > 0 && (
                <Timer className="mr-1 h-3 w-3" />
              )}
              {formatTimeRemaining(timeRemaining)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-2">
            <p className="text-2xl font-bold">
              CHF {(totalAmount / 100).toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground">
              Zu zahlen für {services.length} Service{services.length !== 1 ? 's' : ''}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Payment Instructions */}
      <Card>
        <CardContent className="pt-6">
          {paymentType === 'in_store' ? (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-medium mb-2">Zahlung im Salon</h3>
                <p className="text-sm text-muted-foreground">
                  Zeigen Sie diesen QR-Code an der Kasse vor oder geben Sie die Referenz an:
                </p>
              </div>

              {/* QR Code */}
              {paymentData?.qrCodeData && (
                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="w-48 h-48 bg-gray-100 rounded flex items-center justify-center">
                      <QrCode className="h-24 w-24 text-gray-400" />
                      {/* In production, use a proper QR code library */}
                    </div>
                  </div>
                </div>
              )}

              {/* Reference Number */}
              <div className="bg-muted/30 p-4 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-1">Referenz-Nummer:</p>
                <p className="font-mono text-lg font-medium">
                  {paymentData?.checkoutReference}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-medium mb-2">Mobile Zahlung</h3>
                <p className="text-sm text-muted-foreground">
                  Öffnen Sie die SumUp App auf Ihrem Smartphone und scannen Sie den QR-Code
                </p>
              </div>

              {/* Mobile App Button */}
              <Button
                onClick={openSumUpApp}
                className="w-full"
                size="lg"
              >
                <Smartphone className="mr-2 h-5 w-5" />
                SumUp App öffnen
              </Button>

              {/* QR Code for mobile */}
              {paymentData?.qrCodeData && (
                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="w-32 h-32 bg-gray-100 rounded flex items-center justify-center">
                      <QrCode className="h-16 w-16 text-gray-400" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Status indicator */}
          <div className="flex items-center justify-center space-x-2 mt-6">
            <div className="flex items-center space-x-2">
              {isPolling ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              )}
              <span className="text-sm text-muted-foreground">
                Warten auf Zahlung...
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bestellübersicht</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {services.map((service, index) => {
            const vatRate = service.vatRate === 'STANDARD' ? 0.081 :
                           service.vatRate === 'REDUCED' ? 0.026 : 0.038;
            const vatAmount = Math.round(service.price * vatRate);
            const total = service.price + vatAmount;

            return (
              <div key={index} className="flex justify-between text-sm">
                <span>{service.name}</span>
                <span>CHF {(total / 100).toFixed(2)}</span>
              </div>
            );
          })}
          <div className="border-t pt-2 flex justify-between font-medium">
            <span>Gesamtbetrag</span>
            <span>CHF {(totalAmount / 100).toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Cancel Button */}
      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          setStatus('failed');
          onError('Zahlung abgebrochen');
        }}
      >
        Zahlung abbrechen
      </Button>
    </div>
  );
}