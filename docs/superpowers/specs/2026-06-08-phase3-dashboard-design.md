# Phase 3: Dashboard & Service Management - Design Specification

**Date:** 2026-06-08  
**Project:** FollowersBoost  
**Phase:** Phase 3 (Dashboard & Service Management)  
**Prerequisites:** Phase 1 (Foundation), Phase 2 (Landing Page) completed

---

## Executive Summary

Phase 3 transforms FollowersBoost from a marketing site into a fully functional SaaS platform by building the authenticated user experience. Users will be able to browse services, place orders, track progress in real-time, manage their wallet, and configure their account settings.

**Scope:** This phase is divided into three incremental sub-phases:
- **Phase 3A:** Services & Browsing - Service marketplace and discovery
- **Phase 3B:** Orders & Wallet - Transaction flow and payment management
- **Phase 3C:** Profile & Polish - Account management and UX refinement

**Goal:** Enable users to complete the full customer journey from browsing services to purchasing and tracking orders.

---

## System Architecture

### Route Structure

```
Public Routes (existing):
  /                         → Landing page
  /login                    → Login page
  /signup                   → Signup page

Protected Routes (new):
  /dashboard                → Dashboard home (overview)
  /dashboard/services       → Service marketplace (platform grid)
  /dashboard/services/:platform → Platform detail page
  /dashboard/services/:platform/:category → Category services
  /dashboard/service/:slug  → Individual service detail
  /dashboard/checkout/:serviceId → Multi-step checkout flow
  /dashboard/orders         → Order history & tracking
  /dashboard/orders/:id     → Order detail page
  /dashboard/wallet         → Wallet & transaction history
  /dashboard/profile        → User profile & settings
  /dashboard/notifications  → Notifications center
```

### Layout Pattern

All dashboard routes use a consistent layout:

```
┌─────────────────────────────────────────────┐
│  Header (existing - with Dashboard link)    │
├──────────┬──────────────────────────────────┤
│          │                                  │
│ Sidebar  │  Main Content Area               │
│          │                                  │
│ • Home   │  (Route-specific content)        │
│ • Browse │                                  │
│ • Orders │                                  │
│ • Wallet │                                  │
│ • Profile│                                  │
│          │                                  │
└──────────┴──────────────────────────────────┘
```

**Responsive behavior:**
- Desktop (lg+): Sidebar visible, ~240px wide
- Tablet (md): Collapsible sidebar
- Mobile (sm): Bottom navigation bar or hamburger menu

### Component Hierarchy

```
DashboardLayout (new)
├── DashboardSidebar
│   ├── Navigation links with icons
│   └── Active state indicators
└── DashboardContent (slot for page content)

Reused Components:
- Header (from Phase 2)
- Footer (from Phase 2)
- Button, Card, Input, etc. (shadcn/ui)
```

---

## Phase 3A: Services & Browsing

**Objective:** Allow users to discover and explore available services across all platforms.

### 3A.1 Dashboard Home Page

**Route:** `/dashboard`

**Purpose:** Welcome users, provide overview of account status, and offer quick access to key actions.

**Layout Sections:**

1. **Welcome Banner**
   - Greeting: "Welcome back, [User Name]!"
   - Personalized based on time of day (optional)

2. **Quick Stats Grid** (4 cards, 2x2 on desktop, stacked on mobile)
   - **Wallet Balance Card:**
     - Large balance number
     - Currency indicator (USD)
     - "Add Funds" button (primary action)
   - **Active Orders Card:**
     - Count of orders with status IN_PROGRESS or PROCESSING
     - "View All" link → `/dashboard/orders?status=active`
   - **Completed Orders Card:**
     - Total count of COMPLETED orders
     - Lifetime metric
   - **Total Spent Card:**
     - Sum of all order payments
     - Lifetime metric

3. **Quick Actions Section**
   - Two prominent buttons:
     - "Browse Services" → `/dashboard/services`
     - "View All Orders" → `/dashboard/orders`

4. **Popular Services** (Optional for 3A)
   - Horizontal scroll of 4-6 service cards
   - Shows most frequently ordered services
   - Each card is clickable → `/dashboard/service/:slug`

5. **Recent Activity Feed**
   - List of last 5 orders
   - Shows: Service name, status badge, created date
   - "View all orders" link at bottom

**Data Requirements:**
- Fetch user's wallet balance
- Count orders by status
- Calculate total spent
- Query recent orders (limit 5, order by createdAt DESC)

**API Endpoints:**
- `GET /api/dashboard/stats` - Returns all dashboard metrics
- `GET /api/dashboard/recent-activity` - Returns recent orders

### 3A.2 Service Marketplace

**Route:** `/dashboard/services`

**Purpose:** Entry point for service discovery, showing all platforms.

**Design:**

Reuses the visual pattern from Phase 2 landing page (`ServicesGrid` component):

- **Search Bar** (top of page):
  - Prominent search input
  - Placeholder: "Search services..."
  - Live autocomplete dropdown as user types
  - Searches across: service names, descriptions, platforms, categories
  - Results grouped by platform

- **Platform Grid:**
  - 10 platform cards in responsive grid
  - Layout: 1 col (mobile), 2 cols (sm), 3 cols (md), 4 cols (lg), 5 cols (xl)
  - Each card shows:
    - Platform icon (from lucide-react)
    - Platform name
    - Service count badge (e.g., "12 services")
    - Hover effect: shadow + scale
  - Click card → Navigate to `/dashboard/services/:platform`

- **Optional Filter Sidebar** (can be hidden on mobile):
  - Price range slider (min $0 - max $500)
  - Delivery time checkboxes (< 24h, 1-3 days, 3-7 days)
  - "Reset Filters" button

**Data Requirements:**
- Fetch all active platforms with service counts
- Search endpoint for autocomplete

**API Endpoints:**
- `GET /api/platforms` - Returns all active platforms with service counts
- `GET /api/services/search?q=:query` - Search services

### 3A.3 Platform Detail Page

**Route:** `/dashboard/services/:platform`

**Purpose:** Show all service categories for a specific platform.

**Design:**

1. **Platform Header:**
   - Large platform icon
   - Platform name (e.g., "Instagram")
   - Tagline/description
   - Total services count

2. **Category Tabs:**
   - Horizontal tabs component (shadcn/ui Tabs)
   - One tab per category (e.g., Followers, Likes, Views, Comments)
   - Active tab highlighted
   - Mobile: Scrollable horizontal tabs

3. **Service Grid** (for selected category):
   - Responsive grid of service cards
   - Layout: 1 col (mobile), 2 cols (md), 3 cols (lg)
   - Each service card shows:
     - Service name
     - Price per unit (e.g., "$0.05 per follower")
     - Min/Max quantity range
     - Estimated delivery time
     - "View Details" button
   - Hover effect: border highlight

**Service Card Component:**
```
┌──────────────────────────────────┐
│ Instagram Followers - Basic      │
│                                  │
│ $0.05 per follower              │
│ Min: 100  Max: 100,000          │
│ ⏱ Delivery: 24-48 hours         │
│                                  │
│ [View Details →]                │
└──────────────────────────────────┘
```

**Data Requirements:**
- Fetch platform by slug
- Fetch all categories for platform
- Fetch services for each category
- Filter only active services

**API Endpoints:**
- `GET /api/platforms/:slug` - Returns platform with categories
- `GET /api/services?categoryId=:id` - Returns services for category

### 3A.4 Service Detail Page

**Route:** `/dashboard/service/:slug`

**Purpose:** Show comprehensive information about a specific service.

**Design:**

1. **Service Header:**
   - Service name (large heading)
   - Platform badge (e.g., "Instagram")
   - Category badge (e.g., "Followers")
   - Status badge (Active)

2. **Pricing Section:**
   - Large price display: "$0.05 per follower"
   - Quantity range: "Min: 100 - Max: 100,000"
   - **Interactive Calculator:**
     - Quantity input (with +/- buttons)
     - Live total calculation: "Total: $XX.XX"
     - Validation: Must be within min/max range

3. **Description Section:**
   - Full service description
   - Features list (bullet points)
   - Benefits explanation

4. **Delivery Information:**
   - Estimated delivery time (e.g., "24-48 hours")
   - Fulfillment method badge (Manual/API)

5. **How It Works:**
   - Step-by-step explanation
   - 3-4 numbered steps with icons

6. **Call-to-Action:**
   - **For Phase 3A:** Button labeled "Order Now" (disabled or "Coming Soon")
     - Tooltip: "Checkout flow coming in Phase 3B"
   - **For Phase 3B+:** Fully functional button → `/dashboard/checkout/:serviceId`

**Data Requirements:**
- Fetch service by slug
- Include related platform and category data

**API Endpoints:**
- `GET /api/services/:slug` - Returns full service details

### 3A.5 Search Functionality

**Global Search:**

- Search bar in dashboard header (always accessible)
- Dropdown appears below input as user types (debounced, 300ms)
- Minimum 2 characters to trigger search

**Search Results Dropdown:**
- Grouped by platform
- Each result shows:
  - Service name
  - Platform name
  - Category name
  - Price
- Click result → Navigate to service detail page
- "View all results" link at bottom → Full search results page

**Search Results Page** (optional):
- `/dashboard/services/search?q=:query`
- Full-page search results with filters
- Pagination

**API Endpoints:**
- `GET /api/services/search?q=:query&limit=10` - Autocomplete search
- `GET /api/services/search?q=:query&page=1` - Full search results

---

## Phase 3B: Orders & Wallet

**Objective:** Enable users to purchase services, track orders in real-time, and manage wallet funds.

### 3B.1 Multi-Step Checkout Flow

**Route:** `/dashboard/checkout/:serviceId`

**Purpose:** Guide users through order configuration, review, and payment in three clear steps.

**Authentication & Access:**
- Protected route (requires login)
- If service doesn't exist or is inactive → Redirect to services page

**Progress Indicator:**
- Visual stepper at top: Step 1 → Step 2 → Step 3
- Shows current step, completed steps (checkmark), and upcoming steps

---

#### Step 1: Configure Order

**Layout:**

1. **Service Summary Card** (sidebar on desktop, top on mobile):
   - Service name
   - Platform + category badges
   - Price per unit
   - Non-editable, for reference

2. **Configuration Form:**

   **Quantity Selector:**
   - Label: "How many do you want?"
   - Number input with stepper buttons (+/-)
   - Validation:
     - Must be integer
     - Must be >= service.minQuantity
     - Must be <= service.maxQuantity
   - Error message if out of range
   
   **Live Price Calculation:**
   - Shows: "Subtotal: $XX.XX" (quantity × price)
   - Updates in real-time as quantity changes

   **Target URL Input:**
   - Label: "Where should we deliver?" (context-specific: "Instagram profile URL", "YouTube video URL", etc.)
   - Text input (URL validation)
   - Help text: "Enter the full URL to your profile/post/video"
   - Validation:
     - Must be valid URL format
     - Must start with http:// or https://
   - Error message if invalid

   **Notes (Optional):**
   - Label: "Special instructions (optional)"
   - Textarea (max 500 characters)
   - Placeholder: "Any specific requirements?"

3. **Action Buttons:**
   - "Cancel" (secondary, outline) → Returns to service detail page
   - "Continue to Review" (primary) → Validates and moves to Step 2

**Validation:**
- All required fields must be filled
- Quantity must be valid
- URL must be valid format
- If invalid, show inline error messages

**Data Storage:**
- Store form state in React state (local)
- No API call yet

---

#### Step 2: Review & Confirm

**Layout:**

1. **Order Summary Card:**
   - Service details
   - Quantity
   - Target URL (truncated if long)
   - Unit price
   - **Total price** (large, bold)
   - Estimated delivery time
   - Order notes (if provided)

2. **Wallet Balance Check:**
   - Shows: "Your current balance: $XX.XX"
   - **If sufficient balance:**
     - Green checkmark icon
     - Message: "✓ Sufficient funds available"
   - **If insufficient balance:**
     - Warning icon (amber/yellow)
     - Message: "⚠ You need $XX.XX more to complete this order"
     - "Add Funds" button (prominent) → Opens payment modal

3. **Terms & Conditions:**
   - Checkbox: "I agree to the terms of service"
   - Link to terms (opens in new tab)
   - Required to proceed

4. **Action Buttons:**
   - "Back" (secondary) → Returns to Step 1 (preserves data)
   - "Confirm & Pay" (primary) → Proceeds to Step 3
     - Disabled if insufficient balance or terms not accepted

**Validation:**
- Must have sufficient wallet balance
- Terms checkbox must be checked

**Data Requirements:**
- Fetch user's current wallet balance
- Real-time check (in case balance changed since page load)

**API Endpoints:**
- `GET /api/wallet/balance` - Returns current balance

---

#### Step 3: Payment & Order Creation

**Two Paths:**

**Path A: Sufficient Balance**
- Immediately create order
- Deduct from wallet balance
- Create transaction record (ORDER_PAYMENT)
- Show success screen

**Path B: Insufficient Balance**

**Inline Payment Modal:**

1. **Amount Section:**
   - Label: "Amount to add"
   - Pre-filled: Minimum needed (order total - current balance)
   - User can increase amount
   - Suggestion buttons: Add $10 extra, $25 extra, $50 extra

2. **Payment Method Tabs:**
   - Tab 1: Credit/Debit Card (Stripe)
   - Tab 2: PayPal

3. **Stripe Payment Form:**
   - Card number input (Stripe Element)
   - Expiry date input
   - CVC input
   - Cardholder name input
   - Billing zip code (optional)
   - "Add Funds" button

4. **PayPal Payment:**
   - PayPal button (PayPal SDK)
   - Click → Opens PayPal popup
   - On success → Funds added to wallet

5. **Payment Flow:**
   - On "Add Funds" click:
     - Validate payment details
     - Call `/api/wallet/add-funds`
     - Create Transaction (PENDING)
     - Process payment via Stripe/PayPal
     - On success:
       - Update transaction to COMPLETED
       - Add funds to wallet
       - Close modal
       - Show success toast: "Funds added successfully!"
       - Auto-continue to order creation
   - On failure:
     - Show error message
     - Allow retry

**Order Creation:**
- Call `POST /api/orders`
- Payload: serviceId, quantity, targetUrl, notes
- Backend:
  - Validates service exists and is active
  - Checks wallet balance (atomic transaction)
  - Deducts funds from wallet
  - Creates order record (status: PENDING)
  - Creates transaction record (ORDER_PAYMENT, COMPLETED)
  - Returns order object

**Success Screen:**
- Celebration animation (confetti or checkmark)
- Message: "Order placed successfully! 🎉"
- Order ID displayed
- Order summary card
- Action buttons:
  - "View Order Details" (primary) → `/dashboard/orders/:id`
  - "Browse More Services" (secondary) → `/dashboard/services`

**Error Handling:**
- If payment fails: Show error, allow retry
- If order creation fails: Refund wallet automatically, show error
- Network errors: Show retry button

**API Endpoints:**
- `POST /api/wallet/add-funds` - Adds funds to wallet
- `POST /api/orders` - Creates new order

---

### 3B.2 Order Management

**Route:** `/dashboard/orders`

**Purpose:** View all orders, filter by status, and access order details.

**Design:**

1. **Page Header:**
   - Title: "My Orders"
   - "New Order" button → `/dashboard/services`

2. **Filters Section:**
   - **Status Filter:** Dropdown
     - Options: All, Pending, Processing, In Progress, Completed, Cancelled, Failed
     - Default: All
   - **Date Range:** Date picker (from - to)
   - **Platform Filter:** Multi-select dropdown (optional)
   - "Clear Filters" button

3. **Order List:**
   - **View Mode Toggle:** Grid / List view
   - **Default: List view** (better for orders)

**Order Card (List Item):**
```
┌──────────────────────────────────────────────────────┐
│ Instagram Followers - Basic                    [●●●] │
│ https://instagram.com/profile...                     │
│                                                       │
│ Quantity: 1,000 followers    |    Paid: $50.00      │
│ Status: [🟡 In Progress]     |    Created: 2h ago    │
│                                                       │
│ Progress: [████████████░░░░░░░░] 60% (600/1,000)    │
│                                                       │
│ [View Details →]                                     │
└──────────────────────────────────────────────────────┘
```

**Status Badge Colors:**
- PENDING: Gray
- PROCESSING: Blue
- IN_PROGRESS: Yellow/Amber
- COMPLETED: Green
- CANCELLED: Red (outline)
- FAILED: Red (solid)

**Progress Bar:**
- Only shown for IN_PROGRESS orders
- Shows: current count / target quantity
- Percentage indicator

4. **Pagination:**
   - 20 orders per page
   - "Load More" button or page numbers

5. **Empty State:**
   - Illustration (optional)
   - Message: "No orders yet"
   - Subtext: "Start by browsing our services"
   - "Browse Services" button

**Data Requirements:**
- Fetch orders for current user
- Apply filters (status, date range, platform)
- Include related service data
- Order by: createdAt DESC

**API Endpoints:**
- `GET /api/orders?status=:status&from=:date&to=:date&page=:page` - Returns filtered orders

---

### 3B.3 Order Detail Page

**Route:** `/dashboard/orders/:id`

**Purpose:** Show comprehensive order information and live tracking.

**Authentication:**
- User can only view their own orders
- If order not found or unauthorized → 404

**Design:**

1. **Order Header:**
   - Order ID (with copy button)
   - Created date & time
   - Large status badge (prominent)

2. **Progress Timeline** (visual stepper):
   ```
   ✓ Order Placed    ✓ Processing    ● In Progress    ○ Completed
   ```
   - Completed steps: Green checkmark
   - Current step: Filled circle
   - Future steps: Empty circle
   - Line connecting steps

3. **Order Details Card:**
   - **Service Information:**
     - Service name + platform badge
     - Category badge
     - Price per unit
   - **Order Information:**
     - Target URL (clickable link, opens in new tab)
     - Quantity ordered
     - Total paid
     - Payment method (Wallet)
     - Estimated delivery time
   - **Customer Notes:**
     - Shows notes if provided
     - Hidden if no notes

4. **Live Progress Section** (for IN_PROGRESS orders only):
   - **Current Status:**
     - "Delivery in progress..."
     - Start count: Initial follower count (if tracked)
     - Current count: Live follower count
     - Target count: Ordered quantity
   - **Progress Visualization:**
     - Large progress bar
     - Percentage: (current - start) / (target - start) × 100%
     - Numbers: "600 / 1,000 delivered"
   - **Last Updated:**
     - "Last updated: 2 minutes ago"
     - Auto-updates every 30 seconds via polling

5. **Action Buttons:**
   - "Contact Support" (secondary) → Opens support modal or email
   - "Cancel Order" (danger, outline) → Only available if status allows (PENDING or PROCESSING)
     - Shows confirmation modal
     - If cancelled: Refunds to wallet

6. **Related Orders** (optional):
   - "You may also like" section
   - Shows 3 similar services

**Real-time Updates:**

- Use `setInterval` to poll every 30 seconds
- Fetch updated order data from `/api/orders/:id`
- Compare new data with current state
- If changed:
  - Update UI (status, counts, progress)
  - Show toast notification: "Order status updated!"
- Stop polling when order reaches terminal state (COMPLETED, CANCELLED, FAILED)

**Cancel Order Flow:**
- Confirmation modal: "Are you sure you want to cancel?"
- Warning: "This action cannot be undone"
- If confirmed:
  - Call `POST /api/orders/:id/cancel`
  - Backend:
    - Check if order can be cancelled (status PENDING or PROCESSING)
    - Update order status to CANCELLED
    - Refund to wallet
    - Create refund transaction
  - Show success toast
  - Update UI

**API Endpoints:**
- `GET /api/orders/:id` - Returns order details
- `POST /api/orders/:id/cancel` - Cancels order

---

### 3B.4 Wallet Management

**Route:** `/dashboard/wallet`

**Purpose:** Manage wallet balance, add funds, and view transaction history.

**Design:**

1. **Balance Section:**
   
   **Balance Card** (prominent, top of page):
   - Large balance display: "$123.45"
   - Currency label: "USD"
   - Icon: Wallet icon
   - "Add Funds" button (primary, large)

2. **Quick Stats Row:**
   - **Total Deposited:** Sum of all DEPOSIT transactions
   - **Total Spent:** Sum of all ORDER_PAYMENT transactions
   - **Total Refunded:** Sum of all REFUND transactions

3. **Quick Actions:**
   - "Add Funds" button (duplicate for convenience)
   - "Withdraw Funds" button (disabled, "Coming Soon" tooltip)

4. **Transaction History:**

   **Filters:**
   - Type: All, Deposits, Payments, Refunds
   - Date range picker
   - "Clear Filters" button

   **Transaction List:**
   
   **Transaction Item:**
   ```
   ┌────────────────────────────────────────────────────┐
   │ [↓] Deposit via Stripe                    +$50.00 │
   │ Jan 15, 2026 at 10:30 AM                   [✓]    │
   │ Payment ID: pi_xxxxxxxxxxxxx                       │
   └────────────────────────────────────────────────────┘
   ```

   **Fields:**
   - Icon: ↓ (deposit), ↑ (payment/withdraw), ↻ (refund)
   - Type + method (e.g., "Deposit via Stripe", "Order Payment", "Refund for Order #1234")
   - Amount:
     - Green + prefix for deposits/refunds (+ $50.00)
     - Red - prefix for payments (- $25.00)
   - Date & time
   - Status badge (Pending/Completed/Failed)
   - Payment/transaction ID (truncated, with copy button)
   - Click row → Expand to show more details (metadata)

   **Pagination:**
   - 20 transactions per page
   - "Load More" button

5. **Empty State:**
   - If no transactions: "No transactions yet"
   - "Add funds to get started" message
   - "Add Funds" button

**Data Requirements:**
- Fetch wallet balance
- Calculate transaction totals
- Fetch transaction history with filters
- Order by: createdAt DESC

**API Endpoints:**
- `GET /api/wallet` - Returns wallet with balance and stats
- `GET /api/wallet/transactions?type=:type&from=:date&to=:date&page=:page` - Returns transactions

---

### 3B.5 Add Funds Flow

**Trigger:** Click "Add Funds" button (from wallet page, checkout, or header)

**Modal Design:**

1. **Header:**
   - Title: "Add Funds to Wallet"
   - Close button (X)

2. **Amount Selection:**
   
   **Predefined Amounts:**
   - Quick select buttons: $10, $25, $50, $100
   - Highlight selected amount
   
   **Custom Amount:**
   - Input field: "Or enter custom amount"
   - Validation: Min $1, max $10,000
   - Currency prefix: $

3. **Payment Method Tabs:**

   **Tab 1: Credit/Debit Card (Stripe)**
   - Stripe Elements integration:
     - Card number input (Stripe CardElement)
     - Expiry date input
     - CVC input
   - Cardholder name input
   - Billing zip code (optional)
   - Save card checkbox (future feature, disabled for now)
   - "Add Funds" button

   **Tab 2: PayPal**
   - PayPal logo
   - Description: "You'll be redirected to PayPal to complete payment"
   - "Pay with PayPal" button (PayPal SDK)

4. **Payment Processing:**

   **Stripe Flow:**
   - On "Add Funds" click:
     - Validate form (amount, card details)
     - Show loading state on button
     - Call `POST /api/wallet/add-funds`
       - Backend creates PaymentIntent via Stripe API
       - Returns clientSecret
     - Confirm payment with Stripe (client-side)
     - On success:
       - Create Transaction (COMPLETED)
       - Add funds to wallet
       - Show success message
       - Close modal
       - Refresh wallet balance
     - On error:
       - Show error message
       - Allow retry

   **PayPal Flow:**
   - On button click:
     - Call `POST /api/wallet/create-paypal-order`
       - Backend creates PayPal order
       - Returns order ID
     - Open PayPal popup (PayPal SDK)
     - User completes payment in PayPal
     - On success:
       - PayPal webhook notifies backend
       - Backend captures payment
       - Create Transaction (COMPLETED)
       - Add funds to wallet
     - Frontend polls for transaction status
     - On success:
       - Show success message
       - Close modal
       - Refresh balance

5. **Success Message:**
   - Toast notification: "Successfully added $XX.XX to your wallet!"
   - If triggered from checkout: Auto-continue to order creation

6. **Error Handling:**
   - Payment declined: "Payment was declined. Please try another card."
   - Network error: "Connection error. Please try again."
   - Invalid card: "Invalid card details. Please check and try again."
   - All errors show in modal, allow retry without closing

**API Endpoints:**
- `POST /api/wallet/add-funds` - Creates Stripe PaymentIntent
- `POST /api/wallet/create-paypal-order` - Creates PayPal order
- `POST /api/webhooks/stripe` - Stripe webhook for payment confirmation
- `POST /api/webhooks/paypal` - PayPal webhook for payment confirmation

**Security:**
- Never store card details
- Use Stripe Elements (PCI compliant)
- PayPal handles all payment data
- Server-side validation of amounts
- CSRF protection on API endpoints

---

## Phase 3C: Profile & Polish

**Objective:** Provide comprehensive account management, notifications, and UX polish for production readiness.

### 3C.1 User Profile & Settings

**Route:** `/dashboard/profile`

**Purpose:** Allow users to manage personal information, security, notifications, and preferences.

**Layout: Tab-based Interface**

Use shadcn/ui Tabs component with 5 tabs:

---

#### Tab 1: Personal Information

**Content:**

1. **Profile Section:**
   - Avatar display:
     - Circle with user initials (first letter of first + last name)
     - Colored background (generated from user ID hash)
     - No upload functionality yet (Phase 4+)
   - Display name
   - Email address
   - Account role badge (USER, MODERATOR, ADMIN)
   - Member since date (read-only)

2. **Edit Form:**
   - **Name Field:**
     - Label: "Full Name"
     - Input (text)
     - Validation: Required, 2-50 characters
   - **Email Field:**
     - Label: "Email Address"
     - Input (email)
     - Validation: Required, valid email format
     - Warning: "Changing email requires verification"
   - **Save Changes** button (primary)
   - Shows success/error message after save

**Behavior:**
- If email changed:
  - Send verification email to new address
  - Keep old email active until new one verified
  - Show banner: "Verification email sent. Check your inbox."
- If name changed:
  - Update immediately
  - Show toast: "Profile updated successfully"

**API Endpoints:**
- `GET /api/user/profile` - Returns user profile
- `PUT /api/user/profile` - Updates profile

---

#### Tab 2: Security

**Content:**

1. **Change Password Section:**
   - **Current Password:**
     - Input (password)
     - Validation: Required
   - **New Password:**
     - Input (password)
     - Validation: Min 8 chars, must include uppercase, lowercase, number, special char
     - Password strength indicator (weak/medium/strong)
   - **Confirm New Password:**
     - Input (password)
     - Validation: Must match new password
   - **Update Password** button
   - Success message: "Password updated successfully"

2. **Two-Factor Authentication (2FA):**
   - **Status Badge:**
     - If enabled: Green badge "Enabled"
     - If disabled: Gray badge "Disabled"
   - **Enable 2FA Flow:**
     - Toggle switch or "Enable" button
     - On enable:
       - Generate TOTP secret
       - Show QR code (user scans with authenticator app)
       - Show manual entry code (alternative)
       - Verification step: Enter code from app to confirm setup
       - Generate backup codes (10 codes)
       - Show backup codes with "Download" and "Copy" buttons
       - Warning: "Save these codes in a secure place"
     - After setup:
       - Show: "2FA enabled ✓"
       - "Regenerate Backup Codes" button
       - "Disable 2FA" button
   - **Disable 2FA Flow:**
     - Confirmation modal: "Are you sure?"
     - Requires password confirmation
     - Warning: "Your account will be less secure"
     - If confirmed: Disable 2FA, show toast

3. **Active Sessions** (Future - Phase 4+):
   - Shows list of logged-in devices
   - Ability to log out other sessions
   - For now: "Coming Soon" placeholder

**API Endpoints:**
- `PUT /api/user/password` - Updates password
- `POST /api/user/2fa/enable` - Initiates 2FA setup
- `POST /api/user/2fa/verify` - Verifies 2FA setup
- `POST /api/user/2fa/disable` - Disables 2FA
- `POST /api/user/2fa/backup-codes` - Regenerates backup codes

---

#### Tab 3: Notifications

**Content:**

1. **Email Notifications:**
   - Section header: "Email Notifications"
   - Description: "Receive notifications via email"
   - **Toggle options:**
     - ☑ Order status updates
     - ☑ Payment confirmations
     - ☑ Low wallet balance alerts
     - ☑ Promotional emails and offers
     - ☑ Weekly summary report
     - ☑ Security alerts
   - Each has toggle switch (on/off)

2. **In-App Notifications:**
   - Section header: "In-App Notifications"
   - Description: "Show notifications in the app"
   - **Toggle options:**
     - ☑ Order updates
     - ☑ Payment confirmations
     - ☑ Low wallet balance alerts (< $10)
     - ☑ System announcements
     - ☑ New features
   - Each has toggle switch (on/off)

3. **Notification Frequency:**
   - Dropdown: "How often should we email you?"
   - Options:
     - Real-time (as they happen)
     - Daily digest
     - Weekly digest
     - Never (only in-app)

4. **Actions:**
   - "Save Preferences" button (primary)
   - Success message: "Notification preferences updated"

**Default Settings:**
- All order/payment notifications: ON
- Promotional emails: OFF
- Weekly summary: ON

**API Endpoints:**
- `GET /api/user/notification-preferences` - Returns preferences
- `PUT /api/user/notification-preferences` - Updates preferences

---

#### Tab 4: Preferences

**Content:**

1. **Display Settings:**
   - **Theme:**
     - Radio buttons: Light / Dark / System
     - Preview of selected theme (optional)
     - Default: System
   - **Language:**
     - Dropdown: English (only option for now)
     - Note: "More languages coming soon"
   - **Timezone:**
     - Dropdown with all timezones
     - Auto-detect current timezone (default)
     - Used for date/time display

2. **Dashboard Preferences:**
   - **Default view for services:**
     - Radio buttons: Grid / List
     - Default: Grid
   - **Orders per page:**
     - Dropdown: 10 / 20 / 50
     - Default: 20

3. **Actions:**
   - "Save Preferences" button (primary)
   - Success message: "Preferences saved"

**API Endpoints:**
- `GET /api/user/preferences` - Returns preferences
- `PUT /api/user/preferences` - Updates preferences

---

#### Tab 5: Account Management

**Content:**

**Danger Zone Section** (red border, warning background):

1. **Export Data:**
   - Section title: "Export Your Data"
   - Description: "Download all your account data including orders, transactions, and profile information"
   - Button: "Request Data Export" (secondary)
   - On click:
     - Shows: "Your data export has been requested. You'll receive an email with a download link within 24 hours."
     - Backend queues export job
     - Generates JSON file with all user data
     - Sends email with secure download link (expires in 7 days)

2. **Delete Account:**
   - Section title: "Delete Account"
   - Description: "Permanently delete your account and all associated data. This action cannot be undone."
   - Warning badge: "⚠ This action is permanent"
   - Button: "Delete Account" (danger, outline)
   - On click: Opens **deletion confirmation modal**

**Delete Account Modal:**

1. **Warning header:**
   - Icon: Exclamation triangle
   - Title: "Delete Your Account?"
   - Subtitle: "This will permanently delete your account"

2. **What will be deleted:**
   - Bullet list:
     - ☑ Your profile and personal information
     - ☑ Order history
     - ☑ Transaction records
     - ☑ Wallet balance (forfeited)
     - ☑ Saved preferences

3. **Confirmation steps:**
   - **Step 1:** Enter password
     - Input (password)
     - Validation: Must match current password
   - **Step 2:** Type "DELETE" to confirm
     - Input (text)
     - Validation: Must exactly match "DELETE" (case-sensitive)
     - Placeholder: "Type DELETE"
   
4. **Final warning:**
   - Checkbox: "I understand this action cannot be undone"
   - Must be checked to enable delete button

5. **Action buttons:**
   - "Cancel" (secondary) - Close modal
   - "Delete My Account" (danger) - Proceeds with deletion
     - Disabled until all confirmations complete

**Deletion Flow:**
- On confirm:
  - Call `POST /api/user/delete-account`
  - Backend:
    - Validates password
    - Marks account for deletion (soft delete initially)
    - Sends confirmation email
    - Queues deletion job (executes after 30 days grace period)
    - Logs out user immediately
  - Frontend:
    - Clear session
    - Redirect to homepage with message: "Your account has been scheduled for deletion. You have 30 days to change your mind. Check your email for details."
  - User can cancel deletion within 30 days via email link

**API Endpoints:**
- `POST /api/user/export-data` - Requests data export
- `POST /api/user/delete-account` - Initiates account deletion

---

### 3C.2 Notification System

**Purpose:** Keep users informed about order updates, payments, and system events.

#### In-App Notifications

**Notification Bell (Header):**

- Icon: Bell icon (lucide-react)
- Position: Top right of header, next to profile menu
- Badge: Red circle with unread count (if > 0)
- Click behavior: Toggle dropdown

**Notification Dropdown:**

- Width: ~360px
- Max height: 400px, scrollable
- Position: Dropdown below bell icon

**Dropdown Content:**

1. **Header:**
   - Title: "Notifications"
   - "Mark all as read" button (text button)

2. **Notification List:**
   - Shows last 5 notifications
   - Each notification item:
     - Icon based on type (order, payment, system)
     - Title (bold if unread)
     - Message text (truncated)
     - Relative timestamp ("2 minutes ago", "1 hour ago")
     - Unread indicator (blue dot)
   - Click notification:
     - Marks as read
     - Navigates to related page (order detail, wallet, etc.)
     - Closes dropdown

3. **Footer:**
   - "View All Notifications" link → `/dashboard/notifications`

**Empty State:**
- Icon: Bell with slash
- Message: "No notifications yet"
- Subtext: "We'll notify you when something happens"

**Notification Types & Icons:**

- **ORDER_UPDATE:** Package icon
  - Example: "Your order #1234 is now in progress"
  - Link: `/dashboard/orders/:id`

- **PAYMENT_SUCCESS:** Check circle icon
  - Example: "Successfully added $50 to your wallet"
  - Link: `/dashboard/wallet`

- **PAYMENT_FAILED:** X circle icon
  - Example: "Payment failed. Please try again"
  - Link: `/dashboard/wallet`

- **SYSTEM_ALERT:** Info icon
  - Example: "Scheduled maintenance on Sunday, 2 AM - 4 AM"
  - No link (or link to announcement page)

#### Notifications Page

**Route:** `/dashboard/notifications`

**Purpose:** Show all notifications with filtering and search.

**Design:**

1. **Page Header:**
   - Title: "Notifications"
   - "Mark all as read" button

2. **Filters:**
   - Tabs: All / Unread
   - Type filter: Dropdown (All, Orders, Payments, System)

3. **Notification List:**
   - Full list of notifications (not just 5)
   - Same card design as dropdown, but larger
   - Pagination: 20 per page

4. **Actions:**
   - Click notification → Mark as read + navigate
   - Delete button per notification (trash icon)

**Real-time Updates:**

- Poll for new notifications every 30 seconds
- When new notification arrives:
  - Update bell badge count
  - Show toast: "[Notification title]"
  - Play subtle sound (optional, based on user preference)

**API Endpoints:**
- `GET /api/notifications?unread=:bool&type=:type&page=:page` - Returns notifications
- `PUT /api/notifications/:id/read` - Marks notification as read
- `PUT /api/notifications/read-all` - Marks all as read
- `DELETE /api/notifications/:id` - Deletes notification

---

### 3C.3 Polish & UX Improvements

**Objective:** Ensure production-ready experience with proper loading states, error handling, and accessibility.

#### Loading States

1. **Skeleton Screens:**
   - Use for all data-fetching pages
   - Dashboard: Skeleton cards for stats
   - Services: Skeleton grid for platform cards
   - Orders: Skeleton list for order cards
   - Profile: Skeleton for form fields
   - Better UX than blank page or spinner

2. **Button Loading States:**
   - On submit: Show spinner inside button + "Processing..." text
   - Disable button during processing
   - Examples:
     - "Sign in" → "Signing in..."
     - "Add Funds" → "Processing..."
     - "Place Order" → "Creating order..."

3. **Page Transitions:**
   - Use Next.js loading.tsx for route transitions
   - Show top progress bar (nprogress or similar)

#### Error Handling

1. **Toast Notifications:**
   - Use Sonner (already in dependencies)
   - Success: Green with checkmark
   - Error: Red with X
   - Info: Blue with info icon
   - Warning: Yellow with exclamation
   - Auto-dismiss after 5 seconds
   - Action button (optional): "Retry", "View Details"

2. **Inline Validation:**
   - Form fields: Show error message below field
   - Red border on invalid field
   - Green border on valid field (optional)
   - Error message appears immediately on blur
   - Clears when user starts fixing

3. **Error Pages:**
   - **404 Page:**
     - Friendly message: "Page not found"
     - Subtext: "The page you're looking for doesn't exist"
     - "Go to Dashboard" button
   - **500 Page:**
     - Message: "Something went wrong"
     - Subtext: "We're working on fixing this"
     - "Try Again" button
     - "Contact Support" link
   - **Unauthorized (403):**
     - Message: "Access Denied"
     - Subtext: "You don't have permission to view this page"
     - "Go Back" button

4. **API Error Handling:**
   - Network error: "Connection lost. Please check your internet."
   - 401 Unauthorized: Redirect to login
   - 403 Forbidden: Show forbidden page
   - 404 Not Found: Show not found state
   - 500 Server Error: Show error toast with retry option
   - Timeout: "Request timed out. Please try again."

#### Empty States

1. **No Orders:**
   - Illustration (optional - can use lucide-react icon)
   - Message: "No orders yet"
   - Subtext: "Browse our services to place your first order"
   - "Browse Services" button (primary)

2. **No Transactions:**
   - Icon: Wallet
   - Message: "No transactions yet"
   - Subtext: "Add funds to start using FollowersBoost"
   - "Add Funds" button

3. **No Notifications:**
   - Icon: Bell
   - Message: "You're all caught up!"
   - Subtext: "No new notifications"

4. **No Search Results:**
   - Icon: Search
   - Message: "No services found"
   - Subtext: "Try different keywords"
   - "Clear Search" button

5. **No Filter Results:**
   - Message: "No orders match your filters"
   - "Clear Filters" button

#### Responsive Design

1. **Breakpoints:**
   - Mobile: < 640px
   - Tablet: 640px - 1024px
   - Desktop: > 1024px

2. **Dashboard Layout:**
   - **Desktop:** Sidebar visible (240px wide)
   - **Tablet:** Collapsible sidebar (hamburger menu)
   - **Mobile:** Bottom navigation bar or hamburger menu
     - Bottom nav icons: Home, Services, Orders, Wallet, Profile
     - Always visible, sticks to bottom

3. **Tables → Cards:**
   - Transaction tables become cards on mobile
   - Order tables become cards on mobile
   - Each card shows key info, expandable for details

4. **Forms:**
   - Stack vertically on mobile
   - Full-width inputs
   - Larger tap targets (min 44px)

5. **Modals:**
   - Full-screen on mobile
   - Centered overlay on desktop
   - Close button always visible

#### Accessibility (a11y)

1. **Keyboard Navigation:**
   - All interactive elements focusable via Tab
   - Visible focus indicators (ring-2 ring-blue-500)
   - Modal traps focus (can't tab outside)
   - Escape key closes modals/dropdowns

2. **ARIA Labels:**
   - All buttons have aria-label if icon-only
   - Form inputs have associated labels
   - Status badges have aria-label (e.g., "Status: In Progress")
   - Navigation landmarks (nav, main, aside)

3. **Screen Readers:**
   - Alt text for all images/icons
   - Loading states announced ("Loading orders...")
   - Error messages announced (aria-live="polite")
   - Success messages announced

4. **Color Contrast:**
   - All text meets WCAG AA standards
   - Don't rely solely on color for status (use icons + text)

5. **Focus Management:**
   - On modal open: Focus first input
   - On modal close: Return focus to trigger button
   - On error: Focus first invalid field

#### Performance Optimizations

1. **Code Splitting:**
   - Lazy load dashboard routes
   - Lazy load heavy components (charts, modals)
   - Use Next.js dynamic imports

2. **Data Fetching:**
   - Use React Query for caching
   - Stale-while-revalidate strategy
   - Cache service data (rarely changes)
   - Prefetch on hover (services, orders)

3. **Images:**
   - Use Next.js Image component
   - Lazy load images
   - WebP format with PNG/JPG fallback
   - Proper sizing (no huge images)

4. **Search:**
   - Debounce search input (300ms)
   - Cancel previous requests
   - Show "Searching..." state

5. **Polling:**
   - Only poll when page visible (Page Visibility API)
   - Stop polling after 10 minutes inactive
   - Increase interval if no changes (backoff)

---

## Technical Implementation Details

### Authentication & Authorization

**Route Protection:**

All `/dashboard/*` routes require authentication:

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*']
}
```

**Role-based Access:**
- USER: Can access all dashboard features
- MODERATOR: + Can view all orders (Phase 4+)
- ADMIN: + Can access admin panel (Phase 7+)

### API Routes

**Naming Convention:**
- `/api/[resource]` - Collection endpoints (GET list, POST create)
- `/api/[resource]/[id]` - Single resource endpoints (GET, PUT, DELETE)
- `/api/[resource]/[id]/[action]` - Action endpoints (POST)

**Authentication:**
- All `/api/*` routes check session
- Use `requireAuth()` helper from Phase 1
- Return 401 if not authenticated

**Error Responses:**
```typescript
{
  error: {
    code: "INSUFFICIENT_BALANCE",
    message: "You don't have enough funds",
    details: { required: 50.00, available: 25.00 }
  }
}
```

**Success Responses:**
```typescript
{
  data: { /* resource */ },
  meta: { /* pagination, etc. */ }
}
```

### Database Queries

**Optimization:**
- Use Prisma's `select` to fetch only needed fields
- Use `include` for relations
- Add indexes on frequently queried fields (already in schema)
- Paginate all list queries

**Example - Fetch Orders:**
```typescript
const orders = await prisma.order.findMany({
  where: {
    userId: session.user.id,
    status: { in: statuses },
  },
  include: {
    // Include service data (name, platform)
  },
  orderBy: { createdAt: 'desc' },
  take: 20,
  skip: (page - 1) * 20,
})
```

### State Management

**Approach:** React Context + React Query

- **AuthContext:** User session (already exists)
- **WalletContext:** Wallet balance (shared across pages)
- **React Query:** API data fetching/caching

**Example - Wallet Balance:**
```typescript
const { data: wallet } = useQuery({
  queryKey: ['wallet'],
  queryFn: fetchWalletBalance,
  staleTime: 30000, // 30 seconds
})
```

### Real-time Updates

**Polling Strategy:**

```typescript
const { data: order } = useQuery({
  queryKey: ['order', orderId],
  queryFn: () => fetchOrder(orderId),
  refetchInterval: order?.status === 'IN_PROGRESS' ? 30000 : false,
  refetchIntervalInBackground: false, // Stop when tab hidden
})
```

**Stop Conditions:**
- Order reaches terminal state (COMPLETED, CANCELLED, FAILED)
- User navigates away from page
- Tab becomes hidden
- 10 minutes of inactivity

### Payment Integration

**Stripe:**
- Use Stripe Elements for card input
- Client-side: Confirm PaymentIntent
- Server-side: Create PaymentIntent, handle webhooks
- Store payment method for future use (optional)

**PayPal:**
- Use PayPal JavaScript SDK
- Client-side: Render PayPal button
- Server-side: Create Order, Capture Payment, handle webhooks

**Webhook Handling:**
- Verify webhook signatures
- Idempotent processing (check transaction ID)
- Update wallet balance atomically
- Send email confirmation

### Testing Strategy (Phase 3C)

**Unit Tests:**
- API route handlers
- Utility functions
- Form validation schemas

**Integration Tests:**
- Checkout flow (end-to-end)
- Payment processing (mocked Stripe/PayPal)
- Order creation

**E2E Tests (Playwright):**
- User can browse services
- User can place order
- User can add funds
- User can view order details

---

## Data Flow Examples

### Example 1: Service Purchase Flow

```
1. User clicks "View Details" on service card
   → Navigate to /dashboard/service/instagram-followers-basic

2. User clicks "Order Now"
   → Navigate to /dashboard/checkout/:serviceId
   
3. Step 1: Configure Order
   → User enters quantity (1000) and target URL
   → Frontend validates input
   → Click "Continue"
   
4. Step 2: Review & Confirm
   → Fetch wallet balance: GET /api/wallet/balance
   → Check if balance >= order total
   → If insufficient: Show "Add Funds" button
   → If sufficient: Show "Confirm & Pay"
   → Click "Confirm & Pay"
   
5. Step 3: Create Order
   → POST /api/orders
   → Backend:
     - Validate service exists and active
     - Begin transaction
     - Check wallet balance (with lock)
     - Deduct funds from wallet
     - Create order (status: PENDING)
     - Create transaction (ORDER_PAYMENT, COMPLETED)
     - Commit transaction
     - Return order
   → Frontend:
     - Show success screen
     - Redirect to /dashboard/orders/:id
```

### Example 2: Real-time Order Tracking

```
1. User opens order detail page
   → Navigate to /dashboard/orders/:id
   
2. Fetch initial order data
   → GET /api/orders/:id
   → Display: status, progress, details
   
3. If status === 'IN_PROGRESS':
   → Start polling (every 30 seconds)
   → Loop:
     - Fetch updated data: GET /api/orders/:id
     - Compare with previous data
     - If changed:
       - Update UI (status, counts, progress bar)
       - Show toast: "Order updated!"
     - If status becomes 'COMPLETED':
       - Stop polling
       - Show completion animation
   
4. Backend (simulated progress):
   → Background job (cron or manual):
     - Fetch IN_PROGRESS orders
     - Update currentCount (increment gradually)
     - When currentCount >= quantity:
       - Set status = COMPLETED
       - Set completedAt = now()
```

### Example 3: Add Funds with Stripe

```
1. User clicks "Add Funds" (from wallet or checkout)
   → Open modal
   
2. User selects amount ($50)
   → Fill in card details (Stripe Element)
   → Click "Add Funds"
   
3. Frontend:
   → Call POST /api/wallet/add-funds
     - Payload: { amount: 50, paymentMethod: 'stripe' }
   
4. Backend:
   → Create Stripe PaymentIntent:
     - amount: 5000 (cents)
     - currency: 'usd'
     - metadata: { userId, walletId }
   → Return clientSecret
   
5. Frontend:
   → Confirm payment with Stripe:
     - stripe.confirmCardPayment(clientSecret, { card element })
   → On success:
     - Payment is processing
     - Create Transaction (PENDING)
     - Show loading state
   
6. Stripe webhook: payment_intent.succeeded
   → POST /api/webhooks/stripe
   → Backend:
     - Verify signature
     - Find transaction by PaymentIntent ID
     - Update transaction to COMPLETED
     - Add funds to wallet (atomic)
     - Send email confirmation
   
7. Frontend (polling or websocket):
   → Detect transaction completed
   → Close modal
   → Show toast: "Funds added!"
   → Refresh wallet balance
```

---

## Component Library & Reusability

### New Shared Components (to be built)

**Layout Components:**
- `DashboardLayout` - Sidebar + main content wrapper
- `DashboardSidebar` - Navigation sidebar with active states
- `PageHeader` - Consistent page header with title + actions
- `EmptyState` - Generic empty state with icon, message, CTA

**Data Display:**
- `StatCard` - Dashboard stat card (value + label + icon)
- `ServiceCard` - Service card (reusable across pages)
- `OrderCard` - Order card with status badge + progress
- `TransactionItem` - Transaction list item
- `NotificationItem` - Notification list item

**Forms & Inputs:**
- `QuantitySelector` - Number input with +/- buttons
- `PriceCalculator` - Quantity × price with live update
- `UrlInput` - Input with URL validation
- `StatusBadge` - Status badge with color coding

**Modals & Overlays:**
- `ConfirmationModal` - Generic confirmation dialog
- `PaymentModal` - Add funds modal (Stripe + PayPal)
- `CheckoutStepper` - Multi-step progress indicator

**Feedback:**
- `ProgressBar` - Progress bar with percentage
- `SkeletonCard` - Loading skeleton for cards
- `SkeletonList` - Loading skeleton for lists

### shadcn/ui Components to Install

Already installed (Phase 1 & 2):
- Button, Card, Input, Label, Separator, Sheet, Accordion

New for Phase 3:
- `Tabs` - For profile page, platform categories
- `Select` - For dropdowns (filters, preferences)
- `RadioGroup` - For radio button groups (theme, view mode)
- `Switch` - For toggle switches (notifications)
- `Progress` - For progress bars (order tracking)
- `Dialog` - For modals (confirmations, payments)
- `Badge` - For status badges
- `Avatar` - For user avatars
- `DropdownMenu` - For notification dropdown
- `Toast` / `Sonner` - For toast notifications (Sonner already in deps)
- `Skeleton` - For loading states
- `Calendar` - For date pickers (filters)
- `Table` - For transaction history (optional)

---

## Phase Breakdown Summary

### Phase 3A: Services & Browsing (Est. 10-12 tasks)

**Deliverables:**
1. Dashboard layout with sidebar
2. Dashboard home page with stats
3. Service marketplace (platform grid)
4. Platform detail pages
5. Service detail pages
6. Global search functionality

**User Value:**
- Users can browse all available services
- Users can search for specific services
- Users see their account overview

**Does NOT include:**
- Order creation (checkout disabled)
- Wallet management
- Order tracking

---

### Phase 3B: Orders & Wallet (Est. 12-15 tasks)

**Deliverables:**
1. Multi-step checkout flow (3 steps)
2. Order creation API
3. Order management page
4. Order detail page with real-time tracking
5. Wallet management page
6. Add funds flow (Stripe + PayPal)
7. Transaction history
8. Payment webhook handlers

**User Value:**
- Users can purchase services
- Users can track orders in real-time
- Users can add funds to wallet
- Users can view transaction history

**Requires Phase 3A:**
- Service detail pages provide link to checkout
- Checkout flow references services

---

### Phase 3C: Profile & Polish (Est. 8-10 tasks)

**Deliverables:**
1. User profile page (5 tabs)
2. Edit personal information
3. Change password
4. Two-factor authentication
5. Notification preferences
6. Display preferences
7. Account deletion flow
8. In-app notification system
9. Notifications page
10. Loading states, error handling, empty states
11. Responsive design refinements
12. Accessibility improvements

**User Value:**
- Users can manage account settings
- Users receive notifications
- Users can secure account with 2FA
- Users can delete account
- Better UX with proper feedback

**Builds on 3A + 3B:**
- Complete feature set
- Production-ready polish

---

## Success Criteria

### Phase 3A Success Criteria:
- ✅ User can log in and see dashboard home
- ✅ User can view wallet balance and stats
- ✅ User can browse all 10 platforms
- ✅ User can view services by platform/category
- ✅ User can view service details
- ✅ User can search for services
- ✅ "Order Now" button shows "Coming Soon"

### Phase 3B Success Criteria:
- ✅ User can complete checkout flow
- ✅ User can place order with sufficient balance
- ✅ User can add funds via Stripe
- ✅ User can add funds via PayPal
- ✅ User can view all orders with filters
- ✅ User can view order details
- ✅ Order tracking updates in real-time
- ✅ User can view wallet and transactions
- ✅ Payments are processed correctly
- ✅ Webhooks update wallet balance

### Phase 3C Success Criteria:
- ✅ User can edit profile
- ✅ User can change password
- ✅ User can enable/disable 2FA
- ✅ User can configure notification preferences
- ✅ User can set display preferences
- ✅ User can request data export
- ✅ User can delete account
- ✅ User receives in-app notifications
- ✅ User can view notification history
- ✅ All pages have proper loading states
- ✅ All errors show user-friendly messages
- ✅ All pages responsive on mobile
- ✅ Keyboard navigation works
- ✅ Screen readers can navigate

---

## Technical Constraints & Considerations

### Known Limitations:

1. **No Websockets:**
   - Real-time updates use polling (30s interval)
   - Acceptable for order tracking
   - May want WebSockets in Phase 4+ for instant updates

2. **No File Uploads:**
   - Profile avatar not implemented yet
   - Service images are icons only
   - File upload in Phase 4+

3. **Single Currency:**
   - Only USD supported
   - Multi-currency in future phases

4. **Email Verification:**
   - Placeholder only in Phase 1
   - Full email verification in Phase 4+

5. **2FA:**
   - TOTP only (authenticator apps)
   - SMS 2FA not included

### Security Considerations:

1. **CSRF Protection:**
   - All POST/PUT/DELETE API routes must verify CSRF token
   - Next.js handles this via headers

2. **Rate Limiting:**
   - Add rate limiting to API routes (especially payment endpoints)
   - Use middleware or API gateway

3. **Input Validation:**
   - Server-side validation for all inputs
   - Use Zod schemas (consistent with Phase 1)

4. **SQL Injection:**
   - Prisma prevents SQL injection (parameterized queries)
   - Never use raw SQL with user input

5. **XSS:**
   - React escapes by default
   - Be careful with dangerouslySetInnerHTML (don't use)

6. **Payment Security:**
   - Never store card details
   - Use Stripe Elements (PCI compliant)
   - Verify webhook signatures

### Performance Considerations:

1. **Database:**
   - Indexes already in schema (Phase 1)
   - Monitor slow queries
   - Consider caching frequently accessed data

2. **API Response Times:**
   - Target: < 200ms for most endpoints
   - Use database connection pooling

3. **Frontend Bundle Size:**
   - Code split dashboard routes
   - Lazy load heavy components
   - Target: < 200KB initial JS bundle

4. **Images:**
   - Use Next.js Image component
   - Optimize all images
   - Use appropriate formats (WebP)

---

## Deployment Strategy

### Phase 3A Deployment:
- Deploy after completing all browsing features
- Enable feature flag for Phase 3A routes
- "Order Now" buttons show "Coming Soon"
- No breaking changes to existing features

### Phase 3B Deployment:
- Deploy after payment integration tested
- Enable checkout flow
- Test with small transaction first
- Monitor for payment errors

### Phase 3C Deployment:
- Deploy profile features gradually
- Enable 2FA after thorough testing
- Monitor notification system
- Gather user feedback on UX polish

### Rollback Plan:
- Each phase can be rolled back independently
- Feature flags control visibility
- Database migrations are reversible

---

## Design Document Conclusion

This design provides a comprehensive blueprint for Phase 3, divided into three manageable sub-phases. Each sub-phase delivers tangible user value and can be deployed independently.

**Next Steps:**
1. Review and approve this design
2. Create detailed implementation plans for each sub-phase
3. Begin development with Phase 3A

**Estimated Timeline:**
- Phase 3A: 1-2 weeks
- Phase 3B: 2-3 weeks
- Phase 3C: 1-2 weeks
- **Total: 4-7 weeks**

This incremental approach allows for:
- Early user feedback
- Reduced risk
- Manageable scope
- Flexibility to adjust based on learnings

---

**End of Design Document**
