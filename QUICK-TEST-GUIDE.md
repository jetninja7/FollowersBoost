# 🚀 Quick Test Guide - Place Your First Order

## ✅ You're Ready!
- ✅ Dev server running at http://localhost:3000
- ✅ Wallet has **$2000** balance
- ✅ Database has 14 active services
- ✅ Email system configured

---

## 🎯 Option 1: Direct Order Link (Fastest!)

### Click this link to go straight to order form:
```
http://localhost:3000/dashboard/order/1a2a97cf-d457-4119-89a4-28fc3d46fe2a
```

**Service:** Instagram Followers - Starter

**Fill in the form:**
1. **Link**: `https://www.instagram.com/test_account`
2. **Quantity**: `1000`
3. Click **"Place Order"**

Done! 🎉

---

## 🎯 Option 2: Browse from Dashboard

### Step 1: Open Dashboard
```
http://localhost:3000/dashboard
```

### Step 2: Login (if needed)
- Email: `admin@followersboost.com`
- Password: `Admin123!`

### Step 3: Look for Services
Scroll down on the dashboard - you should see a "Services" section with service cards.

**If you see services:**
- Click "Order Now" on any service card

**If you DON'T see services:**
- That's the issue we need to fix!
- Let me know and I'll debug it

---

## 🎯 Option 3: Browse All Services

### Go to Services Page
```
http://localhost:3000/dashboard/services
```

This shows all platforms.

### Pick a Platform
```
http://localhost:3000/dashboard/services/instagram
```

This shows all Instagram services.

### Click "Order Now" on any service

---

## 📝 What Happens After Placing Order?

### Immediate:
1. You're redirected to: `http://localhost:3000/dashboard/orders?success=true`
2. Order shows with status: **PENDING**
3. Wallet balance decreased

### After 1 minute (automatic):
- Cron job runs
- Order status → **PROCESSING**
- Provider receives order

### After 2-5 minutes:
- Order status → **IN_PROGRESS**  
- Delivery begins

### After 10-15 minutes:
- Order status → **COMPLETED**
- You get completion email

---

## ⚡ Speed Up Testing (Manual Cron)

Don't want to wait? Trigger processing manually:

```bash
# Run this in terminal:
curl http://localhost:3000/api/cron/process-orders
```

Run this command 2-3 times (30 seconds apart) to move order through all stages quickly.

---

## 🔍 Track Your Order

### View All Orders:
```
http://localhost:3000/dashboard/orders
```

### View Wallet:
```
http://localhost:3000/dashboard/wallet
```

### Admin Panel (see everything):
```
http://localhost:3000/admin/orders
```

---

## 🐛 Troubleshooting

### "Service not found" error:
Run this to verify services exist:
```bash
psql "postgresql://postgres:postgres@localhost:5432/followersboost" -c "SELECT COUNT(*) FROM \"Service\" WHERE \"isActive\" = true;"
```

Should show: `14`

### "Insufficient balance" error:
Check balance:
```bash
psql "postgresql://postgres:postgres@localhost:5432/followersboost" -c "SELECT u.email, w.balance FROM \"User\" u JOIN \"Wallet\" w ON w.\"userId\" = u.id WHERE u.email = 'admin@followersboost.com';"
```

Should show: `2000.00` or more

### Dashboard not loading:
1. Check dev server is running
2. Check terminal for errors
3. Try refreshing page

### Services not showing on dashboard:
This might be a rendering issue. Try:
1. Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+F5` (Windows)
2. Or use direct order link (Option 1 above)

---

## 📊 Check Everything Works

Run this script to verify your setup:

```bash
# Check services
echo "=== Services ===" 
psql "postgresql://postgres:postgres@localhost:5432/followersboost" -c "SELECT COUNT(*) as total_services FROM \"Service\" WHERE \"isActive\" = true;"

# Check wallet
echo -e "\n=== Wallet Balance ==="
psql "postgresql://postgres:postgres@localhost:5432/followersboost" -c "SELECT u.email, w.balance::numeric(10,2) FROM \"User\" u JOIN \"Wallet\" w ON w.\"userId\" = u.id WHERE u.email = 'admin@followersboost.com';"

# Check providers
echo -e "\n=== Providers ==="
psql "postgresql://postgres:postgres@localhost:5432/followersboost" -c "SELECT name, type, \"isActive\", \"healthStatus\" FROM \"Provider\";"

echo -e "\n✅ Setup complete!"
echo "Direct order link: http://localhost:3000/dashboard/order/1a2a97cf-d457-4119-89a4-28fc3d46fe2a"
```

---

## 💡 Tips

- **Multiple Orders**: You have $2000, place several orders!
- **Different Platforms**: Try Instagram, TikTok, YouTube services
- **Watch Processing**: Keep orders page open and refresh to see status changes
- **Check Emails**: Look for emails at each stage (if configured)
- **Admin Panel**: Great for seeing the full picture

---

## 🆘 Still Having Issues?

Tell me exactly what you see:

1. **Can you access the dashboard?** `http://localhost:3000/dashboard`
2. **Do you see the stats cards at the top?** (Total Orders, Balance, etc.)
3. **Do you see the green "My Orders" and "Add Funds" buttons?**
4. **Do you see the platform filter buttons?** (All, Instagram, YouTube, etc.)
5. **Do you see any services listed below?**
6. **Are there any errors in your browser console?** (Press F12 → Console tab)

Screenshot or describe what you see, and I'll fix it! 📸

---

## 🎉 Success Looks Like:

1. ✅ Dashboard loads with your stats
2. ✅ Services appear (either on dashboard or services page)
3. ✅ You can click "Order Now"
4. ✅ Order form appears with all fields
5. ✅ After submitting, you see your order in orders list
6. ✅ Wallet balance decreased
7. ✅ Order status changes over time

Ready to test! 🚀
