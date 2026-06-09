# Phase 7: Expand Admin Panel - Design Spec

**Date:** 2026-06-09  
**Status:** Approved  
**Depends On:** Phase 6 (Order Fulfillment System)

---

## Goal

Build comprehensive admin panel with complete operational control: user management, service management (full CRUD for platforms/categories/services), system analytics dashboard, and unified sidebar navigation.

## Scope

**In Scope:**
- Admin layout with sidebar navigation
- Analytics dashboard (essential metrics only)
- User management (basic: view, suspend/activate, wallet adjustments)
- Service management (full CRUD: platforms, categories, services)
- Admin-only APIs for all operations
- Authentication enforcement (`requireAdmin()`)

**Out of Scope:**
- Charts/graphs (Phase 8)
- Role management (user role changes)
- User impersonation
- Email notifications
- Audit logs (already exists in schema, not exposed yet)
- Settings/configuration management

---

## Architecture

### Navigation Structure

```
/admin
├── layout.tsx                    # Sidebar wrapper for all admin pages
├── page.tsx                      # Redirect to /admin/dashboard
├── dashboard/
│   └── page.tsx                  # Analytics overview
├── orders/
│   ├── page.tsx                  # Existing order list
│   └── [id]/page.tsx             # Existing order detail
├── users/
│   ├── page.tsx                  # User list with filters
│   └── [id]/page.tsx             # User detail + wallet adjustment
└── services/
    └── page.tsx                  # Tabbed interface (Platforms/Categories/Services)
```

### Component Structure

```
src/components/admin/
├── admin-sidebar.tsx             # Persistent sidebar navigation
├── order-stats.tsx               # Existing stats cards
├── analytics-cards.tsx           # Revenue, user, top services cards
├── user-table.tsx                # User list table
├── wallet-adjustment-modal.tsx   # Add/subtract wallet funds
├── platform-form.tsx             # Platform create/edit form
├── category-form.tsx             # Category create/edit form
└── service-form.tsx              # Service create/edit form
```

### API Structure

```
/api/admin/
├── orders/...                    # Existing
├── users/
│   ├── route.ts                  # GET list (filters, pagination)
│   └── [id]/
│       ├── route.ts              # GET single user + orders
│       ├── status/route.ts       # PATCH suspend/activate
│       └── wallet/
│           └── adjust/route.ts   # POST wallet adjustment
├── platforms/
│   ├── route.ts                  # GET list, POST create
│   └── [id]/route.ts             # GET, PATCH, DELETE
├── categories/
│   ├── route.ts                  # GET list, POST create
│   └── [id]/route.ts             # GET, PATCH, DELETE
└── services/
    ├── route.ts                  # GET list, POST create
    └── [id]/route.ts             # GET, PATCH, DELETE
```

---

## Feature Details

### 1. Admin Layout & Sidebar Navigation

**Sidebar Menu Items:**
- Dashboard (analytics overview)
- Orders (existing functionality)
- Users (user management)
- Services (platform/category/service management)

**Behavior:**
- Persistent sidebar on all admin pages
- Active state highlighting for current section
- Responsive: collapsible on mobile (<768px), persistent on desktop
- Wraps all `/admin/*` routes via `layout.tsx`

**Authentication:**
- All admin routes check `requireAdmin()` middleware
- Redirect to `/login` if not authenticated
- Return 403 if authenticated but not ADMIN role

---

### 2. Analytics Dashboard (`/admin/dashboard`)

**Revenue Card:**
- Total revenue (all completed orders, all time)
- Today's revenue (orders completed today)
- This week's revenue (orders completed in last 7 days)
- This month's revenue (orders completed in current month)

**Order Stats Card:**
- Total order count
- Breakdown by status with counts and percentages:
  - Pending
  - Processing
  - In Progress
  - Completed
  - Cancelled
  - Failed

**User Stats Card:**
- Total user count
- New users this week (created in last 7 days)
- Active users (placed at least 1 order in last 30 days)

**Top Services Card:**
- Top 5 services by total revenue
- Each shows: service name, platform, total revenue, order count

**Implementation:**
- Server component with direct Prisma queries
- Simple SQL aggregations (COUNT, SUM, WHERE date filters)
- No real-time updates (page refresh to update)
- No charts/graphs (just cards with numbers)

---

### 3. User Management

#### Users List Page (`/admin/users`)

**Display:**
- Table columns: email, name, role, status, wallet balance, created date
- Search input (filters by email or name, case-insensitive)
- Role filter dropdown: ALL, USER, MODERATOR, ADMIN
- Status filter dropdown: ALL, ACTIVE, SUSPENDED
- Pagination: 20 users per page
- Click row → navigate to user detail page

**API Endpoint:**
```
GET /api/admin/users?search=john&role=USER&status=ACTIVE&page=1&limit=20
```

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "USER",
      "isActive": true,
      "createdAt": "2026-01-15T10:30:00Z",
      "wallet": {
        "balance": "150.00"
      }
    }
  ],
  "total": 47,
  "page": 1,
  "totalPages": 3
}
```

#### User Detail Page (`/admin/users/[id]`)

**User Info Card:**
- Email, name, role, status (active/suspended), created date
- Wallet balance (prominent display)

**Order History:**
- Last 10 orders for this user
- Shows: order ID, service name, amount, status, date
- Link to order detail page

**Actions:**
- **Suspend/Activate Account:**
  - Button toggles `isActive` field
  - Suspended users cannot log in
  - Confirmation dialog before action
  
- **Adjust Wallet Balance:**
  - Opens modal with form:
    - Operation: Add Funds / Subtract Funds (radio buttons)
    - Amount (decimal input, min $0.01)
    - Reason (textarea, required)
  - Creates Transaction record:
    - Type: DEPOSIT or WITHDRAWAL
    - Status: COMPLETED
    - Metadata: `{ reason: "...", adminId: "...", adminName: "..." }`
  - Updates wallet balance atomically (Prisma transaction)

**API Endpoints:**
```
GET /api/admin/users/[id]
PATCH /api/admin/users/[id]/status
POST /api/admin/users/[id]/wallet/adjust
```

**Wallet Adjust Request:**
```json
{
  "operation": "ADD", // or "SUBTRACT"
  "amount": 50.00,
  "reason": "Customer service refund for issue #123"
}
```

**Wallet Adjust Response:**
```json
{
  "success": true,
  "newBalance": "200.00",
  "transaction": {
    "id": "uuid",
    "type": "DEPOSIT",
    "amount": "50.00",
    "status": "COMPLETED"
  }
}
```

---

### 4. Service Management

#### Services Overview Page (`/admin/services`)

**Layout:**
- Three tabs: Platforms, Categories, Services
- Each tab has own list view + "Create New" button
- Active tab highlighted

#### Platforms Tab

**Display:**
- Table columns: name, slug, icon preview, status (active/inactive), display order, actions
- "Create Platform" button → opens form modal
- Edit button → opens form modal with existing data
- Delete button → confirmation dialog, checks for dependencies

**Platform Form Fields:**
- Name (text, required, max 50 chars)
- Slug (text, required, lowercase, no spaces, unique)
- Icon URL (text, required, must be valid URL)
- Active (toggle, default true)
- Display Order (number, default 0)

**Validation:**
- Cannot delete platform if categories exist (foreign key constraint)
- Slug must be unique
- Icon URL must be valid

**API Endpoints:**
```
GET /api/admin/platforms
POST /api/admin/platforms
PATCH /api/admin/platforms/[id]
DELETE /api/admin/platforms/[id]
```

#### Categories Tab

**Display:**
- Table columns: name, platform, slug, description, status, actions
- Filter by platform (dropdown)
- "Create Category" button → opens form modal
- Edit/Delete buttons with same pattern as platforms

**Category Form Fields:**
- Platform (dropdown, required, shows all active platforms)
- Name (text, required, max 50 chars)
- Slug (text, required, lowercase, unique)
- Description (textarea, optional, max 200 chars)
- Active (toggle, default true)

**Validation:**
- Cannot delete category if services exist (foreign key constraint)
- Slug must be unique
- Must select a platform

**API Endpoints:**
```
GET /api/admin/categories?platformId=uuid
POST /api/admin/categories
PATCH /api/admin/categories/[id]
DELETE /api/admin/categories/[id]
```

#### Services Tab

**Display:**
- Table columns: name, category, platform, price, quantity range, status, actions
- Filter by platform (dropdown) → cascades to category filter
- Filter by category (dropdown, filtered by selected platform)
- Search by name (text input, case-insensitive)
- Pagination: 20 services per page
- "Create Service" button → opens form modal
- Edit/Delete buttons with same pattern

**Service Form Fields:**
- Category (dropdown, required, grouped by platform)
- Name (text, required, max 100 chars)
- Slug (text, required, lowercase, unique)
- Description (textarea, required, max 500 chars)
- Price (decimal, required, min $0.01, max $10,000)
- Min Quantity (integer, required, min 1)
- Max Quantity (integer, required, must be > minQuantity)
- Estimated Delivery Time (text, required, e.g. "1-3 days")
- Active (toggle, default true)

**Validation:**
- Cannot delete service if orders reference it
- Slug must be unique
- Max quantity must be greater than min quantity
- Price must be positive

**API Endpoints:**
```
GET /api/admin/services?platformId=uuid&categoryId=uuid&search=followers&page=1&limit=20
POST /api/admin/services
PATCH /api/admin/services/[id]
DELETE /api/admin/services/[id]
```

---

## Data Flow

### Analytics Dashboard
1. Server component fetches data via Prisma
2. Revenue: `sum(totalPrice) WHERE status = COMPLETED`
3. Order stats: `count(*) GROUP BY status`
4. User stats: `count(*)` with date filters
5. Top services: join Orders + Services, `sum(totalPrice) GROUP BY serviceId ORDER BY revenue DESC LIMIT 5`
6. Render as static cards

### User Management
1. Admin searches/filters users
2. API queries User table with filters, joins Wallet
3. Returns paginated list
4. Click user → fetch full details + order history
5. Action (suspend/adjust wallet) → API call → Prisma transaction → refresh data

### Service Management
1. Admin selects tab (Platform/Category/Service)
2. Fetch list via API (with filters if applicable)
3. Create/Edit → form modal → validate → API call → Prisma mutation
4. Delete → confirmation → check foreign keys → API call → Prisma delete

---

## Error Handling

**API Errors:**
- Validation errors: return `{ error: "message" }` with 400 status
- Not found: return `{ error: "Not found" }` with 404 status
- Foreign key constraint: return `{ error: "Cannot delete X because Y depends on it" }` with 400 status
- Server errors: log error, return generic message with 500 status

**UI Errors:**
- API errors: display toast notification with error message
- Form validation: inline error messages below fields
- Loading states: skeleton loaders during data fetch
- Empty states: "No X found" messages when list is empty

**Confirmation Dialogs:**
- Delete operations: "Are you sure you want to delete this X? This action cannot be undone."
- Suspend user: "Suspend this user? They will not be able to log in."
- Activate user: "Activate this user? They will regain access."

---

## Security

**Authentication:**
- All `/admin/*` routes require authentication
- `requireAdmin()` middleware checks `user.role === 'ADMIN'`
- Unauthenticated: redirect to `/login`
- Authenticated but not admin: return 403 Forbidden

**Authorization:**
- Only ADMIN role can access admin panel
- No user can change their own role
- Wallet adjustments logged with admin ID in metadata

**Input Validation:**
- Server-side validation on all API endpoints
- Sanitize string inputs (trim, max length)
- Validate enums (role, status, transaction type)
- Check foreign key constraints before delete

**Data Protection:**
- User passwords never exposed in API responses
- Transaction metadata stored as JSON (flexible for audit trail)
- Wallet adjustments are atomic (Prisma transaction)

---

## Testing Strategy

**API Testing:**
- Unit tests for each endpoint
- Test filters, pagination, search
- Test error cases (not found, validation, constraints)
- Test wallet adjustment atomicity

**UI Testing:**
- Render tests for all pages
- Test form validation
- Test table filtering and pagination
- Test confirmation dialogs

**Integration Testing:**
- Test full user flow: search → view → suspend → adjust wallet
- Test service creation flow: create platform → create category → create service
- Test analytics calculations with real data

---

## Implementation Notes

**Database:**
- All models already exist in Prisma schema
- No migrations needed
- Cascade deletes already configured (Platform → Category → Service)
- AuditLog model exists but not exposed yet

**UI Components:**
- Reuse existing: Button, Card, Badge, Table, Dialog, Input, Textarea
- New components: Sidebar, modals, forms
- Tailwind for styling (consistent with existing pages)

**Performance:**
- Analytics queries are simple aggregations (fast)
- Pagination limits data transfer
- No real-time updates (page refresh acceptable)
- Index on frequently filtered columns already exists

**Code Organization:**
- Follow existing patterns (server/client component split)
- Group related components in subdirectories
- API routes mirror UI structure
- Extract reusable forms into components

---

## Success Criteria

1. Admin can view system analytics at a glance
2. Admin can search/filter users and adjust their wallet balance
3. Admin can suspend/activate user accounts
4. Admin can create, edit, delete platforms/categories/services
5. Admin can view user order history
6. All admin actions are authenticated and authorized
7. Foreign key constraints prevent orphaned data
8. UI is consistent with existing admin pages (orders)
9. All forms have proper validation
10. Error messages are user-friendly

---

## Future Enhancements (Out of Scope)

- Charts/graphs for analytics (Phase 8)
- Role management (change user roles)
- User impersonation for support
- Email notifications for admin actions
- Audit log viewer
- Bulk operations (suspend multiple users)
- Export data to CSV
- Settings/configuration management
- Advanced filters (date ranges, complex queries)
