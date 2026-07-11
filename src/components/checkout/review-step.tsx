'use client';

import { useState, useMemo } from 'react';
import { CheckCircle, CreditCardIcon, WalletIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ReviewStepProps {
  orderData: {
    service: {
      name: string;
      platform: string;
      price: number | { toNumber?: () => number };
      deliveryTime: string;
    };
    quantity: number;
    targetUrl: string;
    notes?: string;
  };
  walletBalance: number;
  onBack: () => void;
  // User pays for the order. Caller is responsible for opening the right
  // modal based on the chosen payment method.
  onPay: (method: 'STRIPE' | 'WALLET') => void;
}

export function ReviewStep({
  orderData,
  walletBalance,
  onBack,
  onPay,
}: ReviewStepProps) {
  // State for terms checkbox + payment method choice
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'STRIPE' | 'WALLET'>(
    walletBalance > 0 ? 'WALLET' : 'STRIPE'
  );

  // Normalize service price to number
  const servicePrice = useMemo(() => {
    if (typeof orderData.service.price === 'number') {
      return orderData.service.price;
    }
    if (
      orderData.service.price &&
      typeof orderData.service.price === 'object' &&
      'toNumber' in orderData.service.price
    ) {
      return orderData.service.price.toNumber?.() ?? 0;
    }
    return 0;
  }, [orderData.service.price]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    return orderData.quantity * servicePrice;
  }, [orderData.quantity, servicePrice]);

  const hasSufficientBalance = walletBalance >= totalPrice;
  const deficit = hasSufficientBalance ? 0 : totalPrice - walletBalance;

  // When wallet is short, only Stripe is available. Otherwise the user
  // can pick either path.
  const walletSelectable = hasSufficientBalance;

  const canProceed = termsAccepted && (paymentMethod === 'STRIPE' || hasSufficientBalance);

  return (
    <div className="space-y-6">
      {/* Order Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
          <CardDescription>Review your order details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">{orderData.service.name}</div>
                <div className="text-sm text-muted-foreground">
                  {orderData.service.platform}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="text-sm font-medium text-muted-foreground">
                Target URL
              </div>
              <div className="text-sm break-all">{orderData.targetUrl}</div>
            </div>

            <div className="pt-2 border-t">
              <div className="text-sm font-medium text-muted-foreground">
                Estimated Delivery
              </div>
              <div className="text-sm">{orderData.service.deliveryTime}</div>
            </div>

            {orderData.notes && (
              <div className="pt-2 border-t">
                <div className="text-sm font-medium text-muted-foreground">
                  Order Notes
                </div>
                <div className="text-sm whitespace-pre-wrap">
                  {orderData.notes}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Price Breakdown Card */}
      <Card>
        <CardHeader>
          <CardTitle>Price Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Unit Price</span>
            <span>${servicePrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Quantity</span>
            <span>{orderData.quantity.toLocaleString()}</span>
          </div>
          <div className="pt-3 border-t">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-2xl font-bold">${totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="text-sm font-medium text-muted-foreground">
              Your wallet balance:{' '}
              <span className="text-foreground">${walletBalance.toFixed(2)}</span>
            </div>

            {!hasSufficientBalance && (
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
                <CheckCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-medium">
                  You need ${deficit.toFixed(2)} more in your wallet — paying by card instead
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => walletSelectable && setPaymentMethod('WALLET')}
                disabled={!walletSelectable}
                className={cn(
                  'flex items-start gap-3 rounded-lg border p-4 text-left transition-colors',
                  paymentMethod === 'WALLET' && walletSelectable
                    ? 'border-primary bg-primary/5'
                    : 'border-input hover:border-primary/50',
                  !walletSelectable && 'opacity-50 cursor-not-allowed'
                )}
                aria-pressed={paymentMethod === 'WALLET'}
              >
                <WalletIcon className="h-5 w-5 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium">Wallet</div>
                  <div className="text-xs text-muted-foreground">
                    Pay from your pre-funded balance
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('STRIPE')}
                className={cn(
                  'flex items-start gap-3 rounded-lg border p-4 text-left transition-colors',
                  paymentMethod === 'STRIPE'
                    ? 'border-primary bg-primary/5'
                    : 'border-input hover:border-primary/50'
                )}
                aria-pressed={paymentMethod === 'STRIPE'}
              >
                <CreditCardIcon className="h-5 w-5 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium">Credit / Debit Card</div>
                  <div className="text-xs text-muted-foreground">
                    Pay securely with Stripe
                  </div>
                </div>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Terms & Conditions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="terms"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className={cn(
                'mt-1 h-4 w-4 rounded border-input text-primary cursor-pointer',
                'focus:ring-2 focus:ring-ring focus:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
              aria-describedby="terms-description"
            />
            <div className="flex-1">
              <Label
                htmlFor="terms"
                className="text-sm font-medium cursor-pointer"
              >
                I agree to the{' '}
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  terms of service
                </a>
              </Label>
              <p
                id="terms-description"
                className="text-xs text-muted-foreground mt-1"
              >
                Required to proceed with your order
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={() => onPay(paymentMethod)}
          disabled={!canProceed}
          className="flex-1"
        >
          {paymentMethod === 'STRIPE' ? 'Pay with Card' : 'Pay from Wallet'}
        </Button>
      </div>
    </div>
  );
}
