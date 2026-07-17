import { ServiceBrowserExact } from '@/components/dashboard/service-browser-exact';

export default async function ServicesPage() {
  const { prisma } = await import('@/lib/db/prisma');

  // Fetch all active platforms with categories and services
  const platforms = await prisma.platform.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
      order: true,
      categories: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          services: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              price: true,
              minQuantity: true,
              maxQuantity: true,
              estimatedDeliveryTime: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { name: 'asc' },
      },
    },
    orderBy: { order: 'asc' },
  });

  // Transform Decimal price to string
  const platformsWithServices = platforms.map(platform => ({
    ...platform,
    categories: platform.categories.map(category => ({
      ...category,
      services: category.services.map(service => ({
        ...service,
        price: service.price.toString(),
      })),
    })),
  }));

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Browse Services</h1>
        <p className="mt-2 text-gray-600">
          Browse our complete service catalog with flat, easy-to-scan layout
        </p>
      </div>

      {/* Service Browser - Exact FollowersMeta Layout */}
      <ServiceBrowserExact platforms={platformsWithServices} />
    </div>
  );
}
