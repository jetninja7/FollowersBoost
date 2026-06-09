import { notFound } from 'next/navigation';
import { CheckoutPageClient } from './checkout-client';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

interface CheckoutPageProps {
  params: Promise<{
    serviceId: string;
  }>;
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  // Ensure user is authenticated
  const session = await requireAuth();

  // Ensure user ID exists
  if (!session.user.id) {
    throw new Error('User ID not found in session');
  }

  // Handle Next.js 15 async params
  const { serviceId } = await params;

  // Fetch service details with category and platform
  const service = await prisma.service.findUnique({
    where: {
      id: serviceId,
      isActive: true,
    },
    include: {
      category: {
        include: {
          platform: true,
        },
      },
    },
  });

  // 404 if service not found
  if (!service) {
    notFound();
  }

  // Transform service data to match component props
  const serviceData = {
    id: service.id,
    name: service.name,
    platform: service.category.platform.name,
    price: service.price,
    minQuantity: service.minQuantity,
    maxQuantity: service.maxQuantity,
    deliveryTime: service.estimatedDeliveryTime,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <a href="/dashboard" className="hover:text-foreground transition-colors">
            Dashboard
          </a>
          <span>/</span>
          <a href="/dashboard/services" className="hover:text-foreground transition-colors">
            Services
          </a>
          <span>/</span>
          <a
            href={`/dashboard/service/${service.slug}`}
            className="hover:text-foreground transition-colors"
          >
            {service.name}
          </a>
          <span>/</span>
          <span className="text-foreground">Checkout</span>
        </div>
        <h1 className="text-3xl font-bold">Checkout</h1>
      </div>

      {/* Client Component with State Management */}
      <CheckoutPageClient service={serviceData} userId={session.user.id} />
    </div>
  );
}
