import { notFound } from 'next/navigation';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { OrderForm } from '@/components/dashboard/order-form';

interface PageProps {
  params: Promise<{ serviceId: string }>;
}

export default async function OrderPage({ params }: PageProps) {
  const { serviceId } = await params;
  const session = await requireAuth();

  // Fetch service details
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      category: {
        include: {
          platform: true,
        },
      },
    },
  });

  if (!service || !service.isActive) {
    notFound();
  }

  // Fetch wallet balance
  const wallet = await prisma.wallet.findUnique({
    where: { userId: session.user.id },
    select: { balance: true },
  });

  const balance = wallet ? Number(wallet.balance) : 0;

  // Serialize the service data to remove Prisma Decimal types
  const serializedService = {
    id: service.id,
    name: service.name,
    slug: service.slug,
    description: service.description,
    price: Number(service.price),
    minQuantity: service.minQuantity,
    maxQuantity: service.maxQuantity,
    estimatedDeliveryTime: service.estimatedDeliveryTime,
    isActive: service.isActive,
    categoryId: service.categoryId,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
    category: {
      id: service.category.id,
      name: service.category.name,
      slug: service.category.slug,
      description: service.category.description,
      platformId: service.category.platformId,
      isActive: service.category.isActive,
      displayOrder: service.category.displayOrder,
      createdAt: service.category.createdAt,
      updatedAt: service.category.updatedAt,
      platform: {
        id: service.category.platform.id,
        name: service.category.platform.name,
        slug: service.category.platform.slug,
        description: service.category.platform.description,
        isActive: service.category.platform.isActive,
        displayOrder: service.category.platform.displayOrder,
        createdAt: service.category.platform.createdAt,
        updatedAt: service.category.platform.updatedAt,
      },
    },
  };

  return (
    <div className="max-w-4xl mx-auto">
      <OrderForm service={serializedService} userBalance={balance} />
    </div>
  );
}
