# 🧪 How to Place a Test Order - Complete Guide

This guide walks you through placing a **real test order** in your FollowersBoost dashboard.

---

## 📋 Prerequisites

1. **Dev server running**: `npm run dev`
2. **Database seeded**: Already done (you have seed data)
3. **Admin account**: `admin@followersboost.com` / `Admin123!`

---

## 🚀 Method 1: Through the Dashboard UI (Recommended)

### Step 1: Login
1. Go to http://localhost:3000/login
2. Login with:
   - Email: `admin@followersboost.com`
   - Password: `Admin123!`

### Step 2: Add Funds to Wallet
Before placing an order, you need money in your wallet!

**Option A: Using Mock PayPal (Easiest)**
1. Go to http://localhost:3000/dashboard/wallet
2. Click "Add Funds"
3. Enter amount: `100` (USD)
4. Select PayPal
5. Complete the mock payment

**Option B: Direct Database Credit (Fastest)**
```bash
# Run this in your terminal:
npx tsx -e "
import { prisma } from './src/lib/db/prisma.js';
const wallet = await prisma.wallet.findFirst({ 
  where: { user: { email: 'admin@followersboost.com' } } 
});
await prisma.wallet.update({ 
  where: { id: wallet.id }, 
  data: { balance: { increment: 1000 } } 
});
console.log('✅ Added $1000 to wallet');
await prisma.\$disconnect();
"
```

**Option C: SQL Direct (Advanced)**
```sql
-- Connect to your database and run:
UPDATE "Wallet" 
SET balance = balance + 1000 
WHERE "userId" = (
  SELECT id FROM "User" WHERE email = 'admin@followersboost.com'
);
```

### Step 3: Browse Services
1. Go to http://localhost:3000/dashboard
2. You'll see the new dashboard with:
   - Your stats (Orders, Balance, Spent)
   - Quick action buttons
   - Platform filters
   - Featured services

### Step 4: Select a Service
**Option A: From Dashboard**
- Scroll down to "Services" section
- Click "Order Now" on any service card

**Option B: From Services Page**
- Click "Services" in the sidebar
- Pick a platform (e.g., Instagram)
- Browse all services
- Click "Order Now"

### Step 5: Fill Out Order Form
You'll see a page with these fields:

1. **Category** (Auto-filled with selected service category)
2. **Services** (Auto-filled with selected service)
3. **Description** (Shows service features)
4. **Link** - Enter your target URL:
   ```
   https://www.instagram.com/your_username
   ```
   Or any test URL like:
   ```
   https://www.instagram.com/test_account_123
   ```

5. **Quantity** - Enter amount:
   - Example: `1000` (followers)
   - Must be between min and max (shown below field)

6. **Charge** - Auto-calculated based on quantity
   - Shows your current balance
   - Warns if insufficient funds

### Step 6: Submit Order
1. Click **"Place Order"** button (blue, bottom of form)
2. Wait for processing (should be instant)
3. You'll be redirected to orders page with success message

### Step 7: Track Your Order
1. Go to http://localhost:3000/dashboard/orders
2. You'll see your order with status: **PENDING**

**Order Status Flow:**
```
PENDING (initial)
   ↓ (after 1 minute via cron)
PROCESSING (submitted to provider)
   ↓ (when fulfillment starts)
IN_PROGRESS (being delivered)
   ↓ (when complete)
COMPLETED (success!)
```

---

## 🤖 Method 2: Via API Script (For Developers)

Create a test script:

```bash
# Create test script
cat > test-order.ts << 'EOF'
import 'dotenv/config';

async function placeTestOrder() {
  // Step 1: Login
  const loginResponse = await fetch('http://localhost:3000/api/auth/callback/credentials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@followersboost.com',
      password: 'Admin123!',
    }),
  });

  if (!loginResponse.ok) {
    throw new Error('Login failed');
  }

  const cookies = loginResponse.headers.get('set-cookie');
  console.log('✅ Logged in');

  // Step 2: Get a service ID
  const servicesResponse = await fetch('http://localhost:3000/api/services', {
    headers: { Cookie: cookies || '' },
  });
  const servicesData = await servicesResponse.json();
  const service = servicesData.data[0];
  console.log(`✅ Selected service: ${service.name} (ID: ${service.id})`);

  // Step 3: Place order
  const orderResponse = await fetch('http://localhost:3000/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies || '',
    },
    body: JSON.stringify({
      serviceId: service.id,
      quantity: service.minQuantity,
      targetUrl: 'https://www.instagram.com/test_account',
      paymentMethod: 'WALLET',
    }),
  });

  const orderData = await orderResponse.json();

  if (!orderResponse.ok) {
    console.error('❌ Order failed:', orderData);
    throw new Error(orderData.error?.message || 'Order creation failed');
  }

  console.log('✅ Order created:', orderData.data);
  console.log(`\n🎉 Order ID: ${orderData.data.id}`);
  console.log(`📍 View at: http://localhost:3000/dashboard/orders/${orderData.data.id}`);
}

placeTestOrder().catch(console.error);
EOF

# Run the test
npx tsx test-order.ts
```

---

## 📧 Email Notifications

After placing an order, you should receive emails (if configured):

1. **Order Confirmation** - Immediately after placing order
2. **Order In Progress** - When fulfillment starts
3. **Order Completed** - When delivery finishes

**Note:** Emails only send to `xsreeramx@gmail.com` (testing mode). To send to any email, verify your domain at resend.com/domains.

---

## 🔄 Order Processing Timeline

### Automatic Processing (Via Cron)

The system processes orders automatically every 5 minutes:

```
Minute 0: Order placed (status: PENDING)
Minute 1: Cron job runs → Order moves to PROCESSING
Minute 1: Auto-fulfillment submits to provider
Minute 6: Cron checks provider status → Order moves to IN_PROGRESS
Minute 11: Cron checks again → Order progress updates
[... continues until complete ...]
Final: Order status = COMPLETED
```

### Manual Processing (For Testing)

**Option 1: Trigger Cron Manually**
```bash
curl http://localhost:3000/api/cron/process-orders
```

**Option 2: Update Status via Admin Panel**
1. Go to http://localhost:3000/admin/orders
2. Find your order
3. Click "Update Status"
4. Change status manually

**Option 3: Via Database**
```bash
npx tsx -e "
import { prisma } from './src/lib/db/prisma.js';
import { transitionOrderStatus } from './src/lib/fulfillment/status-machine.js';

// Get first pending order
const order = await prisma.order.findFirst({ 
  where: { status: 'PENDING' } 
});

if (order) {
  // Transition to COMPLETED
  await transitionOrderStatus(order.id, 'COMPLETED', 'Test completion');
  console.log('✅ Order completed:', order.id);
} else {
  console.log('❌ No pending orders found');
}

await prisma.\$disconnect();
"
```

---

## 🧪 Testing Different Scenarios

### Test 1: Insufficient Balance
1. Place order with quantity that exceeds your balance
2. Expected: Error message "Insufficient balance"

### Test 2: Invalid Quantity
1. Enter quantity below minimum or above maximum
2. Expected: Validation error

### Test 3: Invalid URL
1. Enter non-URL text in Link field
2. Expected: Browser validation error

### Test 4: Complete Flow
1. Place order (PENDING)
2. Wait 1 minute or trigger cron
3. Check status (should be PROCESSING or IN_PROGRESS)
4. Check email inbox
5. Wait for completion or manually complete
6. Check final status (COMPLETED)

### Test 5: Refund Flow
1. Place order
2. Go to admin panel: http://localhost:3000/admin/orders
3. Find order, click "Refund"
4. Check wallet balance increased
5. Check order status (REFUNDED)

---

## 🔍 Troubleshooting

### "Service not found"
- Make sure seed data is loaded: `npx prisma db seed`

### "Insufficient balance"
- Add funds using Method 1, Step 2 above

### "Failed to create order"
- Check console logs: `npm run dev` output
- Check database connection

### Order stuck in PENDING
- Manually trigger cron: `curl http://localhost:3000/api/cron/process-orders`
- Or wait 1 minute for auto-processing

### No providers configured
- The system uses Mock Provider by default (auto-configured in seed)
- Check providers: http://localhost:3000/admin/providers

---

## 📊 Monitoring Your Test

### Check Order Status
```bash
# Via API
curl http://localhost:3000/api/orders

# Via Database
npx prisma studio
# Navigate to Order table
```

### Check Wallet Balance
```bash
# Via Dashboard
http://localhost:3000/dashboard/wallet

# Via Database
npx tsx -e "
import { prisma } from './src/lib/db/prisma.js';
const wallet = await prisma.wallet.findFirst({ 
  where: { user: { email: 'admin@followersboost.com' } },
  include: { user: true }
});
console.log('Balance:', Number(wallet.balance));
await prisma.\$disconnect();
"
```

### Check Provider Status
```bash
# Admin panel
http://localhost:3000/admin/providers

# Check if Mock Provider is healthy
```

---

## 🎯 Quick Start (TL;DR)

```bash
# 1. Add $1000 to wallet
npx tsx -e "import {prisma} from './src/lib/db/prisma.js'; const w = await prisma.wallet.findFirst({where:{user:{email:'admin@followersboost.com'}}}); await prisma.wallet.update({where:{id:w.id},data:{balance:{increment:1000}}}); console.log('✅ Done'); await prisma.\$disconnect();"

# 2. Go to dashboard
open http://localhost:3000/dashboard

# 3. Click any "Order Now" button

# 4. Fill form:
# - Link: https://www.instagram.com/test
# - Quantity: 1000

# 5. Click "Place Order"

# 6. View order
open http://localhost:3000/dashboard/orders
```

---

## ✅ Success Indicators

You'll know it worked when:

1. ✅ Order appears in orders list
2. ✅ Wallet balance decreased by order total
3. ✅ Order status shows PENDING (initially)
4. ✅ Email sent (if configured)
5. ✅ Transaction appears in wallet history
6. ✅ After cron: Status changes to PROCESSING/IN_PROGRESS

---

## 🚀 Next Steps

After testing orders:

1. **Test refunds**: Use admin panel to refund orders
2. **Test provider switching**: Add multiple providers
3. **Test order cancellation**: Cancel pending orders
4. **Test bulk orders**: Place many orders at once
5. **Monitor fulfillment**: Watch auto-fulfillment system work

---

## 📝 Notes

- **Mock Provider**: Automatically completes orders after 2-3 cron cycles
- **Email**: Only sends to xsreeramx@gmail.com in testing mode
- **Cron**: Runs every 5 minutes in development (or trigger manually)
- **Balance**: Starts at $0, must add funds before ordering
- **Services**: All seeded services are active and orderable

---

## 🆘 Need Help?

Check these files:
- API logs: Terminal where `npm run dev` is running
- Database: `npx prisma studio`
- Provider health: http://localhost:3000/admin/providers
- Order logs: OrderLog table in Prisma Studio

**Common issues documented in:**
- `docs/phase3b-orders-wallet.md`
- `docs/phase6-fulfillment-automation.md`
- `CLAUDE.md` (troubleshooting section)
