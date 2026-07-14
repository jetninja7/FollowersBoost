import { prisma } from '@/lib/db/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart, Wallet, TrendingDown } from 'lucide-react';

interface DashboardStatsProps {
  userId: string;
  userName: string;
}

export async function DashboardStats({ userId, userName }: DashboardStatsProps) {
  // Fetch user stats
  const [wallet, ordersCount] = await Promise.all([
    prisma.wallet.findUnique({
      where: { userId },
      select: { balance: true },
    }),
    prisma.order.count({
      where: { userId },
    }),
  ]);

  // Calculate total spent
  const totalSpent = await prisma.order.aggregate({
    where: { userId, status: { in: ['COMPLETED', 'IN_PROGRESS'] } },
    _sum: { totalPrice: true },
  });

  const balance = wallet ? Number(wallet.balance) : 0;
  const spent = totalSpent._sum.totalPrice ? Number(totalSpent._sum.totalPrice) : 0;

  const stats = [
    {
      icon: ShoppingCart,
      label: 'Total Orders',
      value: ordersCount.toLocaleString(),
      color: 'bg-orange-100',
      iconColor: 'text-orange-600',
    },
    {
      icon: Wallet,
      label: 'Total Balance',
      value: `₹ ${balance.toFixed(0)}`,
      color: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      icon: TrendingDown,
      label: 'Total Spent',
      value: `₹ ${spent.toFixed(0)}`,
      color: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Welcome Card */}
      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl">
              👤
            </div>
            <div>
              <div className="text-sm opacity-90">Welcome to Followers Meta</div>
              <div className="text-xl font-bold">{userName}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 ${stat.color} rounded-full flex items-center justify-center`}>
                  <Icon className={`w-8 h-8 ${stat.iconColor}`} />
                </div>
                <div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
