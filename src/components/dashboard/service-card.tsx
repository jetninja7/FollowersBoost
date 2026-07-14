import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Clock, Package, Zap } from 'lucide-react';

interface ServiceCardProps {
  service: {
    name: string;
    slug: string;
    description: string;
    price: number | { toNumber(): number };
    minQuantity: number;
    maxQuantity: number;
    estimatedDeliveryTime: string;
  };
  platformName?: string;
}

export function ServiceCard({ service, platformName }: ServiceCardProps) {
  const price = typeof service.price === 'number' ? service.price : service.price.toNumber();
  const pricePerK = (price * 1000).toFixed(2);

  return (
    <Card className="flex flex-col h-full hover:shadow-xl transition-all duration-300 hover:border-blue-300 group">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
              {service.name}
            </h3>
            <Badge variant="outline" className="text-xs">
              <Zap className="w-3 h-3 mr-1" />
              {service.estimatedDeliveryTime}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
          {service.description}
        </p>
      </CardHeader>

      <CardContent className="flex-1 px-6 pb-4">
        {/* Pricing - Most prominent */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 mb-4 border border-blue-100">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-xs text-gray-600 mb-1">Starting at</p>
              <p className="text-3xl font-bold text-blue-600">
                ${price.toFixed(4)}
              </p>
              <p className="text-xs text-gray-500 mt-1">per unit</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-gray-700">${pricePerK}</p>
              <p className="text-xs text-gray-500">per 1,000</p>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500">Order Range</p>
              <p className="text-sm font-semibold text-gray-900">
                {service.minQuantity.toLocaleString()} - {service.maxQuantity.toLocaleString()} units
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500">Delivery Time</p>
              <p className="text-sm font-semibold text-gray-900">{service.estimatedDeliveryTime}</p>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0 gap-2">
        <Link href={`/dashboard/service/${service.slug}`} className="w-full">
          <Button className="w-full group-hover:bg-blue-600 transition-colors" size="lg">
            Order Now
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
