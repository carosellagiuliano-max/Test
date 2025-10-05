'use client';

import React from 'react';
import { BookingWizardStep } from '@repo/types';

interface ProgressIndicatorProps {
  steps: BookingWizardStep[];
  currentStep: number;
  className?: string;
}

export function ProgressIndicator({ steps, currentStep, className = '' }: ProgressIndicatorProps) {
  const getStepStatus = (step: BookingWizardStep) => {
    if (step.completed) return 'completed';
    if (step.step === currentStep) return 'current';
    if (step.step < currentStep) return 'completed';
    return 'upcoming';
  };

  const getStepClasses = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-600 text-white border-green-600';
      case 'current':
        return 'bg-blue-600 text-white border-blue-600';
      default:
        return 'bg-gray-200 text-gray-600 border-gray-300';
    }
  };

  const getConnectorClasses = (step: BookingWizardStep, index: number) => {
    if (index === steps.length - 1) return ''; // No connector for last step

    const nextStep = steps[index + 1];
    if (step.completed || step.step < currentStep) {
      return 'bg-green-600';
    }
    return 'bg-gray-300';
  };

  return (
    <div className={`progress-indicator ${className}`}>
      <nav aria-label="Progress">
        <ol className="flex items-center">
          {steps.map((step, index) => {
            const status = getStepStatus(step);
            const isLast = index === steps.length - 1;

            return (
              <li key={step.step} className={`relative ${!isLast ? 'pr-8 sm:pr-20' : ''}`}>
                {/* Step Circle */}
                <div className="flex items-center">
                  <div
                    className={`relative flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${getStepClasses(status)}`}
                  >
                    {status === 'completed' ? (
                      <svg
                        className="h-5 w-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <span className="text-sm font-medium">{step.step}</span>
                    )}
                  </div>

                  {/* Step Info */}
                  <div className="ml-4 min-w-0 hidden sm:block">
                    <div className={`text-sm font-medium ${
                      status === 'current' ? 'text-blue-600' :
                      status === 'completed' ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </div>
                    {step.description && (
                      <div className="text-xs text-gray-500 mt-1">
                        {step.description}
                      </div>
                    )}
                  </div>
                </div>

                {/* Connector Line */}
                {!isLast && (
                  <div
                    className={`absolute top-4 left-8 -ml-px h-0.5 w-full sm:w-12 transition-colors ${getConnectorClasses(step, index)}`}
                    aria-hidden="true"
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Mobile Step Info */}
      <div className="mt-4 sm:hidden">
        <div className="text-sm">
          <span className="font-medium text-gray-900">
            Step {currentStep} of {steps.length}:
          </span>
          <span className="ml-2 text-gray-600">
            {steps.find(s => s.step === currentStep)?.title}
          </span>
        </div>
        {steps.find(s => s.step === currentStep)?.description && (
          <div className="text-xs text-gray-500 mt-1">
            {steps.find(s => s.step === currentStep)?.description}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
            style={{
              width: `${(currentStep / steps.length) * 100}%`
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Start</span>
          <span>{Math.round((currentStep / steps.length) * 100)}% Complete</span>
          <span>Finish</span>
        </div>
      </div>
    </div>
  );
}