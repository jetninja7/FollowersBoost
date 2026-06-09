import { notFound } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ServiceCard } from '@/components/dashboard/service-card';
import { Badge } from '@/components/ui/badge';

interface PlatformPageProps {
  params: Promise<{
    platform: string;
  }>;
}

export default async function PlatformPage({ params }: PlatformPageProps) {
  // Handle Next.js 15 async params
  const { platform: platformSlug } = await params;

  const { prisma } = await import('@/lib/db/prisma');

  // Fetch platform with categories and services
  const platform = await prisma.platform.findUnique({
    where: {
      slug: platformSlug,
      isActive: true,
    },
    include: {
      categories: {
        where: { isActive: true },
        include: {
          services: {
            where: { isActive: true },
          },
        },
      },
    },
  });

  if (!platform) {
    notFound();
  }

  // Get total service count
  const totalServices = platform.categories.reduce(
    (acc, cat) => acc + cat.services.length,
    0
  );

  // Use first category as default
  const defaultCategory = platform.categories[0]?.slug || '';

  return (
    <div className="space-y-8">
      {/* Platform Header */}
      <div>
        <div className="flex items-center gap-4 mb-4">
          <div className="text-4xl">{platform.icon}</div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{platform.name}</h1>
            <p className="text-gray-600 mt-1">
              {totalServices} services available
            </p>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs defaultValue={defaultCategory} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          {platform.categories.map((category) => (
            <TabsTrigger key={category.id} value={category.slug}>
              {category.name}
              <Badge variant="secondary" className="ml-2">
                {category.services.length}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {platform.categories.map((category) => (
          <TabsContent key={category.id} value={category.slug}>
            <div className="mt-6">
              {category.description && (
                <p className="text-gray-600 mb-6">{category.description}</p>
              )}

              {category.services.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {category.services.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No services available in this category
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
