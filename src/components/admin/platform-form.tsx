'use client';

import { useState, FormEvent, useEffect } from 'react';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { XIcon, Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';

interface PlatformFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  platform?: {
    id: string;
    name: string;
    slug: string;
    iconUrl: string | null;
    isActive: boolean;
    order: number;
  } | null;
}

export function PlatformForm({
  isOpen,
  onClose,
  onSuccess,
  platform = null,
}: PlatformFormProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [order, setOrder] = useState('0');
  const [isProcessing, setIsProcessing] = useState(false);

  const isEditMode = !!platform;

  // Reset form when platform changes or modal opens/closes
  useEffect(() => {
    if (platform) {
      setName(platform.name);
      setSlug(platform.slug);
      setIconUrl(platform.iconUrl || '');
      setIsActive(platform.isActive);
      setOrder(platform.order.toString());
    } else {
      setName('');
      setSlug('');
      setIconUrl('');
      setIsActive(true);
      setOrder('0');
    }
  }, [platform, isOpen]);

  const isValidSlug = /^[a-z0-9-]*$/.test(slug);
  const canSubmit =
    name.trim().length > 0 &&
    name.length <= 50 &&
    slug.trim().length > 0 &&
    isValidSlug &&
    !isProcessing;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!canSubmit) return;

    setIsProcessing(true);

    try {
      const endpoint = isEditMode
        ? `/api/admin/platforms/${platform.id}`
        : '/api/admin/platforms';

      const method = isEditMode ? 'PATCH' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          iconUrl: iconUrl.trim() || null,
          isActive,
          order: parseInt(order, 10),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to save platform');
      }

      toast.success(
        `Platform ${isEditMode ? 'updated' : 'created'} successfully`
      );

      onSuccess();
      onClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred';
      toast.error(`Failed to ${isEditMode ? 'update' : 'create'} platform`, {
        description: errorMessage,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        {/* Backdrop */}
        <DialogPrimitive.Backdrop
          className={cn(
            'fixed inset-0 z-50 bg-black/50 transition-opacity duration-200',
            'data-ending-style:opacity-0 data-starting-style:opacity-0',
            'supports-backdrop-filter:backdrop-blur-sm'
          )}
        />

        {/* Modal Content */}
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
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border p-4">
            <DialogPrimitive.Title className="text-lg font-semibold">
              {isEditMode ? 'Edit Platform' : 'Create Platform'}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              render={<Button variant="ghost" size="icon-sm" />}
            >
              <XIcon />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </div>

          {/* Body */}
          <div className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Instagram"
                  disabled={isProcessing}
                  maxLength={50}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {name.length}/50 characters
                </p>
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug">
                  Slug <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="slug"
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase())}
                  placeholder="instagram"
                  disabled={isProcessing}
                  required
                />
                {!isValidSlug && slug.length > 0 && (
                  <p className="text-xs text-destructive">
                    Only lowercase letters, numbers, and hyphens allowed
                  </p>
                )}
              </div>

              {/* Icon URL */}
              <div className="space-y-2">
                <Label htmlFor="iconUrl">Icon URL</Label>
                <Input
                  id="iconUrl"
                  type="url"
                  value={iconUrl}
                  onChange={(e) => setIconUrl(e.target.value)}
                  placeholder="https://example.com/icon.png"
                  disabled={isProcessing}
                />
              </div>

              {/* Order */}
              <div className="space-y-2">
                <Label htmlFor="order">Order</Label>
                <Input
                  id="order"
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                  placeholder="0"
                  disabled={isProcessing}
                  min="0"
                />
                <p className="text-xs text-muted-foreground">
                  Display order (lower numbers appear first)
                </p>
              </div>

              {/* Is Active */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={(checked) =>
                    setIsActive(checked === true)
                  }
                  disabled={isProcessing}
                />
                <label
                  htmlFor="isActive"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Active
                </label>
              </div>

              {/* Action Buttons */}
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
                <Button type="submit" disabled={!canSubmit} className="flex-1">
                  {isProcessing ? (
                    <>
                      <Loader2Icon className="animate-spin" />
                      {isEditMode ? 'Updating...' : 'Creating...'}
                    </>
                  ) : isEditMode ? (
                    'Update'
                  ) : (
                    'Create'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
