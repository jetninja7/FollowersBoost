import { ServicesGrid } from '@/components/landing/services-grid';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

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
      <div className="relative max-w-2xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          type="search"
          placeholder="Search services..."
          className="pl-10"
        />
      </div>

      {/* Platform Grid - Reuse from landing page */}
      <div>
        <h2 className="text-xl font-semibold mb-6">All Platforms</h2>
        <ServicesGrid />
      </div>
    </div>
  );
}
