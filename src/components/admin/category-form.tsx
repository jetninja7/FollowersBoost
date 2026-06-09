'use client';

import { useState, FormEvent, useEffect } from 'react';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { XIcon, Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  platforms: Array<{ id: string; name: string }>;
  category?: {
    id: string;
    platformId: string;
    name: string;
    slug: string;
    description: string | null;
    isActive: boolean;
  } | null;
}

export function CategoryForm({
  isOpen,
  onClose,
  onSuccess,
  platforms,
  category = null,
}: CategoryFormProps) {
  const [platformId, setPlatformId] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const isEditMode = !!category;

  // Reset form when category changes or modal opens/closes
  useEffect(() => {
    if (category) {
      setPlatformId(category.platformId);
      setName(category.name);
      setSlug(category.slug);
      setDescription(category.description || '');
      setIsActive(category.isActive);
    } else {
      setPlatformId('');
      setName('');
      setSlug('');
      setDescription('');
      setIsActive(true);
    }
  }, [category, isOpen]);

  const isValidSlug = /^[a-z0-9-]*$/.test(slug);
  const canSubmit =
    platformId.trim().length > 0 &&
    name.trim().length > 0 &&
    name.length <= 50 &&
    slug.trim().length > 0 &&
    isValidSlug &&
    description.length <= 200 &&
    !isProcessing;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!canSubmit) return;

    setIsProcessing(true);

    try {
      const endpoint = isEditMode
        ? `/api/admin/categories/${category.id}`
        : '/api/admin/categories';

      const method = isEditMode ? 'PATCH' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platformId,
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || null,
          isActive,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to save category');
      }

      toast.success(
        `Category ${isEditMode ? 'updated' : 'created'} successfully`
      );

      onSuccess();
      onClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred';
      toast.error(`Failed to ${isEditMode ? 'update' : 'create'} category`, {
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
              {isEditMode ? 'Edit Category' : 'Create Category'}
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
              {/* Platform */}
              <div className="space-y-2">
                <Label htmlFor="platformId">
                  Platform <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={platformId}
                  onValueChange={(value) => setPlatformId(value || '')}
                  disabled={isProcessing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map((platform) => (
                      <SelectItem key={platform.id} value={platform.id}>
                        {platform.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                  placeholder="Followers"
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
                  placeholder="followers"
                  disabled={isProcessing}
                  required
                />
                {!isValidSlug && slug.length > 0 && (
                  <p className="text-xs text-destructive">
                    Only lowercase letters, numbers, and hyphens allowed
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description..."
                  disabled={isProcessing}
                  maxLength={200}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {description.length}/200 characters
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
