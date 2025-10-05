'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import type {
  ServiceItem,
  CustomerInfo,
  StripeCheckoutRequest,
  StripeCheckoutResponse,
} from '@coiffeur/types/payment-types';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface StripePaymentFormProps {
  appointmentId: string;
  services: ServiceItem[];
  customerInfo: CustomerInfo;
  successUrl: string;
  cancelUrl: string;
  onSuccess: (response: StripeCheckoutResponse) => void;
  onError: (error: string) => void;
  mode?: 'payment' | 'setup';
  className?: string;
}

// Card Element styling
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      '::placeholder': {
        color: '#aab7c4',
      },
      padding: '12px',
    },
    invalid: {
      color: '#9e2146',
    },
  },
  hidePostalCode: false,
};

function PaymentForm({
  appointmentId,
  services,
  customerInfo,
  successUrl,
  cancelUrl,
  onSuccess,
  onError,
  mode = 'payment',
}: Omit<StripePaymentFormProps, 'className'>) {
  const stripe = useStripe();
  const elements = useElements();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  // Customer form state
  const [formData, setFormData] = useState({
    email: customerInfo.email || '',
    name: customerInfo.name || '',
    phone: customerInfo.phone || '',
  });

  const handleCardChange = (event: any) => {
    setCardComplete(event.complete);
    setCardError(event.error ? event.error.message : null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe ist noch nicht geladen. Bitte warten Sie einen Moment.');
      return;
    }

    if (!cardComplete) {
      setError('Bitte geben Sie Ihre Karteninformationen vollständig ein.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create checkout session
      const checkoutRequest: StripeCheckoutRequest = {
        appointmentId,
        services,
        customerInfo: {
          ...formData,
          address: customerInfo.address,
        },
        mode,
        successUrl,
        cancelUrl,
        metadata: {
          source: 'stripe_elements',
          version: '1.0',
        },
      };

      const response = await fetch('/api/payments/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `stripe_${appointmentId}_${Date.now()}`,
        },
        body: JSON.stringify(checkoutRequest),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Erstellen der Zahlung');
      }

      const checkoutResponse: StripeCheckoutResponse = await response.json();

      if (!checkoutResponse.success || !checkoutResponse.sessionUrl) {
        throw new Error(checkoutResponse.error || 'Ungültige Antwort vom Server');
      }

      // Redirect to Stripe Checkout
      window.location.href = checkoutResponse.sessionUrl;

    } catch (err) {
      console.error('Stripe payment error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ein unerwarteter Fehler ist aufgetreten';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate total amount
  const totalAmount = services.reduce((sum, service) => {
    // Add VAT calculation
    const vatRate = service.vatRate === 'STANDARD' ? 0.081 :
                   service.vatRate === 'REDUCED' ? 0.026 : 0.038;
    const vatAmount = Math.round(service.price * vatRate);
    return sum + service.price + vatAmount;
  }, 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Rechnungsinformationen</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail-Adresse *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Vollständiger Name *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefonnummer (optional)</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment Information */}
      <Card>
        <CardHeader>
          <CardTitle>Zahlungsinformationen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Karten-Details *</Label>
            <div className="border rounded-md p-3 bg-background">
              <CardElement
                options={cardElementOptions}
                onChange={handleCardChange}
              />
            </div>
            {cardError && (
              <p className="text-sm text-destructive flex items-center space-x-1">
                <AlertCircle className="h-4 w-4" />
                <span>{cardError}</span>
              </p>
            )}
          </div>

          {/* Payment Summary */}
          <div className="bg-muted/30 p-4 rounded-lg space-y-2">
            <h4 className="font-medium">Zahlungsübersicht</h4>
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
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={!stripe || !cardComplete || isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Zahlung wird verarbeitet...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Jetzt bezahlen - CHF {(totalAmount / 100).toFixed(2)}
          </>
        )}
      </Button>

      {/* Security Info */}
      <div className="text-xs text-muted-foreground text-center space-y-1">
        <p className="flex items-center justify-center space-x-1">
          <CheckCircle className="h-3 w-3 text-green-500" />
          <span>Ihre Zahlung wird sicher mit SSL-Verschlüsselung verarbeitet</span>
        </p>
        <p>Powered by Stripe • PCI DSS compliant</p>
      </div>
    </form>
  );
}

export function StripePaymentForm(props: StripePaymentFormProps) {
  return (
    <div className={props.className}>
      <Elements stripe={stripePromise}>
        <PaymentForm {...props} />
      </Elements>
    </div>
  );
}