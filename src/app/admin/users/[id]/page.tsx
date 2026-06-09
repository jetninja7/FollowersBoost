'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { WalletAdjustmentModal } from '@/components/admin/wallet-adjustment-modal';
import { Loader2, ArrowLeft, DollarSign, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface UserDetail {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  balance: string;
  createdAt: string;
  updatedAt: string;
  orders: Array<{
    id: string;
    serviceId: string;
    totalPrice: string;
    status: string;
    createdAt: string;
  }>;
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${resolvedParams.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }

      const { data } = await response.json();
      setUser(data);
    } catch (error) {
      toast.error('Failed to load user');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [resolvedParams.id]);

  const handleStatusToggle = async () => {
    if (!user) return;

    setIsUpdatingStatus(true);

    try {
      const response = await fetch(`/api/admin/users/${resolvedParams.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: !user.isActive,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to update status');
      }

      const { data } = await response.json();
      setUser({ ...user, isActive: data.isActive });

      toast.success(
        data.isActive ? 'User activated successfully' : 'User suspended successfully'
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      toast.error('Failed to update status', {
        description: errorMessage,
      });
    } finally {
      setIsUpdatingStatus(false);
      setShowSuspendDialog(false);
    }
  };

  const getStatusBadgeVariant = (isActive: boolean) => {
    return isActive ? 'success' : 'destructive';
  };

  const getOrderStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'secondary',
      PROCESSING: 'default',
      IN_PROGRESS: 'warning',
      COMPLETED: 'success',
      CANCELLED: 'outline',
      FAILED: 'destructive',
    };
    return colors[status] || 'secondary';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="p-12 text-center">
          <p className="text-gray-500 mb-4">User not found</p>
          <Button onClick={() => router.push('/admin/users')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/admin/users')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Users
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{user.email}</h1>
            <div className="flex items-center gap-3">
              <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary' as any}>
                {user.role}
              </Badge>
              <Badge variant={getStatusBadgeVariant(user.isActive) as any}>
                {user.isActive ? 'Active' : 'Suspended'}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={user.isActive ? 'destructive' : 'default'}
              onClick={() => setShowSuspendDialog(true)}
              disabled={isUpdatingStatus}
            >
              {user.isActive ? 'Suspend User' : 'Activate User'}
            </Button>
            <Button onClick={() => setShowWalletModal(true)}>
              <DollarSign className="w-4 h-4 mr-2" />
              Adjust Wallet
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* User Info Card */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">User Information</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-medium">{user.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Joined</p>
              <p className="font-medium">
                {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Updated</p>
              <p className="font-medium">
                {formatDistanceToNow(new Date(user.updatedAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        </Card>

        {/* Wallet Card */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Wallet</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Balance</p>
              <p className="text-3xl font-bold">${Number(user.balance).toFixed(2)}</p>
            </div>
            <Button onClick={() => setShowWalletModal(true)} size="sm">
              Adjust
            </Button>
          </div>
        </Card>
      </div>

      {/* Order History Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <ShoppingCart className="w-5 h-5 mr-2" />
            Recent Orders ({user.orders.length})
          </h2>
        </div>
        {user.orders.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No orders yet</p>
        ) : (
          <div className="space-y-3">
            {user.orders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="block"
              >
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-semibold">#{order.id.slice(0, 8)}</p>
                        <Badge variant={getOrderStatusColor(order.status) as any}>
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        Service #{order.serviceId.slice(0, 8)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${Number(order.totalPrice).toFixed(2)}</p>
                      <p className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Suspend/Activate Confirmation Dialog */}
      <AlertDialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {user.isActive ? 'Suspend User' : 'Activate User'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {user.isActive
                ? 'Are you sure you want to suspend this user? They will not be able to access their account.'
                : 'Are you sure you want to activate this user? They will regain access to their account.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowSuspendDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusToggle}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : user.isActive ? (
                'Suspend'
              ) : (
                'Activate'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Wallet Adjustment Modal */}
      <WalletAdjustmentModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onSuccess={fetchUser}
        userId={resolvedParams.id}
        currentBalance={user.balance}
      />
    </div>
  );
}
