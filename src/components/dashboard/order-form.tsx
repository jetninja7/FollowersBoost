'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface OrderFormProps {
  service: {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    minQuantity: number;
    maxQuantity: number;
    estimatedDeliveryTime: string;
    isActive: boolean;
    categoryId: string;
    createdAt: Date;
    updatedAt: Date;
    category: {
      id: string;
      name: string;
      slug: string;
      description: string | null;
      platformId: string;
      isActive: boolean;
      displayOrder: number;
      createdAt: Date;
      updatedAt: Date;
      platform: {
        id: string;
        name: string;
        slug: string;
        description: string | null;
        isActive: boolean;
        displayOrder: number;
        createdAt: Date;
        updatedAt: Date;
      };
    };
  };
  userBalance: number;
}

export function OrderForm({ service, userBalance }: OrderFormProps) {
  const router = useRouter();
  const [link, setLink] = useState('');
  const [quantity, setQuantity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const price = service.price;
  const minQuantity = service.minQuantity;
  const maxQuantity = service.maxQuantity;

  // Calculate charge
  const quantityNum = parseInt(quantity) || 0;
  const charge = (quantityNum * price).toFixed(2);
  const chargeNum = parseFloat(charge);

  // Validation
  const isValidQuantity = quantityNum >= minQuantity && quantityNum <= maxQuantity;
  const hasEnoughBalance = chargeNum <= userBalance;
  const isValidLink = link.length > 0;
  const canSubmit = isValidLink && isValidQuantity && hasEnoughBalance && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: service.id,
          targetUrl: link,
          quantity: quantityNum,
          paymentMethod: 'WALLET',
        }),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          throw new Error(data.error?.message || 'Failed to create order');
        } else {
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();

      // Redirect to orders page
      router.push('/dashboard/orders?success=true');
    } catch (err) {
      console.error('Order creation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">{service.category.platform.name === 'Instagram' ? '📷' : '🔷'}</span>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Order</h1>
          <p className="text-gray-600">Place your order below</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Search Bar - Category Selection (Fixed) */}
        <Card>
          <CardContent className="p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border-2">
              <span className="text-2xl">📷</span>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">{service.category.name}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-orange-500" />
                  <span>Start: {service.estimatedDeliveryTime}</span>
                  <Badge variant="secondary" className="ml-2">
                    Updated Service
                  </Badge>
                  <span className="text-green-600">✓ Refill 365 Days</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services Selection (Fixed) */}
        <Card>
          <CardContent className="p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Services</label>
            <div className="p-4 bg-blue-50 border-2 border-blue-500 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-600 text-white">
                    {service.id.slice(0, 3)}
                  </Badge>
                  <span className="font-semibold text-gray-900">{service.name}</span>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-orange-500 inline mr-1" />
                START 1 Min <span className="text-gray-400">◯</span> Real Old Accounts| 365 Days Re...
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardContent className="p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <div className="p-4 bg-gray-50 rounded-lg border space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Start: Ultra Instant [0-5 Min Max]</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Speed - 500K/Day</span>
                <CheckCircle className="w-4 h-4 text-green-500 ml-4" />
                <span>Refill: 365 Days</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>One-click Instant Start</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Drop: No Drop</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Cancel Button: Yes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Refill Button: Yes</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Link Input */}
        <Card>
          <CardContent className="p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Link</label>
            <Input
              type="url"
              placeholder="https://www.instagram.com/jetninja7"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="h-12 text-base bg-gray-50"
              required
            />
          </CardContent>
        </Card>

        {/* Quantity Input */}
        <Card>
          <CardContent className="p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
            <Input
              type="number"
              placeholder="2000"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min={minQuantity}
              max={maxQuantity}
              className="h-12 text-base bg-gray-50"
              required
            />
            <p className="text-sm text-gray-500 mt-2">
              Min: {minQuantity.toLocaleString()} - Max: {maxQuantity.toLocaleString()}
            </p>
            {quantity && !isValidQuantity && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  Quantity must be between {minQuantity.toLocaleString()} and {maxQuantity.toLocaleString()}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Charge Display */}
        <Card>
          <CardContent className="p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Charge</label>
            <div className="text-3xl font-bold text-gray-900 p-4 bg-gray-50 rounded-lg border">
              ₹ {charge}
            </div>
            <div className="flex items-center justify-between mt-2 text-sm">
              <span className="text-gray-600">Your Balance: ₹ {userBalance.toFixed(2)}</span>
              {!hasEnoughBalance && quantity && (
                <span className="text-red-600 font-medium">Insufficient balance</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          disabled={!canSubmit}
          className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            'Place Order'
          )}
        </Button>
      </form>
    </div>
  );
}
