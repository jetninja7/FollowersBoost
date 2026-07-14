import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ProvidersTable } from '@/components/admin/providers-table';
import { ProviderCreateDialog } from '@/components/admin/provider-create-dialog';

export default function ProvidersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fulfillment Providers</h1>
          <p className="text-muted-foreground mt-1">
            Manage external providers for automatic order fulfillment
          </p>
        </div>
        <ProviderCreateDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Provider
          </Button>
        </ProviderCreateDialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Providers</CardTitle>
          <CardDescription>
            Configure and monitor fulfillment providers. Orders are automatically submitted to healthy providers based on priority.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="text-center py-8">Loading providers...</div>}>
            <ProvidersTable />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
