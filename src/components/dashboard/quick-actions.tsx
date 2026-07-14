import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Wallet } from 'lucide-react';

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Link href="/dashboard/orders">
        <Button
          size="lg"
          className="w-full h-16 text-lg font-semibold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg"
        >
          <ShoppingBag className="w-6 h-6 mr-3" />
          My Orders
        </Button>
      </Link>

      <Link href="/dashboard/wallet">
        <Button
          size="lg"
          className="w-full h-16 text-lg font-semibold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg"
        >
          <Wallet className="w-6 h-6 mr-3" />
          Add Funds
        </Button>
      </Link>
    </div>
  );
}
