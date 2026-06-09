# Phase 7: Expand Admin Panel - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build comprehensive admin panel with sidebar navigation, analytics dashboard, user management, and full CRUD for services/categories/platforms.

**Architecture:** Server components for data fetching with direct Prisma queries. Client components for interactivity. API routes for mutations. Reuse existing UI components. Follow Phase 6 patterns for consistency.

**Tech Stack:** Next.js 15 App Router, React 19, Prisma, TypeScript, Tailwind CSS, shadcn/ui

---

## File Structure

**Pages:**
```
src/app/admin/
├── layout.tsx                           # NEW: Sidebar wrapper
├── page.tsx                             # NEW: Redirect to dashboard
├── dashboard/
│   └── page.tsx                         # NEW: Analytics overview
├── orders/                              # EXISTING
├── users/
│   ├── page.tsx                         # NEW: User list
│   └── [id]/page.tsx                    # NEW: User detail
└── services/
    └── page.tsx                         # NEW: Tabbed CRUD interface
```

**Components:**
```
src/components/admin/
├── admin-sidebar.tsx                    # NEW: Navigation sidebar
├── analytics-cards.tsx                  # NEW: Revenue/user/service stats
├── order-stats.tsx                      # EXISTING
├── user-table.tsx                       # NEW: User list table
├── wallet-adjustment-modal.tsx          # NEW: Adjust wallet form
├── platform-form.tsx                    # NEW: Platform create/edit
├── category-form.tsx                    # NEW: Category create/edit
└── service-form.tsx                     # NEW: Service create/edit
```

**APIs:**
```
src/app/api/admin/
├── users/
│   ├── route.ts                         # NEW: List users
│   └── [id]/
│       ├── route.ts                     # NEW: Get user details
│       ├── status/route.ts              # NEW: Suspend/activate
│       └── wallet/adjust/route.ts       # NEW: Adjust balance
├── platforms/
│   ├── route.ts                         # NEW: List/create platforms
│   └── [id]/route.ts                    # NEW: Get/update/delete platform
├── categories/
│   ├── route.ts                         # NEW: List/create categories
│   └── [id]/route.ts                    # NEW: Get/update/delete category
└── services/
    ├── route.ts                         # NEW: List/create services
    └── [id]/route.ts                    # NEW: Get/update/delete service
```

---

## Tasks

### Task 1: Admin Sidebar Component

**Files:**
- Create: `src/components/admin/admin-sidebar.tsx`

- [ ] **Step 1: Create sidebar component with navigation**

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  Package 
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/services', label: 'Services', icon: Package },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
      </div>
      <nav className="px-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/admin-sidebar.tsx
git commit -m "feat(admin): add sidebar navigation component"
```

---

### Task 2: Admin Layout with Sidebar

**Files:**
- Create: `src/app/admin/layout.tsx`

- [ ] **Step 1: Create layout with sidebar wrapper**

```tsx
import { AdminSidebar } from '@/components/admin/admin-sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Create redirect page**

File: `src/app/admin/page.tsx`

```tsx
import { redirect } from 'next/navigation';

export default function AdminPage() {
  redirect('/admin/dashboard');
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/layout.tsx src/app/admin/page.tsx
git commit -m "feat(admin): add layout with sidebar and root redirect"
```

---

### Task 3: Analytics Cards Component

**Files:**
- Create: `src/components/admin/analytics-cards.tsx`

- [ ] **Step 1: Create analytics cards component**

```tsx
import { Card } from '@/components/ui/card';
import { 
  DollarSign, 
  ShoppingCart, 
  Users as UsersIcon, 
  TrendingUp 
} from 'lucide-react';

interface RevenueStats {
  total: string;
  today: string;
  thisWeek: string;
  thisMonth: string;
}

interface OrderStats {
  total: number;
  byStatus: Record<string, { count: number; percentage: number }>;
}

interface UserStats {
  total: number;
  newThisWeek: number;
  active: number;
}

interface TopService {
  name: string;
  platform: string;
  revenue: string;
  orderCount: number;
}

interface AnalyticsCardsProps {
  revenue: RevenueStats;
  orders: OrderStats;
  users: UserStats;
  topServices: TopService[];
}

export function AnalyticsCards({ revenue, orders, users, topServices }: AnalyticsCardsProps) {
  return (
    <div className="space-y-6">
      {/* Revenue Card */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-semibold">Revenue</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-gray-900">${revenue.total}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Today</p>
            <p className="text-2xl font-bold text-gray-900">${revenue.today}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">This Week</p>
            <p className="text-2xl font-bold text-gray-900">${revenue.thisWeek}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">This Month</p>
            <p className="text-2xl font-bold text-gray-900">${revenue.thisMonth}</p>
          </div>
        </div>
      </Card>

      {/* Order Stats Card */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingCart className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Orders</h2>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Total: <span className="font-semibold text-gray-900">{orders.total}</span>
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
            {Object.entries(orders.byStatus).map(([status, data]) => (
              <div key={status} className="border rounded p-3">
                <p className="text-xs text-gray-600 uppercase">{status}</p>
                <p className="text-lg font-semibold text-gray-900">{data.count}</p>
                <p className="text-xs text-gray-500">{data.percentage}%</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* User Stats Card */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <UsersIcon className="h-5 w-5 text-purple-600" />
          <h2 className="text-lg font-semibold">Users</h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-gray-900">{users.total}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">New This Week</p>
            <p className="text-2xl font-bold text-gray-900">{users.newThisWeek}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Active (30d)</p>
            <p className="text-2xl font-bold text-gray-900">{users.active}</p>
          </div>
        </div>
      </Card>

      {/* Top Services Card */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-orange-600" />
          <h2 className="text-lg font-semibold">Top Services</h2>
        </div>
        <div className="space-y-3">
          {topServices.map((service, index) => (
            <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0">
              <div>
                <p className="font-medium text-gray-900">{service.name}</p>
                <p className="text-sm text-gray-600">{service.platform}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">${service.revenue}</p>
                <p className="text-sm text-gray-600">{service.orderCount} orders</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/analytics-cards.tsx
git commit -m "feat(admin): add analytics cards component"
```

---

### Task 4: Analytics Dashboard Page

**Files:**
- Create: `src/app/admin/dashboard/page.tsx`

- [ ] **Step 1: Create dashboard page with Prisma queries**

```tsx
import { requireAdmin } from '@/lib/auth/require-admin';
import { prisma } from '@/lib/db/prisma';
import { AnalyticsCards } from '@/components/admin/analytics-cards';
import { OrderStatus } from '@prisma/client';

async function getAnalyticsData() {
  // Date calculations
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Revenue stats
  const [totalRevenue, todayRevenue, weekRevenue, monthRevenue] = await Promise.all([
    prisma.order.aggregate({
      where: { status: OrderStatus.COMPLETED },
      _sum: { totalPrice: true },
    }),
    prisma.order.aggregate({
      where: { 
        status: OrderStatus.COMPLETED,
        completedAt: { gte: todayStart },
      },
      _sum: { totalPrice: true },
    }),
    prisma.order.aggregate({
      where: { 
        status: OrderStatus.COMPLETED,
        completedAt: { gte: weekStart },
      },
      _sum: { totalPrice: true },
    }),
    prisma.order.aggregate({
      where: { 
        status: OrderStatus.COMPLETED,
        completedAt: { gte: monthStart },
      },
      _sum: { totalPrice: true },
    }),
  ]);

  // Order stats by status
  const ordersByStatus = await prisma.order.groupBy({
    by: ['status'],
    _count: true,
  });

  const totalOrders = await prisma.order.count();
  const orderStats = ordersByStatus.reduce((acc, { status, _count }) => {
    acc[status] = {
      count: _count,
      percentage: Math.round((_count / totalOrders) * 100),
    };
    return acc;
  }, {} as Record<string, { count: number; percentage: number }>);

  // User stats
  const [totalUsers, newUsersThisWeek, activeUsers] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: { createdAt: { gte: weekStart } },
    }),
    prisma.user.count({
      where: {
        orders: {
          some: {
            createdAt: { gte: thirtyDaysAgo },
          },
        },
      },
    }),
  ]);

  // Top services by revenue
  const topServicesData = await prisma.order.groupBy({
    by: ['serviceId'],
    where: { status: OrderStatus.COMPLETED },
    _sum: { totalPrice: true },
    _count: true,
    orderBy: { _sum: { totalPrice: 'desc' } },
    take: 5,
  });

  const serviceIds = topServicesData.map(s => s.serviceId);
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds } },
    include: { category: { include: { platform: true } } },
  });

  const topServices = topServicesData.map(data => {
    const service = services.find(s => s.id === data.serviceId);
    return {
      name: service?.name || 'Unknown',
      platform: service?.category.platform.name || 'Unknown',
      revenue: (Number(data._sum.totalPrice) || 0).toFixed(2),
      orderCount: data._count,
    };
  });

  return {
    revenue: {
      total: (Number(totalRevenue._sum.totalPrice) || 0).toFixed(2),
      today: (Number(todayRevenue._sum.totalPrice) || 0).toFixed(2),
      thisWeek: (Number(weekRevenue._sum.totalPrice) || 0).toFixed(2),
      thisMonth: (Number(monthRevenue._sum.totalPrice) || 0).toFixed(2),
    },
    orders: {
      total: totalOrders,
      byStatus: orderStats,
    },
    users: {
      total: totalUsers,
      newThisWeek: newUsersThisWeek,
      active: activeUsers,
    },
    topServices,
  };
}

export default async function AdminDashboardPage() {
  await requireAdmin();
  const data = await getAnalyticsData();

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
      <AnalyticsCards {...data} />
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/dashboard/page.tsx
git commit -m "feat(admin): add analytics dashboard page"
```

---

### Task 5: User List API

**Files:**
- Create: `src/app/api/admin/users/route.ts`

- [ ] **Step 1: Create users list API**

```tsx
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { prisma } from '@/lib/db/prisma';
import { Role } from '@prisma/client';

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search');
    const roleParam = searchParams.get('role');
    const statusParam = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (roleParam && roleParam !== 'ALL') {
      where.role = roleParam as Role;
    }

    if (statusParam && statusParam !== 'ALL') {
      where.isActive = statusParam === 'ACTIVE';
    }

    // Fetch users with wallet
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          wallet: {
            select: { balance: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Format response
    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      wallet: {
        balance: user.wallet?.balance.toString() || '0.00',
      },
    }));

    return NextResponse.json({
      users: formattedUsers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/users/route.ts
git commit -m "feat(admin): add users list API endpoint"
```

---

### Task 6: User Detail API

**Files:**
- Create: `src/app/api/admin/users/[id]/route.ts`

- [ ] **Step 1: Create user detail API**

```tsx
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        wallet: {
          select: { balance: true },
        },
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            serviceId: true,
            totalPrice: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      wallet: {
        balance: user.wallet?.balance.toString() || '0.00',
      },
      orders: user.orders.map(order => ({
        id: order.id,
        serviceId: order.serviceId,
        totalPrice: order.totalPrice.toString(),
        status: order.status,
        createdAt: order.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/users/[id]/route.ts
git commit -m "feat(admin): add user detail API endpoint"
```

---

### Task 7: User Status API

**Files:**
- Create: `src/app/api/admin/users/[id]/status/route.ts`

- [ ] **Step 1: Create user status toggle API**

```tsx
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { prisma } from '@/lib/db/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const { isActive } = body;

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'isActive must be a boolean' },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isActive },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    return NextResponse.json(
      { error: 'Failed to update user status' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/users/[id]/status/route.ts
git commit -m "feat(admin): add user status toggle API"
```

---

### Task 8: Wallet Adjustment API

**Files:**
- Create: `src/app/api/admin/users/[id]/wallet/adjust/route.ts`

- [ ] **Step 1: Create wallet adjustment API with transaction**

```tsx
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { TransactionType, TransactionStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const { operation, amount, reason } = body;

    // Validation
    if (!operation || !['ADD', 'SUBTRACT'].includes(operation)) {
      return NextResponse.json(
        { error: 'Invalid operation. Must be ADD or SUBTRACT' },
        { status: 400 }
      );
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Reason is required' },
        { status: 400 }
      );
    }

    // Check user exists
    const user = await prisma.user.findUnique({
      where: { id },
      include: { wallet: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.wallet) {
      return NextResponse.json(
        { error: 'User has no wallet' },
        { status: 400 }
      );
    }

    // Calculate new balance
    const currentBalance = Number(user.wallet.balance);
    const adjustmentAmount = operation === 'SUBTRACT' ? -parsedAmount : parsedAmount;
    const newBalance = currentBalance + adjustmentAmount;

    if (newBalance < 0) {
      return NextResponse.json(
        { error: 'Cannot subtract more than current balance' },
        { status: 400 }
      );
    }

    // Atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update wallet balance
      const updatedWallet = await tx.wallet.update({
        where: { id: user.wallet!.id },
        data: { balance: new Decimal(newBalance) },
      });

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          walletId: user.wallet!.id,
          type: operation === 'ADD' ? TransactionType.DEPOSIT : TransactionType.WITHDRAWAL,
          amount: new Decimal(parsedAmount),
          status: TransactionStatus.COMPLETED,
          metadata: {
            reason: reason.trim(),
            adminId: session.user.id,
            adminName: session.user.name,
            performedAt: new Date().toISOString(),
          },
        },
      });

      return { wallet: updatedWallet, transaction };
    });

    return NextResponse.json({
      success: true,
      newBalance: result.wallet.balance.toString(),
      transaction: {
        id: result.transaction.id,
        type: result.transaction.type,
        amount: result.transaction.amount.toString(),
        status: result.transaction.status,
      },
    });
  } catch (error) {
    console.error('Error adjusting wallet:', error);
    return NextResponse.json(
      { error: 'Failed to adjust wallet balance' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/users/[id]/wallet/adjust/route.ts
git commit -m "feat(admin): add wallet adjustment API with atomic transaction"
```

---

### Task 9: User Table Component

**Files:**
- Create: `src/components/admin/user-table.tsx`

- [ ] **Step 1: Create user table component**

```tsx
'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  wallet: {
    balance: string;
  };
}

interface UserTableProps {
  users: User[];
}

export function UserTable({ users }: UserTableProps) {
  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No users found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Email
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Role
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Balance
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Created
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {users.map((user) => (
            <tr 
              key={user.id} 
              className="hover:bg-gray-50 cursor-pointer"
            >
              <td className="px-4 py-3">
                <Link 
                  href={`/admin/users/${user.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {user.email}
                </Link>
              </td>
              <td className="px-4 py-3 text-gray-900">
                {user.name}
              </td>
              <td className="px-4 py-3">
                <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                  {user.role}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <Badge variant={user.isActive ? 'default' : 'destructive'}>
                  {user.isActive ? 'Active' : 'Suspended'}
                </Badge>
              </td>
              <td className="px-4 py-3 font-semibold text-gray-900">
                ${user.wallet.balance}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/user-table.tsx
git commit -m "feat(admin): add user table component"
```

---

### Task 10: Users List Page

**Files:**
- Create: `src/app/admin/users/page.tsx`

- [ ] **Step 1: Create users list page**

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { UserTable } from '@/components/admin/user-table';
import { Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  wallet: {
    balance: string;
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search: searchQuery,
        role: roleFilter,
        status: statusFilter,
        page: page.toString(),
        limit: '20',
      });

      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) throw new Error('Failed to fetch users');

      const data = await response.json();
      setUsers(data.users);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Users</h1>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by email or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              <SelectItem value="USER">User</SelectItem>
              <SelectItem value="MODERATOR">Moderator</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
          </Button>
        </form>
      </Card>

      {/* Table */}
      <Card className="p-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            <UserTable users={users} />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <p className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/users/page.tsx
git commit -m "feat(admin): add users list page with filters"
```

---

### Task 11: Wallet Adjustment Modal

**Files:**
- Create: `src/components/admin/wallet-adjustment-modal.tsx`

- [ ] **Step 1: Create wallet adjustment modal**

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface WalletAdjustmentModalProps {
  userId: string;
  currentBalance: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function WalletAdjustmentModal({
  userId,
  currentBalance,
  open,
  onClose,
  onSuccess,
}: WalletAdjustmentModalProps) {
  const [operation, setOperation] = useState<'ADD' | 'SUBTRACT'>('ADD');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!reason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/wallet/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation, amount: parsedAmount, reason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to adjust wallet');
      }

      const data = await response.json();
      toast.success(`Wallet adjusted successfully. New balance: $${data.newBalance}`);
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Error adjusting wallet:', error);
      toast.error(error.message || 'Failed to adjust wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOperation('ADD');
    setAmount('');
    setReason('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust Wallet Balance</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Current Balance</p>
            <p className="text-2xl font-bold text-gray-900">${currentBalance}</p>
          </div>

          <div className="space-y-2">
            <Label>Operation</Label>
            <RadioGroup value={operation} onValueChange={(v) => setOperation(v as 'ADD' | 'SUBTRACT')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ADD" id="add" />
                <Label htmlFor="add" className="cursor-pointer">Add Funds</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="SUBTRACT" id="subtract" />
                <Label htmlFor="subtract" className="cursor-pointer">Subtract Funds</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              placeholder="Explain why you are adjusting this balance..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                'Adjust Balance'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Install missing dependency if needed**

Run: `npm list @radix-ui/react-radio-group`
If not installed: `npm install @radix-ui/react-radio-group`

- [ ] **Step 3: Create Radio Group UI component if missing**

File: `src/components/ui/radio-group.tsx`

```tsx
import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { Circle } from "lucide-react"
import { cn } from "@/lib/utils"

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn("grid gap-2", className)}
      {...props}
      ref={ref}
    />
  )
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-gray-300 text-blue-600 ring-offset-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="h-2.5 w-2.5 fill-current text-current" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem }
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/wallet-adjustment-modal.tsx src/components/ui/radio-group.tsx
git commit -m "feat(admin): add wallet adjustment modal component"
```

---

### Task 12: User Detail Page

**Files:**
- Create: `src/app/admin/users/[id]/page.tsx`

- [ ] **Step 1: Create user detail page**

```tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WalletAdjustmentModal } from '@/components/admin/wallet-adjustment-modal';
import { Loader2, ArrowLeft, Wallet, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  wallet: {
    balance: string;
  };
  orders: Array<{
    id: string;
    serviceId: string;
    totalPrice: string;
    status: string;
    createdAt: string;
  }>;
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user');

      const data = await response.json();
      setUser(data);
    } catch (error) {
      console.error('Error fetching user:', error);
      toast.error('Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const handleStatusToggle = async () => {
    if (!user) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      toast.success(`User ${!user.isActive ? 'activated' : 'suspended'} successfully`);
      await fetchUser();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update user status');
    } finally {
      setActionLoading(false);
      setStatusDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">User not found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/users"
          className="inline-flex items-center text-sm text-blue-600 hover:underline mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Users
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">User Details</h1>
      </div>

      {/* User Info Card */}
      <Card className="p-6 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">{user.name}</h2>
            <p className="text-gray-600">{user.email}</p>
          </div>
          <div className="flex gap-2">
            <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
              {user.role}
            </Badge>
            <Badge variant={user.isActive ? 'default' : 'destructive'}>
              {user.isActive ? 'Active' : 'Suspended'}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-600">Created</p>
            <p className="text-gray-900">
              {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Orders</p>
            <p className="text-gray-900">{user.orders.length}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant={user.isActive ? 'destructive' : 'default'}
            onClick={() => setStatusDialogOpen(true)}
            disabled={actionLoading}
          >
            {user.isActive ? 'Suspend Account' : 'Activate Account'}
          </Button>
        </div>
      </Card>

      {/* Wallet Card */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-semibold">Wallet Balance</h2>
          </div>
          <Button onClick={() => setWalletModalOpen(true)}>
            Adjust Balance
          </Button>
        </div>
        <p className="text-4xl font-bold text-gray-900">${user.wallet.balance}</p>
      </Card>

      {/* Order History Card */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingCart className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Recent Orders</h2>
        </div>
        {user.orders.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No orders yet</p>
        ) : (
          <div className="space-y-3">
            {user.orders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="flex items-center justify-between p-4 border rounded hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-mono text-sm text-gray-600">{order.id.slice(0, 8)}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">${order.totalPrice}</p>
                  <Badge variant="outline" className="mt-1">
                    {order.status}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Status Confirmation Dialog */}
      <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {user.isActive ? 'Suspend' : 'Activate'} User Account?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {user.isActive
                ? 'This user will not be able to log in once suspended.'
                : 'This user will regain access to their account.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStatusToggle} disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                'Confirm'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Wallet Adjustment Modal */}
      <WalletAdjustmentModal
        userId={userId}
        currentBalance={user.wallet.balance}
        open={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        onSuccess={fetchUser}
      />
    </div>
  );
}
```

- [ ] **Step 2: Create AlertDialog component if missing**

File: `src/components/ui/alert-dialog.tsx`

```tsx
import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

const AlertDialog = AlertDialogPrimitive.Root
const AlertDialogTrigger = AlertDialogPrimitive.Trigger
const AlertDialogPortal = AlertDialogPrimitive.Portal

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    />
  </AlertDialogPortal>
))
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName

const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col space-y-2 text-center sm:text-left", className)}
    {...props}
  />
)
AlertDialogHeader.displayName = "AlertDialogHeader"

const AlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
    {...props}
  />
)
AlertDialogFooter.displayName = "AlertDialogFooter"

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold", className)}
    {...props}
  />
))
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-gray-600", className)}
    {...props}
  />
))
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName

const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={cn(buttonVariants(), className)}
    {...props}
  />
))
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName

const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(buttonVariants({ variant: "outline" }), "mt-2 sm:mt-0", className)}
    {...props}
  />
))
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/users/[id]/page.tsx src/components/ui/alert-dialog.tsx
git commit -m "feat(admin): add user detail page with suspend and wallet adjust"
```

---

### Task 13: Platform APIs

**Files:**
- Create: `src/app/api/admin/platforms/route.ts`
- Create: `src/app/api/admin/platforms/[id]/route.ts`

- [ ] **Step 1: Create platforms list and create API**

File: `src/app/api/admin/platforms/route.ts`

```tsx
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    await requireAdmin();

    const platforms = await prisma.platform.findMany({
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json(platforms);
  } catch (error) {
    console.error('Error fetching platforms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch platforms' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { name, slug, icon, isActive, order } = body;

    // Validation
    if (!name || name.trim().length === 0 || name.length > 50) {
      return NextResponse.json(
        { error: 'Name is required and must be less than 50 characters' },
        { status: 400 }
      );
    }

    if (!slug || slug.trim().length === 0) {
      return NextResponse.json(
        { error: 'Slug is required' },
        { status: 400 }
      );
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: 'Slug must be lowercase letters, numbers, and hyphens only' },
        { status: 400 }
      );
    }

    if (!icon || icon.trim().length === 0) {
      return NextResponse.json(
        { error: 'Icon URL is required' },
        { status: 400 }
      );
    }

    // Check for duplicate slug
    const existing = await prisma.platform.findUnique({
      where: { slug: slug.trim().toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A platform with this slug already exists' },
        { status: 400 }
      );
    }

    const platform = await prisma.platform.create({
      data: {
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        icon: icon.trim(),
        isActive: typeof isActive === 'boolean' ? isActive : true,
        order: typeof order === 'number' ? order : 0,
      },
    });

    return NextResponse.json(platform, { status: 201 });
  } catch (error) {
    console.error('Error creating platform:', error);
    return NextResponse.json(
      { error: 'Failed to create platform' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Create platform detail, update, delete API**

File: `src/app/api/admin/platforms/[id]/route.ts`

```tsx
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const platform = await prisma.platform.findUnique({
      where: { id },
      include: {
        categories: {
          include: {
            _count: {
              select: { services: true },
            },
          },
        },
      },
    });

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(platform);
  } catch (error) {
    console.error('Error fetching platform:', error);
    return NextResponse.json(
      { error: 'Failed to fetch platform' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const { name, slug, icon, isActive, order } = body;

    // Check platform exists
    const existing = await prisma.platform.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Platform not found' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: any = {};

    if (name !== undefined) {
      if (name.trim().length === 0 || name.length > 50) {
        return NextResponse.json(
          { error: 'Name must be between 1 and 50 characters' },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (slug !== undefined) {
      if (slug.trim().length === 0 || !/^[a-z0-9-]+$/.test(slug)) {
        return NextResponse.json(
          { error: 'Invalid slug format' },
          { status: 400 }
        );
      }

      // Check slug uniqueness
      const duplicateSlug = await prisma.platform.findUnique({
        where: { slug: slug.trim().toLowerCase() },
      });

      if (duplicateSlug && duplicateSlug.id !== id) {
        return NextResponse.json(
          { error: 'Slug already in use' },
          { status: 400 }
        );
      }

      updateData.slug = slug.trim().toLowerCase();
    }

    if (icon !== undefined) {
      if (icon.trim().length === 0) {
        return NextResponse.json(
          { error: 'Icon URL is required' },
          { status: 400 }
        );
      }
      updateData.icon = icon.trim();
    }

    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;
    }

    if (typeof order === 'number') {
      updateData.order = order;
    }

    const platform = await prisma.platform.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(platform);
  } catch (error) {
    console.error('Error updating platform:', error);
    return NextResponse.json(
      { error: 'Failed to update platform' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    // Check for dependent categories
    const categoryCount = await prisma.serviceCategory.count({
      where: { platformId: id },
    });

    if (categoryCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete platform because ${categoryCount} categories depend on it` },
        { status: 400 }
      );
    }

    await prisma.platform.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting platform:', error);
    return NextResponse.json(
      { error: 'Failed to delete platform' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/platforms/
git commit -m "feat(admin): add platform CRUD APIs"
```

---

### Task 14: Category APIs

**Files:**
- Create: `src/app/api/admin/categories/route.ts`
- Create: `src/app/api/admin/categories/[id]/route.ts`

- [ ] **Step 1: Create categories list and create API**

File: `src/app/api/admin/categories/route.ts`

```tsx
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const platformId = searchParams.get('platformId');

    const where: any = {};
    if (platformId) {
      where.platformId = platformId;
    }

    const categories = await prisma.serviceCategory.findMany({
      where,
      include: {
        platform: {
          select: { name: true },
        },
        _count: {
          select: { services: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { platformId, name, slug, description, isActive } = body;

    // Validation
    if (!platformId || platformId.trim().length === 0) {
      return NextResponse.json(
        { error: 'Platform is required' },
        { status: 400 }
      );
    }

    if (!name || name.trim().length === 0 || name.length > 50) {
      return NextResponse.json(
        { error: 'Name is required and must be less than 50 characters' },
        { status: 400 }
      );
    }

    if (!slug || slug.trim().length === 0) {
      return NextResponse.json(
        { error: 'Slug is required' },
        { status: 400 }
      );
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: 'Slug must be lowercase letters, numbers, and hyphens only' },
        { status: 400 }
      );
    }

    // Check platform exists
    const platform = await prisma.platform.findUnique({
      where: { id: platformId },
    });

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform not found' },
        { status: 404 }
      );
    }

    // Check for duplicate slug
    const existing = await prisma.serviceCategory.findUnique({
      where: { slug: slug.trim().toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A category with this slug already exists' },
        { status: 400 }
      );
    }

    const category = await prisma.serviceCategory.create({
      data: {
        platformId,
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        description: description?.trim() || null,
        isActive: typeof isActive === 'boolean' ? isActive : true,
      },
      include: {
        platform: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Create category detail, update, delete API**

File: `src/app/api/admin/categories/[id]/route.ts`

```tsx
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const category = await prisma.serviceCategory.findUnique({
      where: { id },
      include: {
        platform: true,
        services: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const { platformId, name, slug, description, isActive } = body;

    // Check category exists
    const existing = await prisma.serviceCategory.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: any = {};

    if (platformId !== undefined) {
      const platform = await prisma.platform.findUnique({
        where: { id: platformId },
      });
      if (!platform) {
        return NextResponse.json(
          { error: 'Platform not found' },
          { status: 404 }
        );
      }
      updateData.platformId = platformId;
    }

    if (name !== undefined) {
      if (name.trim().length === 0 || name.length > 50) {
        return NextResponse.json(
          { error: 'Name must be between 1 and 50 characters' },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (slug !== undefined) {
      if (slug.trim().length === 0 || !/^[a-z0-9-]+$/.test(slug)) {
        return NextResponse.json(
          { error: 'Invalid slug format' },
          { status: 400 }
        );
      }

      const duplicateSlug = await prisma.serviceCategory.findUnique({
        where: { slug: slug.trim().toLowerCase() },
      });

      if (duplicateSlug && duplicateSlug.id !== id) {
        return NextResponse.json(
          { error: 'Slug already in use' },
          { status: 400 }
        );
      }

      updateData.slug = slug.trim().toLowerCase();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;
    }

    const category = await prisma.serviceCategory.update({
      where: { id },
      data: updateData,
      include: {
        platform: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    // Check for dependent services
    const serviceCount = await prisma.service.count({
      where: { categoryId: id },
    });

    if (serviceCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete category because ${serviceCount} services depend on it` },
        { status: 400 }
      );
    }

    await prisma.serviceCategory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/categories/
git commit -m "feat(admin): add category CRUD APIs"
```

---

### Task 15: Service APIs

**Files:**
- Create: `src/app/api/admin/services/route.ts`
- Create: `src/app/api/admin/services/[id]/route.ts`

- [ ] **Step 1: Create services list and create API**

File: `src/app/api/admin/services/route.ts`

```tsx
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { prisma } from '@/lib/db/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    
    const platformId = searchParams.get('platformId');
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {};

    if (categoryId) {
      where.categoryId = categoryId;
    } else if (platformId) {
      where.category = {
        platformId: platformId,
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        include: {
          category: {
            include: {
              platform: {
                select: { name: true },
              },
            },
          },
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.service.count({ where }),
    ]);

    const formattedServices = services.map(service => ({
      ...service,
      price: service.price.toString(),
    }));

    return NextResponse.json({
      services: formattedServices,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const {
      categoryId,
      name,
      slug,
      description,
      price,
      minQuantity,
      maxQuantity,
      estimatedDeliveryTime,
      isActive,
    } = body;

    // Validation
    if (!categoryId || categoryId.trim().length === 0) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      );
    }

    if (!name || name.trim().length === 0 || name.length > 100) {
      return NextResponse.json(
        { error: 'Name is required and must be less than 100 characters' },
        { status: 400 }
      );
    }

    if (!slug || slug.trim().length === 0) {
      return NextResponse.json(
        { error: 'Slug is required' },
        { status: 400 }
      );
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: 'Slug must be lowercase letters, numbers, and hyphens only' },
        { status: 400 }
      );
    }

    if (!description || description.trim().length === 0 || description.length > 500) {
      return NextResponse.json(
        { error: 'Description is required and must be less than 500 characters' },
        { status: 400 }
      );
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0.01 || parsedPrice > 10000) {
      return NextResponse.json(
        { error: 'Price must be between $0.01 and $10,000' },
        { status: 400 }
      );
    }

    const parsedMinQty = parseInt(minQuantity);
    const parsedMaxQty = parseInt(maxQuantity);

    if (isNaN(parsedMinQty) || parsedMinQty < 1) {
      return NextResponse.json(
        { error: 'Minimum quantity must be at least 1' },
        { status: 400 }
      );
    }

    if (isNaN(parsedMaxQty) || parsedMaxQty <= parsedMinQty) {
      return NextResponse.json(
        { error: 'Maximum quantity must be greater than minimum quantity' },
        { status: 400 }
      );
    }

    if (!estimatedDeliveryTime || estimatedDeliveryTime.trim().length === 0) {
      return NextResponse.json(
        { error: 'Estimated delivery time is required' },
        { status: 400 }
      );
    }

    // Check category exists
    const category = await prisma.serviceCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check for duplicate slug
    const existing = await prisma.service.findUnique({
      where: { slug: slug.trim().toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A service with this slug already exists' },
        { status: 400 }
      );
    }

    const service = await prisma.service.create({
      data: {
        categoryId,
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        description: description.trim(),
        price: new Decimal(parsedPrice),
        minQuantity: parsedMinQty,
        maxQuantity: parsedMaxQty,
        estimatedDeliveryTime: estimatedDeliveryTime.trim(),
        isActive: typeof isActive === 'boolean' ? isActive : true,
      },
      include: {
        category: {
          include: {
            platform: {
              select: { name: true },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        ...service,
        price: service.price.toString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json(
      { error: 'Failed to create service' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Create service detail, update, delete API**

File: `src/app/api/admin/services/[id]/route.ts`

```tsx
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { prisma } from '@/lib/db/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        category: {
          include: {
            platform: true,
          },
        },
      },
    });

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...service,
      price: service.price.toString(),
    });
  } catch (error) {
    console.error('Error fetching service:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    // Check service exists
    const existing = await prisma.service.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: any = {};

    if (body.categoryId !== undefined) {
      const category = await prisma.serviceCategory.findUnique({
        where: { id: body.categoryId },
      });
      if (!category) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        );
      }
      updateData.categoryId = body.categoryId;
    }

    if (body.name !== undefined) {
      if (body.name.trim().length === 0 || body.name.length > 100) {
        return NextResponse.json(
          { error: 'Name must be between 1 and 100 characters' },
          { status: 400 }
        );
      }
      updateData.name = body.name.trim();
    }

    if (body.slug !== undefined) {
      if (body.slug.trim().length === 0 || !/^[a-z0-9-]+$/.test(body.slug)) {
        return NextResponse.json(
          { error: 'Invalid slug format' },
          { status: 400 }
        );
      }

      const duplicateSlug = await prisma.service.findUnique({
        where: { slug: body.slug.trim().toLowerCase() },
      });

      if (duplicateSlug && duplicateSlug.id !== id) {
        return NextResponse.json(
          { error: 'Slug already in use' },
          { status: 400 }
        );
      }

      updateData.slug = body.slug.trim().toLowerCase();
    }

    if (body.description !== undefined) {
      if (body.description.trim().length === 0 || body.description.length > 500) {
        return NextResponse.json(
          { error: 'Description must be between 1 and 500 characters' },
          { status: 400 }
        );
      }
      updateData.description = body.description.trim();
    }

    if (body.price !== undefined) {
      const parsedPrice = parseFloat(body.price);
      if (isNaN(parsedPrice) || parsedPrice < 0.01 || parsedPrice > 10000) {
        return NextResponse.json(
          { error: 'Price must be between $0.01 and $10,000' },
          { status: 400 }
        );
      }
      updateData.price = new Decimal(parsedPrice);
    }

    if (body.minQuantity !== undefined) {
      const parsedMinQty = parseInt(body.minQuantity);
      if (isNaN(parsedMinQty) || parsedMinQty < 1) {
        return NextResponse.json(
          { error: 'Minimum quantity must be at least 1' },
          { status: 400 }
        );
      }
      updateData.minQuantity = parsedMinQty;
    }

    if (body.maxQuantity !== undefined) {
      const parsedMaxQty = parseInt(body.maxQuantity);
      const minQty = updateData.minQuantity || existing.minQuantity;
      if (isNaN(parsedMaxQty) || parsedMaxQty <= minQty) {
        return NextResponse.json(
          { error: 'Maximum quantity must be greater than minimum quantity' },
          { status: 400 }
        );
      }
      updateData.maxQuantity = parsedMaxQty;
    }

    if (body.estimatedDeliveryTime !== undefined) {
      if (body.estimatedDeliveryTime.trim().length === 0) {
        return NextResponse.json(
          { error: 'Estimated delivery time is required' },
          { status: 400 }
        );
      }
      updateData.estimatedDeliveryTime = body.estimatedDeliveryTime.trim();
    }

    if (typeof body.isActive === 'boolean') {
      updateData.isActive = body.isActive;
    }

    const service = await prisma.service.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          include: {
            platform: {
              select: { name: true },
            },
          },
        },
      },
    });

    return NextResponse.json({
      ...service,
      price: service.price.toString(),
    });
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json(
      { error: 'Failed to update service' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    // Check for orders using this service
    const orderCount = await prisma.order.count({
      where: { serviceId: id },
    });

    if (orderCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete service because ${orderCount} orders reference it` },
        { status: 400 }
      );
    }

    await prisma.service.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json(
      { error: 'Failed to delete service' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/services/
git commit -m "feat(admin): add service CRUD APIs"
```

---

### Task 16: Service Management Page

**Files:**
- Create: `src/app/admin/services/page.tsx`

- [ ] **Step 1: Create services management page with tabs**

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

type TabType = 'platforms' | 'categories' | 'services';

interface Platform {
  id: string;
  name: string;
  slug: string;
  icon: string;
  isActive: boolean;
  order: number;
}

interface Category {
  id: string;
  platformId: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  platform: { name: string };
  _count?: { services: number };
}

interface Service {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  minQuantity: number;
  maxQuantity: number;
  estimatedDeliveryTime: string;
  isActive: boolean;
  category: {
    name: string;
    platform: { name: string };
  };
}

export default function AdminServicesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('platforms');
  const [loading, setLoading] = useState(false);

  // Platform state
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [platformModalOpen, setPlatformModalOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<Platform | null>(null);

  // Category state
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryPlatformFilter, setCategoryPlatformFilter] = useState('ALL');

  // Service state
  const [services, setServices] = useState<Service[]>([]);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [servicePlatformFilter, setServicePlatformFilter] = useState('ALL');
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState('ALL');
  const [serviceSearch, setServiceSearch] = useState('');
  const [servicePage, setServicePage] = useState(1);
  const [serviceTotalPages, setServiceTotalPages] = useState(1);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: TabType; id: string; name: string } | null>(null);

  // Fetch data
  const fetchPlatforms = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/platforms');
      if (!response.ok) throw new Error('Failed to fetch platforms');
      const data = await response.json();
      setPlatforms(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load platforms');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryPlatformFilter !== 'ALL') {
        params.append('platformId', categoryPlatformFilter);
      }
      const response = await fetch(`/api/admin/categories?${params}`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: servicePage.toString(),
        limit: '20',
      });
      if (serviceCategoryFilter !== 'ALL') {
        params.append('categoryId', serviceCategoryFilter);
      } else if (servicePlatformFilter !== 'ALL') {
        params.append('platformId', servicePlatformFilter);
      }
      if (serviceSearch) {
        params.append('search', serviceSearch);
      }

      const response = await fetch(`/api/admin/services?${params}`);
      if (!response.ok) throw new Error('Failed to fetch services');
      const data = await response.json();
      setServices(data.services);
      setServiceTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'platforms') fetchPlatforms();
    if (activeTab === 'categories') fetchCategories();
    if (activeTab === 'services') fetchServices();
  }, [activeTab, categoryPlatformFilter, servicePage, servicePlatformFilter, serviceCategoryFilter]);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setLoading(true);
    try {
      const endpoint = {
        platforms: `/api/admin/platforms/${deleteTarget.id}`,
        categories: `/api/admin/categories/${deleteTarget.id}`,
        services: `/api/admin/services/${deleteTarget.id}`,
      }[deleteTarget.type];

      const response = await fetch(endpoint, { method: 'DELETE' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete');
      }

      toast.success(`${deleteTarget.type.slice(0, -1)} deleted successfully`);
      if (deleteTarget.type === 'platforms') fetchPlatforms();
      if (deleteTarget.type === 'categories') fetchCategories();
      if (deleteTarget.type === 'services') fetchServices();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to delete');
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  };

  const filteredCategories = servicePlatformFilter !== 'ALL'
    ? categories.filter(c => c.platformId === servicePlatformFilter)
    : categories;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Service Management</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {(['platforms', 'categories', 'services'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize ${
              activeTab === tab
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Platforms Tab */}
      {activeTab === 'platforms' && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Platforms</h2>
            <Button onClick={() => { setEditingPlatform(null); setPlatformModalOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Platform
            </Button>
          </div>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : platforms.length === 0 ? (
            <p className="text-center py-12 text-gray-500">No platforms found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {platforms.map((platform) => (
                    <tr key={platform.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900">{platform.name}</td>
                      <td className="px-4 py-3 text-gray-600 font-mono text-sm">{platform.slug}</td>
                      <td className="px-4 py-3">
                        <Badge variant={platform.isActive ? 'default' : 'secondary'}>
                          {platform.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-900">{platform.order}</td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setEditingPlatform(platform); setPlatformModalOpen(true); }}
                          className="mr-2"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setDeleteTarget({ type: 'platforms', id: platform.id, name: platform.name });
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold">Categories</h2>
              <Select value={categoryPlatformFilter} onValueChange={setCategoryPlatformFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Platforms</SelectItem>
                  {platforms.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => { setEditingCategory(null); setCategoryModalOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Category
            </Button>
          </div>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : categories.length === 0 ? (
            <p className="text-center py-12 text-gray-500">No categories found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platform</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {categories.map((category) => (
                    <tr key={category.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900">{category.name}</td>
                      <td className="px-4 py-3 text-gray-600">{category.platform.name}</td>
                      <td className="px-4 py-3 text-gray-600 font-mono text-sm">{category.slug}</td>
                      <td className="px-4 py-3">
                        <Badge variant={category.isActive ? 'default' : 'secondary'}>
                          {category.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setEditingCategory(category); setCategoryModalOpen(true); }}
                          className="mr-2"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setDeleteTarget({ type: 'categories', id: category.id, name: category.name });
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Services Tab */}
      {activeTab === 'services' && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold">Services</h2>
              <Select value={servicePlatformFilter} onValueChange={(v) => { setServicePlatformFilter(v); setServiceCategoryFilter('ALL'); }}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Platforms</SelectItem>
                  {platforms.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={serviceCategoryFilter} onValueChange={setServiceCategoryFilter} disabled={servicePlatformFilter === 'ALL'}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  {filteredCategories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search services..."
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" onClick={() => { setServicePage(1); fetchServices(); }}>
                Search
              </Button>
            </div>
            <Button onClick={() => { setEditingService(null); setServiceModalOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Service
            </Button>
          </div>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : services.length === 0 ? (
            <p className="text-center py-12 text-gray-500">No services found</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platform</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity Range</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {services.map((service) => (
                      <tr key={service.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900">{service.name}</td>
                        <td className="px-4 py-3 text-gray-600">{service.category.platform.name}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900">${service.price}</td>
                        <td className="px-4 py-3 text-gray-600">{service.minQuantity} - {service.maxQuantity}</td>
                        <td className="px-4 py-3">
                          <Badge variant={service.isActive ? 'default' : 'secondary'}>
                            {service.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setEditingService(service); setServiceModalOpen(true); }}
                            className="mr-2"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setDeleteTarget({ type: 'services', id: service.id, name: service.name });
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {serviceTotalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t">
                  <p className="text-sm text-gray-600">
                    Page {servicePage} of {serviceTotalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setServicePage(p => Math.max(1, p - 1))}
                      disabled={servicePage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setServicePage(p => Math.min(serviceTotalPages, p + 1))}
                      disabled={servicePage === serviceTotalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.type.slice(0, -1)}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modals will be in separate tasks */}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/services/page.tsx
git commit -m "feat(admin): add services management page with tabs"
```

---

### Task 17: Platform/Category/Service Form Modals

**Files:**
- Modify: `src/app/admin/services/page.tsx`

- [ ] **Step 1: Add Platform form modal to services page**

Insert before closing `</div>` in return statement:

```tsx
{/* Platform Modal */}
<Dialog open={platformModalOpen} onOpenChange={setPlatformModalOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>{editingPlatform ? 'Edit' : 'Create'} Platform</DialogTitle>
    </DialogHeader>
    <PlatformForm
      platform={editingPlatform}
      onSuccess={() => {
        setPlatformModalOpen(false);
        setEditingPlatform(null);
        fetchPlatforms();
      }}
      onCancel={() => {
        setPlatformModalOpen(false);
        setEditingPlatform(null);
      }}
    />
  </DialogContent>
</Dialog>

{/* Category Modal */}
<Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>{editingCategory ? 'Edit' : 'Create'} Category</DialogTitle>
    </DialogHeader>
    <CategoryForm
      category={editingCategory}
      platforms={platforms}
      onSuccess={() => {
        setCategoryModalOpen(false);
        setEditingCategory(null);
        fetchCategories();
      }}
      onCancel={() => {
        setCategoryModalOpen(false);
        setEditingCategory(null);
      }}
    />
  </DialogContent>
</Dialog>

{/* Service Modal */}
<Dialog open={serviceModalOpen} onOpenChange={setServiceModalOpen}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>{editingService ? 'Edit' : 'Create'} Service</DialogTitle>
    </DialogHeader>
    <ServiceForm
      service={editingService}
      categories={categories}
      onSuccess={() => {
        setServiceModalOpen(false);
        setEditingService(null);
        fetchServices();
      }}
      onCancel={() => {
        setServiceModalOpen(false);
        setEditingService(null);
      }}
    />
  </DialogContent>
</Dialog>
```

- [ ] **Step 2: Add form component imports at top of file**

```tsx
import { PlatformForm } from '@/components/admin/platform-form';
import { CategoryForm } from '@/components/admin/category-form';
import { ServiceForm } from '@/components/admin/service-form';
```

- [ ] **Step 3: Create Platform form component**

File: `src/components/admin/platform-form.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Platform {
  id: string;
  name: string;
  slug: string;
  icon: string;
  isActive: boolean;
  order: number;
}

interface PlatformFormProps {
  platform: Platform | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PlatformForm({ platform, onSuccess, onCancel }: PlatformFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    icon: '',
    isActive: true,
    order: 0,
  });

  useEffect(() => {
    if (platform) {
      setFormData({
        name: platform.name,
        slug: platform.slug,
        icon: platform.icon,
        isActive: platform.isActive,
        order: platform.order,
      });
    }
  }, [platform]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = platform
        ? `/api/admin/platforms/${platform.id}`
        : '/api/admin/platforms';
      const method = platform ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save platform');

      toast.success(`Platform ${platform ? 'updated' : 'created'} successfully`);
      onSuccess();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to save platform');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          maxLength={50}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug *</Label>
        <Input
          id="slug"
          value={formData.slug}
          onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
          required
          pattern="[a-z0-9-]+"
          placeholder="e.g. instagram"
        />
        <p className="text-xs text-gray-500">Lowercase letters, numbers, and hyphens only</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="icon">Icon URL *</Label>
        <Input
          id="icon"
          type="url"
          value={formData.icon}
          onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
          required
          placeholder="https://example.com/icon.png"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="order">Display Order</Label>
        <Input
          id="order"
          type="number"
          value={formData.order}
          onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="rounded"
        />
        <Label htmlFor="isActive">Active</Label>
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            'Save'
          )}
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 4: Create Category form component**

File: `src/components/admin/category-form.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Category {
  id: string;
  platformId: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
}

interface Platform {
  id: string;
  name: string;
}

interface CategoryFormProps {
  category: Category | null;
  platforms: Platform[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function CategoryForm({ category, platforms, onSuccess, onCancel }: CategoryFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    platformId: '',
    name: '',
    slug: '',
    description: '',
    isActive: true,
  });

  useEffect(() => {
    if (category) {
      setFormData({
        platformId: category.platformId,
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        isActive: category.isActive,
      });
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = category
        ? `/api/admin/categories/${category.id}`
        : '/api/admin/categories';
      const method = category ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save category');

      toast.success(`Category ${category ? 'updated' : 'created'} successfully`);
      onSuccess();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="platformId">Platform *</Label>
        <Select
          value={formData.platformId}
          onValueChange={(value) => setFormData({ ...formData, platformId: value })}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select platform" />
          </SelectTrigger>
          <SelectContent>
            {platforms.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          maxLength={50}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug *</Label>
        <Input
          id="slug"
          value={formData.slug}
          onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
          required
          pattern="[a-z0-9-]+"
          placeholder="e.g. followers"
        />
        <p className="text-xs text-gray-500">Lowercase letters, numbers, and hyphens only</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          maxLength={200}
          rows={2}
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="rounded"
        />
        <Label htmlFor="isActive">Active</Label>
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            'Save'
          )}
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 5: Create Service form component**

File: `src/components/admin/service-form.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Service {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  minQuantity: number;
  maxQuantity: number;
  estimatedDeliveryTime: string;
  isActive: boolean;
}

interface Category {
  id: string;
  name: string;
  platform: { name: string };
}

interface ServiceFormProps {
  service: Service | null;
  categories: Category[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function ServiceForm({ service, categories, onSuccess, onCancel }: ServiceFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    categoryId: '',
    name: '',
    slug: '',
    description: '',
    price: '',
    minQuantity: 100,
    maxQuantity: 10000,
    estimatedDeliveryTime: '1-3 days',
    isActive: true,
  });

  useEffect(() => {
    if (service) {
      setFormData({
        categoryId: service.categoryId,
        name: service.name,
        slug: service.slug,
        description: service.description,
        price: service.price,
        minQuantity: service.minQuantity,
        maxQuantity: service.maxQuantity,
        estimatedDeliveryTime: service.estimatedDeliveryTime,
        isActive: service.isActive,
      });
    }
  }, [service]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = service
        ? `/api/admin/services/${service.id}`
        : '/api/admin/services';
      const method = service ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save service');

      toast.success(`Service ${service ? 'updated' : 'created'} successfully`);
      onSuccess();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to save service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="categoryId">Category *</Label>
        <Select
          value={formData.categoryId}
          onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(c => (
              <SelectItem key={c.id} value={c.id}>
                {c.platform.name} - {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            maxLength={100}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug *</Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
            required
            pattern="[a-z0-9-]+"
            placeholder="e.g. instagram-followers"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
          maxLength={500}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Price ($) *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0.01"
            max="10000"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="minQuantity">Min Quantity *</Label>
          <Input
            id="minQuantity"
            type="number"
            min="1"
            value={formData.minQuantity}
            onChange={(e) => setFormData({ ...formData, minQuantity: parseInt(e.target.value) || 1 })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxQuantity">Max Quantity *</Label>
          <Input
            id="maxQuantity"
            type="number"
            min="1"
            value={formData.maxQuantity}
            onChange={(e) => setFormData({ ...formData, maxQuantity: parseInt(e.target.value) || 1 })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="estimatedDeliveryTime">Estimated Delivery Time *</Label>
        <Input
          id="estimatedDeliveryTime"
          value={formData.estimatedDeliveryTime}
          onChange={(e) => setFormData({ ...formData, estimatedDeliveryTime: e.target.value })}
          required
          placeholder="e.g. 1-3 days"
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="rounded"
        />
        <Label htmlFor="isActive">Active</Label>
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            'Save'
          )}
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 6: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 7: Commit**

```bash
git add src/app/admin/services/page.tsx src/components/admin/
git commit -m "feat(admin): add platform/category/service form modals"
```

---

### Task 18: Final Verification and Build Test

**Files:**
- None (testing only)

- [ ] **Step 1: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Test development build**

Run: `npm run dev`
Expected: Server starts without errors

- [ ] **Step 3: Verify routes are accessible**

Navigate to:
- http://localhost:3000/admin → should redirect to /admin/dashboard
- http://localhost:3000/admin/dashboard → analytics page
- http://localhost:3000/admin/orders → existing orders page
- http://localhost:3000/admin/users → users list
- http://localhost:3000/admin/services → services management

Expected: All pages render without errors

- [ ] **Step 4: Test production build**

Run: `npm run build`
Expected: Build completes successfully

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "chore: Phase 7 complete - admin panel expansion"
```

---

## Self-Review

**Spec coverage:**
- ✅ Admin layout with sidebar (Task 1-2)
- ✅ Analytics dashboard (Task 3-4)
- ✅ User management APIs (Task 5-8)
- ✅ User management UI (Task 9-12)
- ✅ Platform/Category/Service APIs (Task 13-15)
- ✅ Service management UI (Task 16-17)
- ✅ Final verification (Task 18)

**Placeholder scan:** None found. All tasks have complete code.

**Type consistency:** All interfaces match across tasks. API response types align with component props.