import { notFound } from 'next/navigation';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { OrderDetailClient } from './order-detail-client';

interface OrderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  // Ensure user is authenticated
  const session = await requireAuth();

  // Ensure user ID exists
  if (!session.user.id) {
    throw new Error('User ID not found in session');
  }

  // Handle Next.js 15 async params
  const { id } = await params;

  // Fetch order with service and category details
  const order = await prisma.order.findUnique({
    where: {
      id: id,
      userId: session.user.id, // Ensure user owns the order
    },
  });

  // 404 if order not found or not owned by user
  if (!order) {
    notFound();
  }

  // Fetch service details separately (since Order doesn't have direct relation in schema)
  const service = await prisma.service.findUnique({
    where: {
      id: order.serviceId,
    },
    include: {
      category: {
        include: {
          platform: true,
        },
      },
    },
  });

  // If service not found (shouldn't happen, but defensive)
  if (!service) {
    notFound();
  }

  // Transform to serializable format
  const orderData = {
    id: order.id,
    userId: order.userId,
    serviceId: order.serviceId,
    serviceName: service.name,
    platform: service.category.platform.name,
    quantity: order.quantity,
    totalPrice: order.totalPrice.toString(),
    status: order.status,
    targetUrl: order.targetUrl,
    startCount: order.startCount,
    currentCount: order.currentCount,
    notes: order.notes,
    estimatedDeliveryTime: service.estimatedDeliveryTime,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    completedAt: order.completedAt?.toISOString() || null,
    unitPrice: service.price.toString(),
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header with Breadcrumb */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <a href="/dashboard" className="hover:text-foreground transition-colors">
            Dashboard
          </a>
          <span>/</span>
          <a href="/dashboard/orders" className="hover:text-foreground transition-colors">
            Orders
          </a>
          <span>/</span>
          <span className="text-foreground">Order #{order.id.slice(0, 8)}</span>
        </div>
        <h1 className="text-3xl font-bold">Order Details</h1>
      </div>

      {/* Client Component with Polling and Actions */}
      <OrderDetailClient initialOrder={orderData} />
    </div>
  );
}
