'use client';

import { useState, FormEvent } from 'react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { CARD_ELEMENT_OPTIONS } from '@/lib/stripe-ui';
import { XIcon, Loader2Icon, ShieldCheckIcon } from 'lucide-react';
import { toast } from 'sonner';

// Initialize Stripe outside of component to avoid recreating on every render
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export interface OrderPaymentResult {
  orderId: string;
  totalPrice: number;
  quantity: number;
  targetUrl: string;
  notes?: string;
}

interface OrderPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (order: OrderPaymentResult) => void;
  serviceId: string;
  serviceName: string;
  quantity: number;
  targetUrl: string;
  notes?: string;
}

/**
 * Inner payment form for the order. Calls POST /api/orders with
 * paymentMethod: 'STRIPE' to create the order + PaymentIntent, then
 * confirms the card. On success, hands the order back to the parent.
 */
function OrderPaymentForm({
  amount,
  onSuccess,
  onClose,
  serviceId,
  quantity,
  targetUrl,
  notes,
}: {
  amount: number;
  onSuccess: (order: OrderPaymentResult) => void;
  onClose: () => void;
  serviceId: string;
  quantity: number;
  targetUrl: string;
  notes?: string;
}) {
  const stripe = useStripe();
  const elements = useElements();

  const [cardholderName, setCardholderName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);

  const canSubmit =
    stripe &&
    elements &&
    cardholderName.trim() !== '' &&
    cardComplete &&
    !isProcessing;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsProcessing(true);
    setError(null);

    try {
      // 1. Create the order + PaymentIntent.
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId,
          quantity,
          targetUrl,
          notes: notes || undefined,
          paymentMethod: 'STRIPE',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create order');
      }

      const { data } = await response.json();
      if (!data?.clientSecret) {
        throw new Error('No client secret received from server');
      }

      // 2. Confirm card payment.
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found');

      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: { name: cardholderName },
        },
      });

      if (result.error) {
        throw new Error(result.error.message || 'Payment failed');
      }

      toast.success('Order placed successfully', {
        description: `$${amount.toFixed(2)} charged for order`,
      });

      onSuccess({
        orderId: data.orderId,
        totalPrice: amount,
        quantity,
        targetUrl,
        notes,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error('Payment failed', { description: errorMessage });
      // Leave modal open so the user can retry.
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="order-cardholder-name">Cardholder Name</Label>
        <Input
          id="order-cardholder-name"
          type="text"
          placeholder="John Doe"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          disabled={isProcessing}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Card Information</Label>
        <div
          className={cn(
            'rounded-lg border border-input bg-transparent px-2.5 py-3 transition-colors',
            'focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
            isProcessing && 'opacity-50 pointer-events-none',
            error && 'border-destructive'
          )}
        >
          <CardElement
            options={CARD_ELEMENT_OPTIONS}
            onChange={(e) => {
              setCardComplete(e.complete);
              if (e.error) {
                setError(e.error.message);
              } else if (error?.includes('Payment') || error?.includes('card')) {
                // Clear stale card-specific errors when the user starts typing.
                setError(null);
              }
            }}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheckIcon className="w-4 h-4" />
        <span>Payments are secured and encrypted by Stripe.</span>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isProcessing}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!canSubmit}
          className="flex-1"
        >
          {isProcessing ? (
            <>
              <Loader2Icon className="animate-spin" />
              Processing...
            </>
          ) : (
            `Pay $${amount.toFixed(2)}`
          )}
        </Button>
      </div>
    </form>
  );
}

/**
 * OrderPaymentModal — pays for a single order with a card. Created at the
 * checkout review step, replacing the previous "add funds to wallet first"
 * flow. The order is created server-side and confirmed via the returned
 * PaymentIntent client secret.
 */
export function OrderPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  serviceId,
  serviceName,
  quantity,
  targetUrl,
  notes,
  amount,
}: OrderPaymentModalProps & { amount: number }) {
  const elementsOptions: StripeElementsOptions = {
    appearance: { theme: 'stripe' },
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className={cn(
            'fixed inset-0 z-50 bg-black/50 transition-opacity duration-200',
            'data-ending-style:opacity-0 data-starting-style:opacity-0',
            'supports-backdrop-filter:backdrop-blur-sm'
          )}
        />

        <DialogPrimitive.Popup
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2',
            'rounded-lg border border-border bg-popover shadow-lg',
            'transition duration-200 ease-out',
            'data-ending-style:opacity-0 data-ending-style:scale-95',
            'data-starting-style:opacity-0 data-starting-style:scale-95',
            'max-h-[90vh] overflow-y-auto'
          )}
        >
          <div className="flex items-center justify-between border-b border-border p-4">
            <div>
              <DialogPrimitive.Title className="text-lg font-semibold">
                Complete your order
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-sm text-muted-foreground">
                {serviceName} · {quantity.toLocaleString()} units
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close
              render={<Button variant="ghost" size="icon-sm" />}
            >
              <XIcon />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </div>

          <div className="p-4 space-y-4">
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Order total</span>
                <span className="text-2xl font-bold">${amount.toFixed(2)}</span>
              </div>
            </div>

            <Elements stripe={stripePromise} options={elementsOptions}>
              <OrderPaymentForm
                amount={amount}
                onSuccess={onSuccess}
                onClose={onClose}
                serviceId={serviceId}
                quantity={quantity}
                targetUrl={targetUrl}
                notes={notes}
              />
            </Elements>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
