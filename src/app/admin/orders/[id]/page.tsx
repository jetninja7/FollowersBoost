'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Play, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface Order {
  id: string;
  userId: string;
  user: { name: string; email: string };
  serviceId: string;
  quantity: number;
  totalPrice: number;
  status: string;
  targetUrl: string;
  startCount: number | null;
  currentCount: number | null;
  progress: number;
  notes: string | null;
  adminNotes: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  lastProgressUpdate: string | null;
  orderLogs: Array<{
    id: string;
    action: string;
    oldValue: string | null;
    newValue: string | null;
    performedBy: string | null;
    note: string | null;
    createdAt: string;
  }>;
}

export default function AdminOrderManagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [currentCount, setCurrentCount] = useState('');
  const [note, setNote] = useState('');
  const [isPublicNote, setIsPublicNote] = useState(false);
  const [failureReason, setFailureReason] = useState('');

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/admin/orders/${resolvedParams.id}`);
      if (!response.ok) throw new Error('Failed to fetch order');
      const { data } = await response.json();
      setOrder(data);
      if (data.currentCount) {
        setCurrentCount(data.currentCount.toString());
      }
    } catch (error) {
      toast.error('Failed to load order');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [resolvedParams.id]);

  const updateStatus = async (newStatus: string, reason?: string) => {
    if (!order) return;

    if (newStatus === 'FAILED' && !reason) {
      const inputReason = prompt('Please enter failure reason:');
      if (!inputReason) return;
      reason = inputReason;
    }

    if (newStatus === 'CANCELLED') {
      if (!confirm('Cancel this order? Wallet will be refunded automatically.')) return;
    }

    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          failureReason: reason,
        }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      toast.success(`Order status updated to ${newStatus}`);
      fetchOrder();
    } catch (error) {
      toast.error('Failed to update status');
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };

  const updateProgress = async () => {
    if (!order || !currentCount) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentCount: parseInt(currentCount),
        }),
      });

      if (!response.ok) throw new Error('Failed to update progress');

      toast.success('Progress updated');
      fetchOrder();
    } catch (error) {
      toast.error('Failed to update progress');
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };

  const addNote = async () => {
    if (!order || !note.trim()) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note: note.trim(),
          isPublic: isPublicNote,
        }),
      });

      if (!response.ok) throw new Error('Failed to add note');

      toast.success('Note added');
      setNote('');
      setIsPublicNote(false);
      fetchOrder();
    } catch (error) {
      toast.error('Failed to add note');
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatTimeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p>Order not found</p>
      </div>
    );
  }

  const targetCount = (order.startCount || 0) + order.quantity;

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <Link href="/admin/orders">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Order #{order.id.slice(0, 8)}</h1>
        <Badge variant={getStatusColor(order.status) as any} className="text-lg px-4 py-1">
          {order.status}
        </Badge>
      </div>

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Order Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-600">User</Label>
            <p>{order.user.name} ({order.user.email})</p>
          </div>
          <div>
            <Label className="text-gray-600">Service ID</Label>
            <p>#{order.serviceId.slice(0, 8)}</p>
          </div>
          <div>
            <Label className="text-gray-600">Target URL</Label>
            <a href={order.targetUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              {order.targetUrl}
            </a>
          </div>
          <div>
            <Label className="text-gray-600">Quantity</Label>
            <p>{order.quantity.toLocaleString()}</p>
          </div>
          <div>
            <Label className="text-gray-600">Total Price</Label>
            <p>${Number(order.totalPrice).toFixed(2)}</p>
          </div>
          <div>
            <Label className="text-gray-600">Created</Label>
            <p>{formatDate(order.createdAt)} ({formatTimeAgo(order.createdAt)})</p>
          </div>
          {order.startedAt && (
            <div>
              <Label className="text-gray-600">Started</Label>
              <p>{formatDate(order.startedAt)}</p>
            </div>
          )}
          {order.completedAt && (
            <div>
              <Label className="text-gray-600">Completed</Label>
              <p>{formatDate(order.completedAt)}</p>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Progress Tracking</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-gray-600">Start Count</Label>
              <p className="text-2xl font-bold">{order.startCount?.toLocaleString() || 0}</p>
            </div>
            <div>
              <Label className="text-gray-600">Current Count</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={currentCount}
                  onChange={(e) => setCurrentCount(e.target.value)}
                  className="w-32"
                />
                <Button onClick={updateProgress} disabled={updating} size="sm">
                  Update
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-gray-600">Target Count</Label>
              <p className="text-2xl font-bold">{targetCount.toLocaleString()}</p>
            </div>
          </div>

          {order.progress > 0 && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progress: {order.progress}%</span>
                <span>
                  {((order.currentCount || 0) - (order.startCount || 0)).toLocaleString()} / {order.quantity.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all"
                  style={{ width: `${order.progress}%` }}
                />
              </div>
            </div>
          )}

          {order.lastProgressUpdate && (
            <p className="text-sm text-gray-500">
              Last updated: {formatTimeAgo(order.lastProgressUpdate)}
            </p>
          )}
        </div>
      </Card>

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          {order.status === 'PROCESSING' && (
            <Button onClick={() => updateStatus('IN_PROGRESS')} disabled={updating}>
              <Play className="w-4 h-4 mr-2" />
              Start Fulfillment
            </Button>
          )}
          {order.status === 'IN_PROGRESS' && (
            <>
              <Button onClick={() => updateStatus('COMPLETED')} disabled={updating} variant="default">
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark Complete
              </Button>
              <Button onClick={() => updateStatus('FAILED', failureReason)} disabled={updating} variant="destructive">
                <XCircle className="w-4 h-4 mr-2" />
                Mark Failed
              </Button>
            </>
          )}
          {['PENDING', 'PROCESSING', 'IN_PROGRESS'].includes(order.status) && (
            <Button onClick={() => updateStatus('CANCELLED')} disabled={updating} variant="outline">
              <RotateCcw className="w-4 h-4 mr-2" />
              Cancel & Refund
            </Button>
          )}
        </div>
      </Card>

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Admin Notes</h2>
        <div className="space-y-4">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note..."
            rows={3}
          />
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isPublicNote}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsPublicNote(e.target.checked)}
              />
              <span className="text-sm">Visible to user</span>
            </label>
            <Button onClick={addNote} disabled={updating || !note.trim()} size="sm">
              Add Note
            </Button>
          </div>
          {order.adminNotes && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded">
              <Label className="text-sm text-gray-600">Private Notes:</Label>
              <p className="mt-1">{order.adminNotes}</p>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Activity Log</h2>
        <div className="space-y-3">
          {order.orderLogs.map((log) => (
            <div key={log.id} className="flex gap-3 text-sm">
              <span className="text-gray-500 whitespace-nowrap">
                {formatTimeAgo(log.createdAt)}
              </span>
              <div className="flex-1">
                <span className="font-medium">{log.action.replace('_', ' ')}</span>
                {log.oldValue && log.newValue && (
                  <span className="text-gray-600">
                    {' '}: {log.oldValue} → {log.newValue}
                  </span>
                )}
                {log.note && <span className="text-gray-600"> - {log.note}</span>}
                <span className="text-gray-400"> ({log.performedBy || 'System'})</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
