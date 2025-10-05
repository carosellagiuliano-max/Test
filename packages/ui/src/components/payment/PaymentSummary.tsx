'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import {
  Receipt,
  Info,
  Calculator,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import type {
  ServiceItem,
  VATRateType,
  PaymentCalculation,
} from '@coiffeur/types/payment-types';

interface PaymentSummaryProps {
  services: ServiceItem[];
  showVATBreakdown?: boolean;
  showServiceDetails?: boolean;
  className?: string;
}

// Swiss VAT rates
const VAT_RATES = {
  STANDARD: 0.081, // 8.1%
  REDUCED: 0.026,  // 2.6%
  SPECIAL: 0.038,  // 3.8%
} as const;

// VAT rate display names
const VAT_RATE_NAMES = {
  STANDARD: 'Standard (8.1%)',
  REDUCED: 'Reduziert (2.6%)',
  SPECIAL: 'Spezial (3.8%)',
} as const;

export function PaymentSummary({
  services,
  showVATBreakdown = true,
  showServiceDetails = true,
  className = '',
}: PaymentSummaryProps) {
  // Calculate payment breakdown
  const calculatePaymentBreakdown = (): PaymentCalculation => {
    const serviceCalculations = services.map(service => {
      const vatAmount = Math.round(service.price * VAT_RATES[service.vatRate]);
      const totalAmount = service.price + vatAmount;

      return {
        serviceId: service.id,
        serviceName: service.name,
        baseAmount: service.price,
        vatRate: service.vatRate,
        vatAmount,
        totalAmount,
      };
    });

    const subtotal = serviceCalculations.reduce((sum, calc) => sum + calc.baseAmount, 0);
    const totalVAT = serviceCalculations.reduce((sum, calc) => sum + calc.vatAmount, 0);
    const grandTotal = subtotal + totalVAT;

    // Create VAT breakdown by rate
    const vatBreakdown: PaymentCalculation['vatBreakdown'] = {};

    for (const calc of serviceCalculations) {
      const rateKey = calc.vatRate;
      if (!vatBreakdown[rateKey]) {
        vatBreakdown[rateKey] = {
          baseAmount: 0,
          vatAmount: 0,
          rate: VAT_RATES[rateKey],
        };
      }

      vatBreakdown[rateKey]!.baseAmount += calc.baseAmount;
      vatBreakdown[rateKey]!.vatAmount += calc.vatAmount;
    }

    return {
      services: serviceCalculations,
      subtotal,
      totalVAT,
      grandTotal,
      vatBreakdown,
    };
  };

  const breakdown = calculatePaymentBreakdown();

  const formatCurrency = (amountInCents: number): string => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amountInCents / 100);
  };

  const getServiceIcon = (service: ServiceItem) => {
    // Return appropriate icon based on service duration or type
    if (service.duration && service.duration >= 120) {
      return <Clock className="h-4 w-4 text-blue-500" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getVATRateBadgeVariant = (vatRate: VATRateType) => {
    switch (vatRate) {
      case 'STANDARD':
        return 'default' as const;
      case 'REDUCED':
        return 'secondary' as const;
      case 'SPECIAL':
        return 'outline' as const;
      default:
        return 'default' as const;
    }
  };

  if (services.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Keine Services ausgewählt</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Receipt className="h-5 w-5" />
          <span>Zahlungsübersicht</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Service Details */}
        {showServiceDetails && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Services
            </h4>
            {breakdown.services.map((service, index) => (
              <div key={service.serviceId} className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      {getServiceIcon(services[index])}
                      <span className="font-medium">{service.serviceName}</span>
                      <Badge
                        variant={getVATRateBadgeVariant(service.vatRate)}
                        className="text-xs"
                      >
                        {VAT_RATE_NAMES[service.vatRate]}
                      </Badge>
                    </div>
                    {services[index].description && (
                      <p className="text-sm text-muted-foreground">
                        {services[index].description}
                      </p>
                    )}
                    {services[index].duration && (
                      <p className="text-xs text-muted-foreground">
                        Dauer: {services[index].duration} Min.
                      </p>
                    )}
                  </div>
                  <div className="text-right space-y-1">
                    <div className="font-medium">
                      {formatCurrency(service.totalAmount)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(service.baseAmount)} + {formatCurrency(service.vatAmount)} MwSt.
                    </div>
                  </div>
                </div>
                {index < breakdown.services.length - 1 && (
                  <Separator className="mt-2" />
                )}
              </div>
            ))}
          </div>
        )}

        <Separator />

        {/* Cost Breakdown */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Zwischensumme</span>
            <span>{formatCurrency(breakdown.subtotal)}</span>
          </div>

          {/* VAT Breakdown */}
          {showVATBreakdown && Object.entries(breakdown.vatBreakdown).map(([rateKey, data]) => (
            <div key={rateKey} className="flex justify-between text-sm text-muted-foreground">
              <span className="flex items-center space-x-1">
                <Calculator className="h-3 w-3" />
                <span>MwSt. {VAT_RATE_NAMES[rateKey as VATRateType]}</span>
              </span>
              <span>{formatCurrency(data.vatAmount)}</span>
            </div>
          ))}

          <Separator />

          <div className="flex justify-between text-lg font-semibold">
            <span>Gesamtbetrag</span>
            <span>{formatCurrency(breakdown.grandTotal)}</span>
          </div>
        </div>

        {/* VAT Information */}
        {showVATBreakdown && (
          <div className="bg-muted/30 p-3 rounded-lg">
            <div className="flex items-start space-x-2">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium">Mehrwertsteuer (MwSt.) Information</p>
                <p>
                  Alle Preise inkl. der gesetzlichen Schweizer Mehrwertsteuer.
                  Die MwSt.-Sätze entsprechen den aktuellen Bestimmungen der Eidgenössischen Steuerverwaltung.
                </p>
                <div className="mt-2 space-y-1">
                  <p>• Standard: 8.1% (normale Dienstleistungen)</p>
                  <p>• Reduziert: 2.6% (Beherbergung)</p>
                  <p>• Spezial: 3.8% (Lebensmittel, Bücher, Medikamente)</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Security Notice */}
        <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <div className="text-xs text-green-700 dark:text-green-300">
              <p className="font-medium">Sichere Zahlung</p>
              <p>
                Ihre Zahlung wird SSL-verschlüsselt und entsprechend den
                Swiss Banking Standards verarbeitet.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}