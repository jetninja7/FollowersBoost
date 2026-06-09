import { ServicesGrid } from '@/components/landing/services-grid';
import { ServiceSearch } from '@/components/dashboard/service-search';

export default async function ServicesPage() {
  const { prisma } = await import('@/lib/db/prisma');

  // Fetch all active platforms
  const platforms = await prisma.platform.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
      order: true,
    },
    orderBy: { order: 'asc' },
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Browse Services</h1>
        <p className="mt-2 text-gray-600">
          Choose from our wide range of social media growth services
        </p>
      </div>

      {/* Search Bar */}
      <ServiceSearch />

      {/* Platform Grid - Reuse from landing page */}
      <div>
        <h2 className="text-xl font-semibold mb-6">All Platforms</h2>
        <ServicesGrid />
      </div>
    </div>
  );
}
