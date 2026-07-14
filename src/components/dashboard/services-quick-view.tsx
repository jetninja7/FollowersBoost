import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Clock, Zap, CheckCircle } from 'lucide-react';

export async function ServicesQuickView() {
  // Get featured services from Instagram
  const services = await prisma.service.findMany({
    where: {
      isActive: true,
      category: {
        platform: {
          slug: 'instagram',
        },
      },
    },
    include: {
      category: {
        include: {
          platform: true,
        },
      },
    },
    take: 5,
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Search services..."
          className="pl-12 h-14 text-base bg-gray-50 border-2"
        />
      </div>

      {/* Category Header */}
      <div className="flex items-center gap-3 py-2">
        <span className="text-2xl">📷</span>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900">Instagram Followers (Non Drop)</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Zap className="w-4 h-4 text-orange-500" />
            <span>Start: 1 Min</span>
            <Badge variant="secondary" className="ml-2">
              Updated Service
            </Badge>
            <span className="text-green-600">✓ Refill 365 Days</span>
          </div>
        </div>
      </div>

      {/* Services List */}
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-700">Services</h4>

        {services.map((service) => {
          const price = typeof service.price === 'number' ? service.price : service.price.toNumber();

          return (
            <Card key={service.id} className="hover:shadow-md transition-shadow border-2">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-blue-600 text-white">
                        {service.id.slice(0, 8)}
                      </Badge>
                      <h5 className="font-semibold text-gray-900">{service.name}</h5>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Start: {service.estimatedDeliveryTime}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span>Real Old Accounts</span>
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        365 Days Refill
                      </Badge>
                    </div>

                    <div className="mt-2">
                      <div className="text-xs text-gray-500">Description</div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-gray-700">Ultra Instant [0-5 Min Max]</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-gray-500 mb-1">Price</div>
                    <div className="text-xl font-bold text-blue-600">
                      ${price.toFixed(4)}
                    </div>
                    <div className="text-xs text-gray-500">per unit</div>
                    <Link href={`/dashboard/order/${service.id}`}>
                      <Button size="sm" className="mt-2 w-full">
                        Order Now
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* View All Link */}
      <div className="text-center pt-4">
        <Link href="/dashboard/services">
          <Button variant="outline" size="lg">
            View All Services
          </Button>
        </Link>
      </div>
    </div>
  );
}
