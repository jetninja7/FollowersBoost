'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckoutStepperProps {
  currentStep: number;
}

const steps = [
  { number: 1, title: 'Configure' },
  { number: 2, title: 'Review' },
  { number: 3, title: 'Payment' },
];

export function CheckoutStepper({ currentStep }: CheckoutStepperProps) {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                  currentStep > step.number
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : currentStep === step.number
                    ? 'border-blue-600 bg-white text-blue-600'
                    : 'border-gray-300 bg-white text-gray-300'
                )}
              >
                {currentStep > step.number ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-semibold">{step.number}</span>
                )}
              </div>
              <span
                className={cn(
                  'mt-2 text-sm font-medium',
                  currentStep >= step.number ? 'text-blue-600' : 'text-gray-500'
                )}
              >
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'mx-4 h-0.5 flex-1',
                  currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
