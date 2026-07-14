import { notFound } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ServiceCard } from '@/components/dashboard/service-card';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, TrendingUp, Clock, Shield } from 'lucide-react';

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
      {/* Platform Header with improved visuals */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-100">
        <div className="flex items-center gap-6 mb-4">
          <div className="text-6xl">{platform.icon}</div>
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{platform.name} Services</h1>
            <p className="text-lg text-gray-600">
              Boost your {platform.name} presence with our premium growth services
            </p>
            <div className="flex items-center gap-4 mt-3">
              <Badge variant="secondary" className="text-sm">
                {totalServices} Services Available
              </Badge>
              <Badge variant="outline" className="text-sm">
                <Clock className="w-3 h-3 mr-1" />
                Instant Delivery
              </Badge>
              <Badge variant="outline" className="text-sm">
                <Shield className="w-3 h-3 mr-1" />
                100% Safe
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Real Growth</h3>
              <p className="text-sm text-gray-600">High-quality engagement from real accounts</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-start gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Fast Delivery</h3>
              <p className="text-sm text-gray-600">Orders start processing within minutes</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-start gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Premium Quality</h3>
              <p className="text-sm text-gray-600">Top-tier services at competitive prices</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Tabs */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Choose Your Service</h2>
        <Tabs defaultValue={defaultCategory} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto bg-white border">
            {platform.categories.map((category) => (
              <TabsTrigger
                key={category.id}
                value={category.slug}
                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
              >
                {category.name}
                <Badge variant="secondary" className="ml-2 bg-gray-100">
                  {category.services.length}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {platform.categories.map((category) => (
            <TabsContent key={category.id} value={category.slug} className="mt-6">
              {category.description && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                  <p className="text-gray-700">{category.description}</p>
                </div>
              )}

              {category.services.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {category.services.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      platformName={platform.name}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed">
                  <p className="text-gray-500 text-lg">No services available in this category yet</p>
                  <p className="text-gray-400 text-sm mt-2">Check back soon for new services!</p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
