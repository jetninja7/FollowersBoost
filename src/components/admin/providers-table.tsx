'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, RefreshCw, Settings, Trash, Activity, AlertCircle } from 'lucide-react';
import { ProviderEditDialog } from './provider-edit-dialog';
import { formatDistanceToNow } from 'date-fns';

interface Provider {
  id: string;
  name: string;
  slug: string;
  type: string;
  isEnabled: boolean;
  priority: number;
  apiUrl: string | null;
  servicesCount: number;
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
  lastHealthCheck: string | null;
  createdAt: string;
  updatedAt: string;
}

export function ProvidersTable() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/admin/providers');
      const data = await response.json();
      if (data.success) {
        setProviders(data.providers);
      }
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this provider?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/providers/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setProviders((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert(data.error || 'Failed to delete provider');
      }
    } catch (error) {
      console.error('Failed to delete provider:', error);
      alert('Failed to delete provider');
    }
  };

  const handleToggleEnabled = async (provider: Provider) => {
    try {
      const response = await fetch(`/api/admin/providers/${provider.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: !provider.isEnabled }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchProviders();
      } else {
        alert(data.error || 'Failed to update provider');
      }
    } catch (error) {
      console.error('Failed to toggle provider:', error);
      alert('Failed to update provider');
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading providers...</div>;
  }

  if (providers.length === 0) {
    return (
      <div className="text-center py-12">
        <Activity className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-semibold">No providers configured</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Add your first fulfillment provider to enable automatic order processing.
        </p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Provider</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Health</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead className="text-right">Services</TableHead>
            <TableHead className="text-right">Success Rate</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {providers.map((provider) => (
            <TableRow key={provider.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{provider.name}</div>
                  <div className="text-sm text-muted-foreground">{provider.slug}</div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{provider.type}</Badge>
              </TableCell>
              <TableCell>
                {provider.isEnabled ? (
                  <Badge className="bg-green-500">Enabled</Badge>
                ) : (
                  <Badge variant="secondary">Disabled</Badge>
                )}
              </TableCell>
              <TableCell>
                {provider.health ? (
                  <div className="flex items-center gap-2">
                    {provider.health.isHealthy ? (
                      <div className="flex items-center gap-1 text-sm">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <span className="text-green-700">Healthy</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-sm">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <span className="text-red-700">Unhealthy</span>
                      </div>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {(provider.health.errorRate * 100).toFixed(1)}% error
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Not initialized</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{provider.priority}</Badge>
              </TableCell>
              <TableCell className="text-right">{provider.servicesCount}</TableCell>
              <TableCell className="text-right">
                <div className="text-sm">
                  {provider.statistics.totalOrders > 0 ? (
                    <span
                      className={
                        provider.statistics.successRate >= 80
                          ? 'text-green-600 font-medium'
                          : provider.statistics.successRate >= 50
                            ? 'text-yellow-600 font-medium'
                            : 'text-red-600 font-medium'
                      }
                    >
                      {provider.statistics.successRate.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-muted-foreground">N/A</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {provider.statistics.successfulOrders}/{provider.statistics.totalOrders} orders
                </div>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setEditingProvider(provider)}>
                      <Settings className="mr-2 h-4 w-4" />
                      Edit Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleEnabled(provider)}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      {provider.isEnabled ? 'Disable' : 'Enable'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDelete(provider.id)}
                      className="text-red-600"
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {editingProvider && (
        <ProviderEditDialog
          provider={editingProvider}
          open={!!editingProvider}
          onOpenChange={(open) => !open && setEditingProvider(null)}
          onSuccess={() => {
            fetchProviders();
            setEditingProvider(null);
          }}
        />
      )}
    </>
  );
}
