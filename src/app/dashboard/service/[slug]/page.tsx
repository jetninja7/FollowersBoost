import { notFound } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

interface ServiceDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  // Handle Next.js 15 async params
  const { slug } = await params;

  const { prisma } = await import('@/lib/db/prisma');

  // Fetch service with all relations
  const service = await prisma.service.findUnique({
    where: {
      slug: slug,
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

  if (!service) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Service Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge>{service.category.platform.name}</Badge>
          <Badge variant="outline">{service.category.name}</Badge>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{service.name}</h1>
      </div>

      {/* Pricing Card */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Pricing</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-blue-600">
              ${Number(service.price).toFixed(2)}
            </span>
            <span className="text-gray-500">per unit</span>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-gray-500">Minimum Quantity</p>
              <p className="text-lg font-semibold">
                {service.minQuantity.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Maximum Quantity</p>
              <p className="text-lg font-semibold">
                {service.maxQuantity.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Interactive Calculator Placeholder */}
          <div className="pt-4 border-t">
            <label className="text-sm font-medium mb-2 block">
              Calculate Cost
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min={service.minQuantity}
                max={service.maxQuantity}
                defaultValue={service.minQuantity}
                className="flex-1 px-3 py-2 border rounded-md"
                disabled
              />
              <span className="text-lg font-semibold text-blue-600">
                ${(Number(service.price) * service.minQuantity).toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Interactive calculator coming in Phase 3B
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Description Card */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Description</h2>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed">{service.description}</p>
        </CardContent>
      </Card>

      {/* Delivery Info Card */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Delivery Information</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium">Estimated Delivery Time</p>
              <p className="text-sm text-gray-600">{service.estimatedDeliveryTime}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA Section */}
      <Card>
        <CardContent className="p-6">
          <Button size="lg" className="w-full" disabled>
            Order Now (Coming in Phase 3B)
          </Button>
          <p className="text-xs text-center text-gray-500 mt-2">
            Checkout functionality will be available in Phase 3B
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
