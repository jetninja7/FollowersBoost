'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ShoppingBag, Package, Wallet, Headphones, Link as LinkIcon, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'New Order', href: '/dashboard', icon: ShoppingBag, primary: true },
  { name: 'Orders History', href: '/dashboard/orders', icon: Menu },
  { name: 'Services', href: '/dashboard/services', icon: Package },
  { name: 'Add Funds', href: '/dashboard/wallet', icon: Wallet },
  { name: 'Support', href: '/dashboard/support', icon: Headphones },
  { name: 'API', href: '/dashboard/api', icon: LinkIcon },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-60 lg:flex-col">
      {/* Blue sidebar background */}
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gradient-to-b from-blue-600 to-blue-700 px-4 pb-4">
        {/* Logo */}
        <div className="flex h-20 items-center border-b border-blue-500/30 px-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <div className="text-white">
              <div className="font-bold text-lg">FollowersMeta</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;

              if (item.primary) {
                return (
                  <li key={item.name} className="mb-3">
                    <Link href={item.href}>
                      <Button
                        className="w-full justify-start bg-white text-blue-600 hover:bg-gray-100 h-12 text-base font-semibold"
                      >
                        <Icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </Button>
                    </Link>
                  </li>
                );
              }

              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      isActive
                        ? 'bg-blue-500 text-white'
                        : 'text-blue-100 hover:bg-blue-500/50 hover:text-white',
                      'group flex gap-x-3 rounded-md p-3 text-sm leading-6 font-medium transition-colors'
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
