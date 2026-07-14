'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface ProviderCreateDialogProps {
  children: React.ReactNode;
}

export function ProviderCreateDialog({ children }: ProviderCreateDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    type: 'API' as 'API' | 'MANUAL' | 'CUSTOM',
    apiUrl: '',
    apiKey: '',
    apiSecret: '',
    priority: 50,
    isEnabled: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          type: formData.type,
          apiUrl: formData.apiUrl || undefined,
          credentials: {
            apiKey: formData.apiKey || undefined,
            apiSecret: formData.apiSecret || undefined,
          },
          priority: formData.priority,
          isEnabled: formData.isEnabled,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setOpen(false);
        setFormData({
          name: '',
          slug: '',
          type: 'API',
          apiUrl: '',
          apiKey: '',
          apiSecret: '',
          priority: 50,
          isEnabled: true,
        });
        window.location.reload();
      } else {
        alert(data.error || 'Failed to create provider');
      }
    } catch (error) {
      console.error('Failed to create provider:', error);
      alert('Failed to create provider');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Fulfillment Provider</DialogTitle>
          <DialogDescription>
            Configure a new fulfillment provider for automatic order processing.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Provider Name</Label>
              <Input
                id="name"
                placeholder="My SMM Panel"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">
                Slug <span className="text-xs text-muted-foreground">(lowercase, dashes only)</span>
              </Label>
              <Select
                value={formData.slug}
                onValueChange={(value) => setFormData({ ...formData, slug: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select implementation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="smm-panel">smm-panel (Standard SMM API)</SelectItem>
                  <SelectItem value="mock">mock (Testing Only)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose the provider implementation that matches your API
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Provider Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData({ ...formData, type: value as 'API' | 'MANUAL' | 'CUSTOM' })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="API">API (Automated)</SelectItem>
                <SelectItem value="MANUAL">Manual</SelectItem>
                <SelectItem value="CUSTOM">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiUrl">API URL</Label>
            <Input
              id="apiUrl"
              type="url"
              placeholder="https://api.example.com"
              value={formData.apiUrl}
              onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter API key"
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiSecret">API Secret (Optional)</Label>
              <Input
                id="apiSecret"
                type="password"
                placeholder="Enter API secret"
                value={formData.apiSecret}
                onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">
              Priority (0-100)
              <span className="text-xs text-muted-foreground ml-2">
                Higher priority providers are tried first
              </span>
            </Label>
            <Input
              id="priority"
              type="number"
              min="0"
              max="100"
              value={formData.priority}
              onChange={(e) =>
                setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })
              }
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="enabled">Enable Provider</Label>
              <p className="text-sm text-muted-foreground">
                Enable this provider to start fulfilling orders
              </p>
            </div>
            <Switch
              id="enabled"
              checked={formData.isEnabled}
              onCheckedChange={(checked) => setFormData({ ...formData, isEnabled: checked })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Provider
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
