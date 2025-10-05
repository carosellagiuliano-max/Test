'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { CreditCard, Smartphone, QrCode, Store } from 'lucide-react';
import type { PaymentProvider } from '@coiffeur/types/payment-types';

export interface PaymentMethod {
  provider: PaymentProvider;
  type: 'online' | 'in_store';
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  recommended?: boolean;
}

interface PaymentMethodSelectorProps {
  methods: PaymentMethod[];
  selectedMethod?: PaymentMethod;
  onMethodSelect: (method: PaymentMethod) => void;
  className?: string;
}

export function PaymentMethodSelector({
  methods,
  selectedMethod,
  onMethodSelect,
  className = '',
}: PaymentMethodSelectorProps) {
  const [hoveredMethod, setHoveredMethod] = useState<PaymentMethod | null>(null);

  const getDefaultMethods = (): PaymentMethod[] => [
    {
      provider: 'stripe',
      type: 'online',
      name: 'Online-Zahlung',
      description: 'Sichere Zahlung mit Kreditkarte oder Bankkarte',
      icon: <CreditCard className="h-6 w-6" />,
      enabled: true,
      recommended: true,
    },
    {
      provider: 'sumup',
      type: 'in_store',
      name: 'Im Salon zahlen',
      description: 'Zahlung vor Ort mit Karte oder Smartphone',
      icon: <Store className="h-6 w-6" />,
      enabled: true,
    },
  ];

  const availableMethods = methods.length > 0 ? methods : getDefaultMethods();
  const enabledMethods = availableMethods.filter(method => method.enabled);

  if (enabledMethods.length === 0) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Keine Zahlungsmethoden verfügbar
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Zahlungsmethode wählen</h3>
        <p className="text-sm text-muted-foreground">
          Wählen Sie Ihre bevorzugte Zahlungsmethode für die Terminbuchung
        </p>
      </div>

      <div className="grid gap-3">
        {enabledMethods.map((method) => {
          const isSelected = selectedMethod?.provider === method.provider &&
                           selectedMethod?.type === method.type;
          const isHovered = hoveredMethod?.provider === method.provider &&
                          hoveredMethod?.type === method.type;

          return (
            <Card
              key={`${method.provider}-${method.type}`}
              className={`cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'border-primary bg-primary/5 shadow-md'
                  : isHovered
                  ? 'border-primary/50 shadow-sm'
                  : 'border-border hover:border-primary/30'
              }`}
              onMouseEnter={() => setHoveredMethod(method)}
              onMouseLeave={() => setHoveredMethod(null)}
              onClick={() => onMethodSelect(method)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {method.icon}
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{method.name}</h4>
                        {method.recommended && (
                          <Badge variant="secondary" className="text-xs">
                            Empfohlen
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {method.description}
                      </p>

                      {/* Additional info based on method type */}
                      {method.type === 'online' && (
                        <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center space-x-1">
                            <CreditCard className="h-3 w-3" />
                            <span>Visa, Mastercard, AMEX</span>
                          </span>
                        </div>
                      )}

                      {method.type === 'in_store' && (
                        <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center space-x-1">
                            <Smartphone className="h-3 w-3" />
                            <span>Kontaktlos</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <QrCode className="h-3 w-3" />
                            <span>QR-Code</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Selection indicator */}
                  <div className={`w-4 h-4 rounded-full border-2 transition-all ${
                    isSelected
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground/30'
                  }`}>
                    {isSelected && (
                      <div className="w-full h-full rounded-full bg-primary-foreground scale-50" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Security notice */}
      <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
        <p className="flex items-center space-x-2">
          <span className="w-1 h-1 bg-green-500 rounded-full"></span>
          <span>
            Alle Zahlungen sind SSL-verschlüsselt und entsprechen den Swiss Banking Standards
          </span>
        </p>
      </div>
    </div>
  );
}