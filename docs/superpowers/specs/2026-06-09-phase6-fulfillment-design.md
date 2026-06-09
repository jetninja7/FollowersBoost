# Phase 6: Order Fulfillment System - Design Specification

**Date:** 2026-06-09  
**Author:** AI Assistant  
**Status:** Draft - Awaiting Approval  

---

## Executive Summary

**Goal:** Bridge the gap between order creation and actual service delivery by implementing a manual fulfillment system with automatic order processing, admin management interface, and user notifications.

**Approach:** Lean MVP with manual fulfillment first, designed to easily add API automation later.

**Timeline:** 2-3 days implementation

**Dependencies:** 
- Phase 3B complete (order creation, wallet system)
- Prisma, Next.js 15, PostgreSQL

---

## Problem Statement

Currently, the system can:
- ✅ Accept orders from users
- ✅ Charge wallet balance
- ✅ Display orders to users with real-time polling

But cannot:
- ❌ Process orders (they stay PENDING forever)
- ❌ Update order progress
- ❌ Mark orders complete
- ❌ Notify users of status changes
- ❌ Provide admin interface for fulfillment

**This phase closes that gap.**

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────┐
│                     User Layer                       │
│  - Creates orders                                    │
│  - Views order status (real-time polling)            │
│  - Receives notifications                            │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│                  API Layer                           │
│  - Order creation (existing)                         │
│  - Order status updates (new)                        │
│  - Admin endpoints (new)                             │
│  - Notification endpoints (new)                      │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│              Processing Layer                        │
│  - Cron job (5-min interval)                         │
│  - Auto-transitions PENDING → PROCESSING            │
│  - Detects stuck orders                              │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│                 Admin Layer                          │
│  - View all orders                                   │
│  - Update status manually                            │
│  - Update progress                                   │
│  - Add notes                                         │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│               Database Layer                         │
│  - Orders (with new fields)                          │
│  - OrderLogs (new table)                             │
│  - Notifications (existing)                          │
└─────────────────────────────────────────────────────┘
```

### Data Flow

```
1. User creates order (status: PENDING)
   ↓
2. Cron job runs (every 5 min)
   ↓
3. Order auto-transitions to PROCESSING
   ↓ (notification sent)
4. Admin sees in dashboard
   ↓
5. Admin starts work → IN_PROGRESS
   ↓ (notification sent)
6. Admin updates progress repeatedly
   ↓
7. Admin marks complete → COMPLETED
   ↓ (notification sent)
8. User sees completion in real-time
```

---

## Database Schema Changes

### Order Model Updates

```prisma
model Order {
  // ... existing fields ...
  id                    String               @id @default(uuid())
  userId                String
  serviceId             String
  quantity              Int
  totalPrice            Decimal              @db.Decimal(10, 2)
  status                OrderStatus          @default(PENDING)
  targetUrl             String
  startCount            Int?
  currentCount          Int?
  fulfillmentProvider   FulfillmentProvider?
  fulfillmentProviderId String?
  notes                 String?              // User notes
  createdAt             DateTime             @default(now())
  updatedAt             DateTime             @updatedAt
  completedAt           DateTime?
  
  // NEW FIELDS:
  adminNotes            String?              // Admin-only notes (private)
  failureReason         String?              // Why order failed (user-facing)
  startedAt             DateTime?            // When admin started fulfillment
  lastProgressUpdate    DateTime?            // Last progress update timestamp
  
  // RELATIONSHIPS:
  user                  User                 @relation(...)
  orderLogs             OrderLog[]           // NEW: Audit trail
}
```

### New OrderLog Model

```prisma
model OrderLog {
  id          String   @id @default(uuid())
  orderId     String
  action      String   // "STATUS_CHANGED", "PROGRESS_UPDATED", "NOTE_ADDED"
  oldValue    String?  // Previous value (JSON string)
  newValue    String?  // New value (JSON string)
  performedBy String?  // userId or "SYSTEM"
  note        String?  // Optional admin note
  createdAt   DateTime @default(now())
  
  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  @@index([orderId, createdAt(sort: Desc)])
}
```

**Why OrderLog vs AuditLog:**
- Dedicated to orders only (cleaner queries)
- Optimized indexes for order history
- Simpler to display in admin UI
- AuditLog remains for system-wide auditing

---

## Order Status State Machine

### Status Definitions

| Status | Meaning | Who Sets | Duration |
|--------|---------|----------|----------|
| PENDING | Order created, waiting to start | System | 1-5 minutes |
| PROCESSING | Picked up, ready for fulfillment | Cron job | Minutes to hours |
| IN_PROGRESS | Admin actively fulfilling | Admin | Hours to days |
| COMPLETED | Delivery finished successfully | Admin | Final |
| CANCELLED | Cancelled before/during fulfillment | User or Admin | Final |
| FAILED | Delivery attempted but failed | Admin | Final |
| REFUNDED | Completed but refunded later | Admin | Final |

### Valid Transitions

```
PENDING
  ↓ (auto after 1 min)
PROCESSING
  ↓ (admin starts)
IN_PROGRESS
  ↓ (admin completes)
COMPLETED

From PENDING or PROCESSING:
  → CANCELLED (user or admin cancels, refund issued)

From IN_PROGRESS:
  → FAILED (delivery issue, refund issued)
  → CANCELLED (admin cancels, refund issued)

From COMPLETED:
  → REFUNDED (quality issue, refund issued)
```

### Transition Business Rules

**PENDING → PROCESSING:**
- Automatic via cron job
- Happens 1 minute after order creation (buffer for user cancellation)
- Records startCount (current follower count, if available)
- Creates notification for user
- Creates OrderLog entry

**PROCESSING → IN_PROGRESS:**
- Manual via admin
- Admin clicks "Start Fulfillment"
- Records startedAt timestamp
- Creates notification for user
- Creates OrderLog entry

**IN_PROGRESS → COMPLETED:**
- Manual via admin
- Validates: currentCount >= startCount + quantity
- Records completedAt timestamp
- Creates notification for user
- Creates OrderLog entry

**Any → CANCELLED/FAILED:**
- Requires reason (failureReason field)
- Issues automatic wallet refund
- Creates REFUND transaction
- Creates notification for user
- Creates OrderLog entry

**COMPLETED → REFUNDED:**
- Rare case (quality complaint)
- Issues wallet refund
- Creates REFUND transaction
- Creates notification for user
- Creates OrderLog entry

---

## API Endpoints

### Admin Endpoints (New)

All admin endpoints require `role === "ADMIN"` authentication check.

#### 1. List Orders (Admin View)

```
GET /api/admin/orders

Query Parameters:
  - status: PENDING | PROCESSING | IN_PROGRESS | COMPLETED | CANCELLED | FAILED | REFUNDED | all (default: all)
  - search: string (searches order ID, user email, target URL)
  - sortBy: createdAt | updatedAt | status (default: createdAt)
  - sortOrder: asc | desc (default: desc)
  - page: number (default: 1)
  - limit: number (default: 50)

Response:
{
  data: [
    {
      id: string,
      userId: string,
      user: { name: string, email: string },
      serviceId: string,
      service: { name: string, platform: string },
      quantity: number,
      totalPrice: Decimal,
      status: OrderStatus,
      targetUrl: string,
      startCount: number | null,
      currentCount: number | null,
      progress: number, // calculated percentage
      createdAt: Date,
      updatedAt: Date,
      startedAt: Date | null,
      completedAt: Date | null,
      adminNotes: string | null
    }
  ],
  meta: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  },
  stats: {
    pending: number,
    processing: number,
    inProgress: number,
    needsAttention: number // stuck orders (no update in 24h)
  }
}

Business Logic:
- Include user and service details (join)
- Calculate progress percentage: (currentCount - startCount) / quantity * 100
- needsAttention: IN_PROGRESS orders with lastProgressUpdate > 24h ago
```

#### 2. Get Order Details (Admin View)

```
GET /api/admin/orders/[id]

Response:
{
  data: {
    ...all order fields,
    user: {
      id: string,
      name: string,
      email: string,
      role: string
    },
    service: {
      id: string,
      name: string,
      platform: string,
      category: string,
      price: Decimal
    },
    logs: [
      {
        id: string,
        action: string,
        oldValue: string | null,
        newValue: string | null,
        performedBy: string | null,
        note: string | null,
        createdAt: Date
      }
    ]
  }
}

Business Logic:
- Join with user, service (with platform and category)
- Include all OrderLog entries (ordered by createdAt desc)
```

#### 3. Update Order Status

```
PATCH /api/admin/orders/[id]/status

Body:
{
  status: OrderStatus,
  failureReason?: string,  // Required if status = FAILED
  adminNote?: string
}

Response:
{
  data: Order,
  message: string
}

Business Logic:
1. Validate status transition is allowed
2. If FAILED/CANCELLED/REFUNDED:
   - Calculate refund amount (totalPrice)
   - Update wallet balance (+refund)
   - Create REFUND transaction
3. If COMPLETED:
   - Validate currentCount >= startCount + quantity
   - Set completedAt timestamp
4. Create OrderLog entry
5. Create user Notification
6. Update order with new status
7. Use Prisma transaction for atomicity
```

#### 4. Update Order Progress

```
PATCH /api/admin/orders/[id]/progress

Body:
{
  currentCount: number,
  adminNote?: string
}

Response:
{
  data: Order,
  message: string
}

Business Logic:
1. Validate currentCount >= startCount
2. If order not IN_PROGRESS, auto-transition to IN_PROGRESS
3. Update lastProgressUpdate timestamp
4. Create OrderLog entry
5. No user notification (too frequent, they poll every 30s)
```

#### 5. Add Admin Note

```
POST /api/admin/orders/[id]/notes

Body:
{
  note: string,
  isPublic: boolean  // If true, visible to user in notes field
}

Response:
{
  data: OrderLog,
  message: string
}

Business Logic:
1. If isPublic: Update order.notes field (user can see)
2. If private: Update order.adminNotes field (admin only)
3. Create OrderLog with action="NOTE_ADDED"
```

#### 6. Bulk Actions

```
POST /api/admin/orders/bulk

Body:
{
  orderIds: string[],
  action: "START" | "CANCEL" | "MARK_FAILED",
  reason?: string  // Required for CANCEL and MARK_FAILED
}

Response:
{
  results: [
    {
      orderId: string,
      success: boolean,
      error?: string
    }
  ],
  summary: {
    total: number,
    succeeded: number,
    failed: number
  }
}

Business Logic:
- Process each order individually
- Don't fail entire batch if one fails
- Return success/failure for each
- Applies appropriate status transition for each action
```

### Notification Endpoints (New)

All notification endpoints require user authentication.

#### 1. List Notifications

```
GET /api/notifications

Query Parameters:
  - unread: boolean (default: false)
  - page: number (default: 1)
  - limit: number (default: 20)

Response:
{
  data: [
    {
      id: string,
      type: NotificationType,
      title: string,
      message: string,
      isRead: boolean,
      metadata: object | null,
      createdAt: Date
    }
  ],
  meta: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}

Business Logic:
- Filter by userId (current user)
- Order by createdAt DESC
- If unread=true, filter isRead=false
```

#### 2. Get Unread Count

```
GET /api/notifications/unread-count

Response:
{
  count: number
}

Business Logic:
- Count where userId = current user AND isRead = false
- Used by notification bell badge
```

#### 3. Mark Notification as Read

```
PATCH /api/notifications/[id]/read

Response:
{
  data: Notification,
  message: string
}

Business Logic:
- Verify notification belongs to current user
- Update isRead = true
```

#### 4. Mark All as Read

```
POST /api/notifications/mark-all-read

Response:
{
  count: number,
  message: string
}

Business Logic:
- Update all notifications for current user to isRead = true
- Return count of notifications updated
```

---

## Cron Job Processing

### Configuration

**Vercel Cron** (vercel.json):
```json
{
  "crons": [{
    "path": "/api/cron/process-orders",
    "schedule": "*/5 * * * *"
  }]
}
```

**Alternative:** Any cron service can call the endpoint every 5 minutes.

### Endpoint

```
GET /api/cron/process-orders

Headers:
  Authorization: Bearer <CRON_SECRET>

Response:
{
  success: boolean,
  processed: number,
  errors: string[],
  transitions: [
    {
      orderId: string,
      from: OrderStatus,
      to: OrderStatus
    }
  ],
  warnings: [
    {
      orderId: string,
      issue: string
    }
  ]
}
```

### Processing Logic

```typescript
async function processOrders() {
  const results = {
    processed: 0,
    errors: [],
    transitions: [],
    warnings: []
  };

  // 1. Auto-transition PENDING → PROCESSING
  //    (after 1 minute buffer for user cancellation)
  const pendingOrders = await prisma.order.findMany({
    where: {
      status: 'PENDING',
      createdAt: {
        lte: new Date(Date.now() - 60000) // 1 minute old
      }
    }
  });

  for (const order of pendingOrders) {
    try {
      await transitionToProcessing(order);
      results.processed++;
      results.transitions.push({
        orderId: order.id,
        from: 'PENDING',
        to: 'PROCESSING'
      });
    } catch (error) {
      results.errors.push(`Order ${order.id}: ${error.message}`);
    }
  }

  // 2. Detect stuck orders
  //    (IN_PROGRESS but no progress update in 24 hours)
  const stuckOrders = await prisma.order.findMany({
    where: {
      status: 'IN_PROGRESS',
      OR: [
        { lastProgressUpdate: { lte: new Date(Date.now() - 86400000) } },
        { lastProgressUpdate: null, startedAt: { lte: new Date(Date.now() - 86400000) } }
      ]
    }
  });

  for (const order of stuckOrders) {
    // Just log warning, don't auto-fail (admin should investigate)
    await createOrderLog({
      orderId: order.id,
      action: 'WARNING',
      note: 'Order stuck - no progress update in 24 hours',
      performedBy: 'SYSTEM'
    });
    
    results.warnings.push({
      orderId: order.id,
      issue: 'No progress in 24 hours'
    });
  }

  // 3. Log execution to AuditLog
  await prisma.auditLog.create({
    data: {
      action: 'CRON_EXECUTED',
      entity: 'Order',
      entityId: 'batch',
      changes: results
    }
  });

  return results;
}
```

### Helper Function: Transition to Processing

```typescript
async function transitionToProcessing(order: Order) {
  return await prisma.$transaction(async (tx) => {
    // Optional: Fetch current follower count from target URL
    // For MVP, startCount = 0 (admin sets manually)
    const startCount = 0;

    // Update order
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: 'PROCESSING',
        startCount: startCount,
        currentCount: startCount
      }
    });

    // Create OrderLog
    await tx.orderLog.create({
      data: {
        orderId: order.id,
        action: 'STATUS_CHANGED',
        oldValue: 'PENDING',
        newValue: 'PROCESSING',
        performedBy: 'SYSTEM'
      }
    });

    // Create user notification
    await tx.notification.create({
      data: {
        userId: order.userId,
        type: 'ORDER_UPDATE',
        title: 'Order Processing',
        message: 'Your order is now being processed and will start soon.',
        metadata: {
          orderId: order.id
        }
      }
    });
  });
}
```

### Security

- Verify cron request authenticity:
  - Check `Authorization: Bearer <CRON_SECRET>` header
  - Or use Vercel Cron's built-in authentication
- Return 401 if unauthorized
- Rate limit to prevent abuse

---

## Notification System

### Notification Creation

**When to create notifications:**

1. **PENDING → PROCESSING** (System)
   - Title: "Order Processing"
   - Message: "Your order #{orderId} is now being processed."

2. **PROCESSING → IN_PROGRESS** (Admin)
   - Title: "Order Started"
   - Message: "We've started delivering your {serviceName}!"

3. **IN_PROGRESS → COMPLETED** (Admin)
   - Title: "Order Completed 🎉"
   - Message: "Your order has been successfully delivered!"

4. **Any → FAILED** (Admin)
   - Title: "Order Failed"
   - Message: "We couldn't complete your order. {failureReason}. Refund: ${amount}."

5. **Any → CANCELLED** (Admin/User)
   - Title: "Order Cancelled"
   - Message: "Your order has been cancelled. Refund: ${amount}."

### Helper Function

```typescript
// lib/notifications.ts

async function notifyOrderStatusChange(
  tx: PrismaTransaction,
  order: Order,
  oldStatus: OrderStatus,
  newStatus: OrderStatus,
  options?: {
    failureReason?: string,
    service?: { name: string }
  }
) {
  const notifications: Record<OrderStatus, { title: string, message: string }> = {
    PROCESSING: {
      title: 'Order Processing',
      message: `Your order #${order.id.slice(0, 8)} is now being processed.`
    },
    IN_PROGRESS: {
      title: 'Order Started',
      message: `We've started delivering ${options?.service?.name || 'your order'}!`
    },
    COMPLETED: {
      title: 'Order Completed 🎉',
      message: `Your order has been successfully delivered!`
    },
    FAILED: {
      title: 'Order Failed',
      message: `We couldn't complete your order. ${options?.failureReason || 'Please contact support.'}. Refund: $${order.totalPrice}`
    },
    CANCELLED: {
      title: 'Order Cancelled',
      message: `Your order has been cancelled. Refund: $${order.totalPrice}`
    },
    REFUNDED: {
      title: 'Order Refunded',
      message: `Your order has been refunded. Amount: $${order.totalPrice}`
    },
    PENDING: null // No notification for PENDING
  };

  const notification = notifications[newStatus];
  
  if (notification) {
    await tx.notification.create({
      data: {
        userId: order.userId,
        type: 'ORDER_UPDATE',
        title: notification.title,
        message: notification.message,
        metadata: {
          orderId: order.id,
          oldStatus,
          newStatus
        }
      }
    });
  }
}
```

---

## Admin UI Pages

### Page 1: Orders Dashboard

**Route:** `/admin/orders`

**Authentication:** Requires `role === "ADMIN"`

**Layout:**

```
┌─────────────────────────────────────────────────────┐
│ Orders Dashboard                    [Refresh] [Bulk] │
├─────────────────────────────────────────────────────┤
│ Quick Stats:                                         │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐│
│ │ Pending  │ │Processing│ │In Progress│ │Completed││
│ │    12    │ │     5    │ │     8    │ │   45    ││
│ └──────────┘ └──────────┘ └──────────┘ └─────────┘│
│ ┌─────────────┐                                     │
│ │ ⚠️ Attention │                                     │
│ │      2      │  (Stuck orders)                     │
│ └─────────────┘                                     │
├─────────────────────────────────────────────────────┤
│ Filters & Search:                                    │
│ Status: [All Status ▼]                              │
│ Search: [_______________________] [Search]          │
│ Sort: [Created Date ▼] [Descending ▼]              │
├─────────────────────────────────────────────────────┤
│ Orders Table:                                        │
│ ☐  Order ID    User           Service        Status │
│ ☐  #4F2A3B     john@test.com  IG Followers   🟡     │
│    1000 qty    $50.00         45% (450/1000) 2h ago │
│                                                       │
│ ☐  #8B1C9D     mary@test.com  TikTok Likes   🔵     │
│    5000 qty    $125.00        Not started    15m ago│
│                                                       │
│ ☐  #2E4F6A     bob@test.com   Twitter Foll.  🟢     │
│    2500 qty    $75.00         Completed      1d ago │
│                                                       │
│ Showing 1-20 of 234            [< Prev] [Next >]    │
└─────────────────────────────────────────────────────┘
```

**Features:**

1. **Quick Stats Cards**
   - Real-time counts by status
   - Needs Attention badge (stuck orders)
   - Click card to filter by that status

2. **Filters**
   - Status dropdown (All, Pending, Processing, etc.)
   - Search box (order ID, email, URL)
   - Sort options (date, status)

3. **Orders Table**
   - Checkbox for bulk selection
   - Click row → navigate to detail page
   - Show key info: user, service, status, progress
   - Color-coded status badges
   - Relative time (2h ago, 15m ago)

4. **Bulk Actions**
   - Select multiple orders
   - Bulk start/cancel/fail

5. **Pagination**
   - 50 orders per page
   - Previous/Next navigation

**Status Badge Colors:**
- 🔴 FAILED - Red solid
- 🟠 CANCELLED - Orange outline
- 🟡 IN_PROGRESS - Yellow/Amber
- 🔵 PROCESSING - Blue
- ⚫ PENDING - Gray
- 🟢 COMPLETED - Green

### Page 2: Order Management

**Route:** `/admin/orders/[id]`

**Authentication:** Requires `role === "ADMIN"`

**Layout:**

```
┌─────────────────────────────────────────────────────┐
│ ← Back to Orders          Order #4F2A3B             │
├─────────────────────────────────────────────────────┤
│ Order Information                                    │
│ ┌─────────────────────────────────────────────────┐│
│ │ User: john@example.com (John Doe)               ││
│ │ Service: Instagram Followers - Premium Package  ││
│ │ Platform: Instagram | Category: Followers       ││
│ │ Target URL: https://instagram.com/johndoe       ││
│ │ Quantity: 1,000 followers                       ││
│ │ Price: $50.00 (paid from wallet)                ││
│ │ Status: [🟡 IN_PROGRESS]                        ││
│ │ Created: Jan 15, 2026 3:30 PM (2 hours ago)    ││
│ │ Started: Jan 15, 2026 4:00 PM (1.5 hours ago)  ││
│ └─────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────┤
│ Progress Tracking                                    │
│ ┌─────────────────────────────────────────────────┐│
│ │ Start Count: 1,245 followers                    ││
│ │ Current Count: [1,695_______] [Update Progress]││
│ │ Target Count: 2,245 followers (1,245 + 1,000)  ││
│ │                                                  ││
│ │ Progress: [████████░░░░░░░░] 45%                ││
│ │ Delivered: 450 / 1,000                          ││
│ │ Last Updated: 10 minutes ago                    ││
│ └─────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────┤
│ Quick Actions                                        │
│ [▶ Start Fulfillment] [✓ Mark Complete]            │
│ [✕ Mark Failed] [⟲ Cancel & Refund]                │
├─────────────────────────────────────────────────────┤
│ Admin Notes (Private)                                │
│ ┌─────────────────────────────────────────────────┐│
│ │ [Add note here...]                              ││
│ │                                                  ││
│ └─────────────────────────────────────────────────┘│
│ ☐ Visible to user                                   │
│ [Add Note]                                          │
├─────────────────────────────────────────────────────┤
│ Activity Log                                         │
│ • 10 min ago - Progress updated to 1,695 (Admin)   │
│ • 1 hour ago - Status changed: PROCESSING →        │
│                IN_PROGRESS (Admin)                  │
│ • 2 hours ago - Status changed: PENDING →          │
│                 PROCESSING (System)                 │
│ • 2 hours ago - Order created by user               │
└─────────────────────────────────────────────────────┘
```

**Features:**

1. **Order Information Card**
   - All order details at a glance
   - User info (name, email)
   - Service details (name, platform, category)
   - Target URL (clickable)
   - Timestamps (created, started, completed)

2. **Progress Tracker**
   - Input field for current count
   - "Update Progress" button
   - Visual progress bar
   - Percentage calculation
   - Last update time

3. **Quick Actions**
   - Context-aware buttons (shown based on current status)
   - Start: PROCESSING → IN_PROGRESS
   - Complete: IN_PROGRESS → COMPLETED
   - Fail: Any → FAILED (opens modal for reason)
   - Cancel: Any active → CANCELLED (confirmation dialog)

4. **Admin Notes**
   - Private text area (admin only by default)
   - Toggle "Visible to user" (adds to order.notes)
   - Useful for tracking delivery issues

5. **Activity Log**
   - Complete audit trail from OrderLog
   - Shows who did what and when
   - System vs admin actions clearly labeled

**Button Visibility Logic:**
- PENDING/PROCESSING: Show "Start Fulfillment"
- IN_PROGRESS: Show "Mark Complete" and "Mark Failed"
- Any active status: Show "Cancel & Refund"
- COMPLETED/CANCELLED/FAILED: No action buttons (view only)

---

## User Notification UI

### Component 1: Notification Bell

**Location:** Dashboard header (all pages)

**Component:** `NotificationBell` (`/components/notifications/notification-bell.tsx`)

**Design:**

```
Header: [...existing items...] [🔔 3]
```

**Features:**
- Bell icon with badge showing unread count
- Badge only visible if count > 0
- Click → opens dropdown popover
- Fetches unread count via API on mount
- Updates every 30 seconds (polling)

**Dropdown Popover:**

```
┌─────────────────────────────────────┐
│ Notifications        [Mark All Read]│
├─────────────────────────────────────┤
│ • 🎉 Order Completed                │
│   Your order has been delivered     │
│   2 hours ago                       │
├─────────────────────────────────────┤
│   📦 Order Started                  │
│   We've started delivering...       │
│   5 hours ago                       │
├─────────────────────────────────────┤
│   ⚙️ Order Processing               │
│   Your order is being processed     │
│   1 day ago                         │
├─────────────────────────────────────┤
│ [View All Notifications →]          │
└─────────────────────────────────────┘
```

**Dropdown Features:**
- Shows 5 most recent notifications
- Blue dot for unread
- Click notification → mark as read + navigate to order
- "Mark All Read" button
- "View All" link to full notifications page

### Component 2: Notifications Page

**Route:** `/dashboard/notifications`

**Authentication:** Requires user login

**Layout:**

```
┌─────────────────────────────────────────────────────┐
│ Notifications                    [Mark All as Read] │
├─────────────────────────────────────────────────────┤
│ Filter: [All ▼] [Unread Only ☐]                    │
├─────────────────────────────────────────────────────┤
│ Today                                                │
│ ┌─────────────────────────────────────────────┐    │
│ │ • 🎉 Order Completed                     [✓]│    │
│ │   Your order #4F2A has been delivered       │    │
│ │   2 hours ago                               │    │
│ │   [View Order →]                            │    │
│ └─────────────────────────────────────────────┘    │
│                                                      │
│ ┌─────────────────────────────────────────────┐    │
│ │   📦 Order Started                        [✓]│    │
│ │   We've started delivering your order       │    │
│ │   5 hours ago                               │    │
│ │   [View Order →]                            │    │
│ └─────────────────────────────────────────────┘    │
│                                                      │
│ Yesterday                                            │
│ ┌─────────────────────────────────────────────┐    │
│ │   ⚙️ Order Processing                     [✓]│    │
│ │   Your order is being processed             │    │
│ │   1 day ago                                 │    │
│ │   [View Order →]                            │    │
│ └─────────────────────────────────────────────┘    │
│                                                      │
│ [Load More]                                          │
└─────────────────────────────────────────────────────┘
```

**Features:**

1. **Date Grouping**
   - Today, Yesterday, This Week, Older
   - Clear visual separation

2. **Notification Cards**
   - Icon based on type (🎉 💰 ⚠️ 📦)
   - Title and message
   - Relative time
   - Unread indicator (blue dot)
   - Mark as read button (checkmark)
   - "View Order" link

3. **Filters**
   - Type filter dropdown (All, Order Updates, Payments, System)
   - Unread only checkbox

4. **Bulk Actions**
   - "Mark All as Read" in header

5. **Pagination**
   - "Load More" button (20 per page)
   - Infinite scroll alternative

**Notification Type Icons:**
- ORDER_UPDATE: 📦
- PAYMENT_SUCCESS: 💰
- PAYMENT_FAILED: ⚠️
- SYSTEM_ALERT: 🔔

---

## Implementation Strategy

### Phase 6A: Core Fulfillment (Day 1-2)

**Priority 1: Database & Cron**
1. Add database schema changes (migration)
2. Create cron job endpoint
3. Test auto-transition PENDING → PROCESSING

**Priority 2: Admin API**
4. Create admin middleware (requireAdmin)
5. Implement admin order endpoints
6. Test status updates and refunds

**Priority 3: Admin UI**
7. Create orders dashboard page
8. Create order detail page
9. Test manual fulfillment flow

### Phase 6B: Notifications (Day 3)

**Priority 4: Notification Backend**
10. Create notification helper functions
11. Integrate notifications into status changes
12. Create notification API endpoints

**Priority 5: Notification UI**
13. Create notification bell component
14. Add to dashboard header
15. Create notifications page
16. Test notification flow end-to-end

### Testing Checklist

**Functional Tests:**
- [ ] Cron job transitions orders correctly
- [ ] Admin can update order status
- [ ] Admin can update progress
- [ ] Refunds issued on cancel/fail
- [ ] Notifications created on status changes
- [ ] Notification bell shows correct count
- [ ] Mark as read works
- [ ] Activity log records all changes

**User Flows:**
- [ ] Create order → auto-transitions to PROCESSING
- [ ] Admin starts order → user notified
- [ ] Admin updates progress → progress bar updates
- [ ] Admin completes order → user notified
- [ ] Admin cancels order → user refunded and notified
- [ ] User clicks notification → navigates to order

**Edge Cases:**
- [ ] Stuck order detection works
- [ ] Invalid status transitions blocked
- [ ] Completing without sufficient progress fails
- [ ] Refunds calculate correctly
- [ ] OrderLogs created for all actions

---

## Future Enhancements (Phase 6C)

**Not in scope for Phase 6, but prepared for:**

1. **SMM Panel API Integration**
   - Add provider registry system
   - Create SMM panel API client
   - Auto-submit orders to provider
   - Receive webhook updates
   - Still keep manual as fallback

2. **Automatic Progress Tracking**
   - Scrape follower counts from target URLs
   - Auto-update currentCount
   - Detect delivery completion automatically

3. **Email Notifications**
   - Send emails on major status changes
   - Use Resend or SendGrid

4. **Advanced Admin Features**
   - Analytics dashboard
   - Provider performance metrics
   - User management
   - Bulk import orders

5. **Order Quality Monitoring**
   - Track drop rate (unfollows)
   - Auto-refund if quality issues
   - Retention guarantees

---

## Success Criteria

**Phase 6 is complete when:**

1. ✅ Orders automatically transition from PENDING to PROCESSING
2. ✅ Admin can view all orders with filters
3. ✅ Admin can manually update order status and progress
4. ✅ Refunds automatically issued on cancel/fail
5. ✅ Users receive in-app notifications on status changes
6. ✅ Notification bell shows unread count
7. ✅ Users can view notification history
8. ✅ Complete audit trail via OrderLog
9. ✅ All endpoints tested and working
10. ✅ TypeScript compiles with no errors

**Acceptance Test:**
```
1. User creates order (PENDING)
2. Wait 1 minute → Order auto-transitions to PROCESSING
3. Admin sees order in dashboard
4. Admin starts fulfillment → Order becomes IN_PROGRESS
5. User gets notification "Order Started"
6. Admin updates progress twice
7. Admin marks complete → Order becomes COMPLETED
8. User gets notification "Order Completed"
9. User sees complete history in order detail page
```

---

## Appendix

### Environment Variables

Add to `.env.local`:

```env
# Cron Job Authentication
CRON_SECRET=your-random-secret-here
```

### File Structure

```
src/
├── app/
│   ├── admin/
│   │   └── orders/
│   │       ├── page.tsx              # Orders dashboard
│   │       └── [id]/
│   │           └── page.tsx          # Order management
│   ├── dashboard/
│   │   └── notifications/
│   │       └── page.tsx              # Notifications page
│   └── api/
│       ├── admin/
│       │   └── orders/
│       │       ├── route.ts          # List orders
│       │       ├── [id]/
│       │       │   ├── status/
│       │       │   │   └── route.ts  # Update status
│       │       │   ├── progress/
│       │       │   │   └── route.ts  # Update progress
│       │       │   └── notes/
│       │       │       └── route.ts  # Add notes
│       │       └── bulk/
│       │           └── route.ts      # Bulk actions
│       ├── notifications/
│       │   ├── route.ts              # List notifications
│       │   ├── unread-count/
│       │   │   └── route.ts          # Get count
│       │   ├── [id]/
│       │   │   └── read/
│       │   │       └── route.ts      # Mark as read
│       │   └── mark-all-read/
│       │       └── route.ts          # Mark all
│       └── cron/
│           └── process-orders/
│               └── route.ts          # Cron job
├── components/
│   └── notifications/
│       ├── notification-bell.tsx     # Header bell
│       └── notification-item.tsx     # Single notification
├── lib/
│   ├── fulfillment/
│   │   ├── order-processor.ts        # Core logic
│   │   ├── status-machine.ts         # Valid transitions
│   │   └── progress-tracker.ts       # Progress helpers
│   └── notifications.ts              # Notification helpers
└── prisma/
    └── migrations/
        └── XXX_add_fulfillment/
            └── migration.sql         # Schema changes
```

### Database Migration

```sql
-- Add new fields to Order table
ALTER TABLE "Order" ADD COLUMN "adminNotes" TEXT;
ALTER TABLE "Order" ADD COLUMN "failureReason" TEXT;
ALTER TABLE "Order" ADD COLUMN "startedAt" TIMESTAMP;
ALTER TABLE "Order" ADD COLUMN "lastProgressUpdate" TIMESTAMP;

-- Create OrderLog table
CREATE TABLE "OrderLog" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "performedBy" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderLog_pkey" PRIMARY KEY ("id")
);

-- Add indexes
CREATE INDEX "OrderLog_orderId_createdAt_idx" ON "OrderLog"("orderId", "createdAt" DESC);

-- Add foreign key
ALTER TABLE "OrderLog" ADD CONSTRAINT "OrderLog_orderId_fkey" 
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE;
```

---

**End of Design Specification**

This document is ready for review and approval before implementation begins.
