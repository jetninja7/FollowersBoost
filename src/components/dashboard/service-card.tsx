import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
}

export function ServiceCard({ service }: ServiceCardProps) {
  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
      <CardContent className="flex-1 p-6">
        <h3 className="text-lg font-semibold mb-2">{service.name}</h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {service.description}
        </p>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Price:</span>
            <span className="font-semibold text-blue-600">
              ${(typeof service.price === 'number' ? service.price : service.price.toNumber()).toFixed(2)} per unit
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Range:</span>
            <span className="text-sm">
              {service.minQuantity.toLocaleString()} - {service.maxQuantity.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Delivery:</span>
            <Badge variant="secondary">{service.estimatedDeliveryTime}</Badge>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0">
        <Link href={`/dashboard/service/${service.slug}`} className="w-full">
          <Button className="w-full">View Details</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
