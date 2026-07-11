'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCardIcon, Loader2Icon, TrashIcon } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

interface SavedCardsProps {
  onSelectCard: (paymentMethodId: string) => void;
  selectedCardId?: string | null;
}

export function SavedCards({ onSelectCard, selectedCardId }: SavedCardsProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/payment-methods');
      if (!response.ok) {
        throw new Error('Failed to fetch payment methods');
      }
      const { data } = await response.json();
      setPaymentMethods(data.paymentMethods || []);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast.error('Failed to load saved cards');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (paymentMethodId: string) => {
    if (!confirm('Are you sure you want to remove this card?')) {
      return;
    }

    setDeletingId(paymentMethodId);
    try {
      const response = await fetch('/api/payment-methods', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete payment method');
      }

      setPaymentMethods((prev) =>
        prev.filter((pm) => pm.id !== paymentMethodId)
      );

      // If the deleted card was selected, clear selection
      if (selectedCardId === paymentMethodId) {
        onSelectCard('');
      }

      toast.success('Card removed successfully');
    } catch (error) {
      console.error('Error deleting payment method:', error);
      toast.error('Failed to remove card');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2Icon className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (paymentMethods.length === 0) {
    return null;
  }

  const getCardBrandName = (brand: string) => {
    const brandMap: Record<string, string> = {
      visa: 'Visa',
      mastercard: 'Mastercard',
      amex: 'American Express',
      discover: 'Discover',
      diners: 'Diners Club',
      jcb: 'JCB',
      unionpay: 'UnionPay',
    };
    return brandMap[brand.toLowerCase()] || brand.toUpperCase();
  };

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">Saved Cards</div>
      <div className="space-y-2">
        {paymentMethods.map((pm) => (
          <div
            key={pm.id}
            className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
              selectedCardId === pm.id
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <button
              type="button"
              className="flex items-center gap-3 flex-1 text-left"
              onClick={() => onSelectCard(pm.id)}
            >
              <CreditCardIcon className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="font-medium">
                  {getCardBrandName(pm.brand)} •••• {pm.last4}
                </div>
                <div className="text-sm text-muted-foreground">
                  Expires {pm.expMonth}/{pm.expYear}
                </div>
              </div>
            </button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(pm.id);
              }}
              disabled={deletingId === pm.id}
            >
              {deletingId === pm.id ? (
                <Loader2Icon className="w-4 h-4 animate-spin" />
              ) : (
                <TrashIcon className="w-4 h-4" />
              )}
            </Button>
          </div>
        ))}
      </div>
      <div className="text-xs text-muted-foreground">
        Select a saved card or enter a new one below
      </div>
    </div>
  );
}
