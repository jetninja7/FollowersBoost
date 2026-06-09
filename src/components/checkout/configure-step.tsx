'use client';

import { useState, useMemo } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ConfigureStepProps {
  service: {
    id: string;
    name: string;
    platform: string;
    price: number | { toNumber?: () => number };
    minQuantity: number;
    maxQuantity: number;
    deliveryTime: string;
  };
  initialData?: {
    quantity?: number;
    targetUrl?: string;
    notes?: string;
  };
  onNext: (data: { quantity: number; targetUrl: string; notes?: string }) => void;
  onCancel: () => void;
}

export function ConfigureStep({
  service,
  initialData,
  onNext,
  onCancel,
}: ConfigureStepProps) {
  // Normalize price to number
  const servicePrice = useMemo(() => {
    if (typeof service.price === 'number') {
      return service.price;
    }
    if (service.price && typeof service.price === 'object' && 'toNumber' in service.price) {
      return service.price.toNumber?.() ?? 0;
    }
    return 0;
  }, [service.price]);

  // Form state
  const [quantity, setQuantity] = useState(
    initialData?.quantity ?? service.minQuantity
  );
  const [targetUrl, setTargetUrl] = useState(initialData?.targetUrl ?? '');
  const [notes, setNotes] = useState(initialData?.notes ?? '');

  // Validation state
  const [urlError, setUrlError] = useState<string | null>(null);
  const [quantityError, setQuantityError] = useState<string | null>(null);

  // Validate URL
  const validateUrl = (url: string): boolean => {
    if (!url.trim()) {
      setUrlError('Target URL is required');
      return false;
    }

    try {
      const urlObj = new URL(url);
      if (!urlObj.protocol.startsWith('http')) {
        setUrlError('URL must start with http:// or https://');
        return false;
      }
      setUrlError(null);
      return true;
    } catch {
      setUrlError('Please enter a valid URL');
      return false;
    }
  };

  // Validate quantity
  const validateQuantity = (qty: number): boolean => {
    if (qty < service.minQuantity) {
      setQuantityError(`Minimum quantity is ${service.minQuantity}`);
      return false;
    }
    if (qty > service.maxQuantity) {
      setQuantityError(`Maximum quantity is ${service.maxQuantity}`);
      return false;
    }
    setQuantityError(null);
    return true;
  };

  // Calculate total price
  const totalPrice = useMemo(() => {
    return (quantity * servicePrice).toFixed(2);
  }, [quantity, servicePrice]);

  // Handle quantity change
  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity);
    validateQuantity(newQuantity);
  };

  // Handle increment
  const handleIncrement = () => {
    const newQuantity = Math.min(quantity + 100, service.maxQuantity);
    handleQuantityChange(newQuantity);
  };

  // Handle decrement
  const handleDecrement = () => {
    const newQuantity = Math.max(quantity - 100, service.minQuantity);
    handleQuantityChange(newQuantity);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const isUrlValid = validateUrl(targetUrl);
    const isQuantityValid = validateQuantity(quantity);

    if (isUrlValid && isQuantityValid) {
      onNext({
        quantity,
        targetUrl: targetUrl.trim(),
        notes: notes.trim() || undefined,
      });
    }
  };

  // Check if form is valid
  const isFormValid = useMemo(() => {
    if (!targetUrl.trim()) return false;
    if (quantity < service.minQuantity || quantity > service.maxQuantity)
      return false;
    try {
      new URL(targetUrl);
      return true;
    } catch {
      return false;
    }
  }, [targetUrl, quantity, service.minQuantity, service.maxQuantity]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Service Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>{service.name}</CardTitle>
          <CardDescription>
            {service.platform} • ${servicePrice.toFixed(2)} per unit
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          <div>
            <span className="font-medium">Min/Max Quantity:</span>{' '}
            {service.minQuantity.toLocaleString()} -{' '}
            {service.maxQuantity.toLocaleString()}
          </div>
          <div>
            <span className="font-medium">Estimated Delivery:</span>{' '}
            {service.deliveryTime}
          </div>
        </CardContent>
      </Card>

      {/* Quantity Selector */}
      <div className="space-y-2">
        <Label htmlFor="quantity">Quantity</Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleDecrement}
            disabled={quantity <= service.minQuantity}
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Input
            id="quantity"
            type="number"
            value={quantity}
            onChange={(e) => {
              const value = parseInt(e.target.value) || service.minQuantity;
              handleQuantityChange(value);
            }}
            min={service.minQuantity}
            max={service.maxQuantity}
            className={cn(
              'text-center',
              quantityError && 'border-destructive focus-visible:ring-destructive/20'
            )}
            aria-invalid={!!quantityError}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleIncrement}
            disabled={quantity >= service.maxQuantity}
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {quantityError && (
          <p className="text-sm text-destructive">{quantityError}</p>
        )}
      </div>

      {/* Target URL Input */}
      <div className="space-y-2">
        <Label htmlFor="targetUrl">Target URL</Label>
        <Input
          id="targetUrl"
          type="url"
          placeholder="https://instagram.com/yourprofile"
          value={targetUrl}
          onChange={(e) => {
            setTargetUrl(e.target.value);
            if (urlError) validateUrl(e.target.value);
          }}
          onBlur={() => targetUrl && validateUrl(targetUrl)}
          className={cn(
            urlError && 'border-destructive focus-visible:ring-destructive/20'
          )}
          aria-invalid={!!urlError}
        />
        <p className="text-sm text-muted-foreground">
          The profile/post link where the service will be delivered
        </p>
        {urlError && <p className="text-sm text-destructive">{urlError}</p>}
      </div>

      {/* Order Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <textarea
          id="notes"
          placeholder="Any special instructions..."
          value={notes}
          onChange={(e) => {
            if (e.target.value.length <= 500) {
              setNotes(e.target.value);
            }
          }}
          maxLength={500}
          rows={4}
          className={cn(
            'w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none',
            'placeholder:text-muted-foreground resize-none',
            'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
            'disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50',
            'md:text-sm dark:bg-input/30 dark:disabled:bg-input/80'
          )}
        />
        <p className="text-xs text-muted-foreground text-right">
          {notes.length}/500 characters
        </p>
      </div>

      {/* Price Summary */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between text-lg font-semibold">
            <span>Total:</span>
            <span className="text-2xl">${totalPrice}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {quantity.toLocaleString()} × ${servicePrice.toFixed(2)} per unit
          </p>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={!isFormValid} className="flex-1">
          Continue to Review
        </Button>
      </div>
    </form>
  );
}
