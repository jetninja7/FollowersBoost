'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Activity, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';

interface Provider {
  id: string;
  name: string;
  slug: string;
  type: string;
  isEnabled: boolean;
  priority: number;
  apiUrl: string | null;
  statistics: {
    totalOrders: number;
    successfulOrders: number;
    failedOrders: number;
    successRate: number;
  };
  health: {
    isHealthy: boolean;
    errorRate: number;
    averageResponseTime?: number;
    lastSuccessfulCall?: string;
    lastFailedCall?: string;
  } | null;
}

interface ProviderEditDialogProps {
  provider: Provider;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ProviderEditDialog({
  provider,
  open,
  onOpenChange,
  onSuccess,
}: ProviderEditDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: provider.name,
    apiUrl: provider.apiUrl || '',
    apiKey: '',
    apiSecret: '',
    priority: provider.priority,
    isEnabled: provider.isEnabled,
  });

  useEffect(() => {
    setFormData({
      name: provider.name,
      apiUrl: provider.apiUrl || '',
      apiKey: '',
      apiSecret: '',
      priority: provider.priority,
      isEnabled: provider.isEnabled,
    });
  }, [provider]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData: Record<string, unknown> = {
        name: formData.name,
        priority: formData.priority,
        isEnabled: formData.isEnabled,
      };

      if (formData.apiUrl) {
        updateData.apiUrl = formData.apiUrl;
      }

      const credentials: Record<string, string> = {};
      if (formData.apiKey) credentials.apiKey = formData.apiKey;
      if (formData.apiSecret) credentials.apiSecret = formData.apiSecret;

      if (Object.keys(credentials).length > 0) {
        updateData.credentials = credentials;
      }

      const response = await fetch(`/api/admin/providers/${provider.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
      } else {
        alert(data.error || 'Failed to update provider');
      }
    } catch (error) {
      console.error('Failed to update provider:', error);
      alert('Failed to update provider');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Provider: {provider.name}</DialogTitle>
          <DialogDescription>Update provider settings and credentials</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="health">Health</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Provider Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Slug (Read-only)</Label>
                <Input value={provider.slug} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-apiUrl">API URL</Label>
                <Input
                  id="edit-apiUrl"
                  type="url"
                  placeholder="https://api.example.com"
                  value={formData.apiUrl}
                  onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-2">
                <p className="text-sm text-blue-900">
                  🔒 <strong>Credentials are encrypted</strong> - API keys and secrets are stored securely using AES-256-GCM encryption
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-apiKey">
                    API Key
                    <span className="text-xs text-muted-foreground ml-2">(leave empty to keep current)</span>
                  </Label>
                  <Input
                    id="edit-apiKey"
                    type="password"
                    placeholder="Enter new API key"
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-apiSecret">
                    API Secret
                    <span className="text-xs text-muted-foreground ml-2">(optional)</span>
                  </Label>
                  <Input
                    id="edit-apiSecret"
                    type="password"
                    placeholder="Enter new API secret"
                    value={formData.apiSecret}
                    onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-priority">Priority (0-100)</Label>
                <Input
                  id="edit-priority"
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
                  <Label htmlFor="edit-enabled">Enable Provider</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable to allow order fulfillment
                  </p>
                </div>
                <Switch
                  id="edit-enabled"
                  checked={formData.isEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, isEnabled: checked })}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="health" className="space-y-4">
            {provider.health ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Health Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status</span>
                      {provider.health.isHealthy ? (
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-green-500" />
                          <span className="text-sm font-medium text-green-700">Healthy</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-red-500" />
                          <span className="text-sm font-medium text-red-700">Unhealthy</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Error Rate</span>
                      <span className="text-sm">{(provider.health.errorRate * 100).toFixed(2)}%</span>
                    </div>

                    {provider.health.averageResponseTime && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Avg Response Time</span>
                        <span className="text-sm">{provider.health.averageResponseTime}ms</span>
                      </div>
                    )}

                    {provider.health.lastSuccessfulCall && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Last Success</span>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(provider.health.lastSuccessfulCall), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    )}

                    {provider.health.lastFailedCall && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Last Failure</span>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(provider.health.lastFailedCall), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <p>Provider not initialized yet</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="statistics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{provider.statistics.totalOrders}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {provider.statistics.successRate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {provider.statistics.successfulOrders} successful
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Successful Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {provider.statistics.successfulOrders}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Failed Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {provider.statistics.failedOrders}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
