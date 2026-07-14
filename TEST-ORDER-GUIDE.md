# 🧪 Test Order Guide

## Quick Start: Place a Test Order

### Option 1: Via Browser (Recommended) 👆

**Step 1: Login**
- Go to: http://localhost:3000
- Click "Sign In"
- Email: `admin@followersboost.com`
- Password: `Admin123!`

**Step 2: Add Wallet Funds**
- Click "Wallet" in sidebar
- Click "Add Funds"
- Amount: `$50.00`
- Use Stripe test card:
  - Card: `4242 4242 4242 4242`
  - Expiry: `12/26`
  - CVC: `123`
- Submit payment
- ✅ **Email sent!** Check xsreeramx@gmail.com

**Step 3: Browse Services**
- Click "Services" in sidebar
- Or go to: http://localhost:3000/dashboard/services/instagram

**Step 4: Select Service**
- Click any service (e.g., "Instagram Followers")
- View service details

**Step 5: Place Order**
- Target URL: `https://instagram.com/testuser`
- Quantity: `1000`
- Click "Continue"
- Select "Wallet" payment
- Click "Place Order"
- ✅ **Email sent!** Order confirmation

**Step 6: Track Order**
- Go to "Orders" page
- See order status updates
- Status flow: PENDING → PROCESSING → IN_PROGRESS → COMPLETED
- ✅ **Emails sent** at each stage!

---

### Option 2: Via API Script 🤖

Run the automated test:

```bash
chmod +x quick-test-order.sh
./quick-test-order.sh
```

This will:
1. Login as admin
2. Check wallet balance
3. Get Instagram service
4. Create test order
5. Show order ID

---

## 📧 Emails You'll Receive

During the test, you should receive these emails at **xsreeramx@gmail.com**:

### 1. Wallet Deposit Email 💰
- **When:** After adding funds via Stripe
- **Subject:** "Wallet Credited - $50.00 Added"
- **Content:**
  - Amount added
  - Payment method
  - New balance
  - View Wallet button

### 2. Order Confirmation Email ✉️
- **When:** Immediately after placing order
- **Subject:** "Order Confirmed - #a7b3c9d2"
- **Content:**
  - Order details
  - Service name
  - Target URL
  - Estimated delivery
  - View Order button

### 3. Order In Progress Email 🚀
- **When:** Order starts processing (after ~1 min)
- **Subject:** "Delivery Started - #a7b3c9d2"
- **Content:**
  - Progress bar
  - Current count / Total
  - Track Progress button

### 4. Order Completed Email ✅
- **When:** Order finishes
- **Subject:** "Order Completed - #a7b3c9d2"
- **Content:**
  - Success message
  - Delivered quantity
  - Browse More Services button

---

## 🎯 What to Check

### In Gmail (xsreeramx@gmail.com):
- [ ] Emails arrive within 1-2 minutes
- [ ] Subject lines are correct
- [ ] FollowersBoost branding visible
- [ ] All buttons work
- [ ] Content is readable and formatted
- [ ] No broken images (logo is text-based)

### In App (http://localhost:3000):
- [ ] Wallet balance updates correctly
- [ ] Order appears in Orders page
- [ ] Order status progresses automatically
- [ ] In-app notifications appear
- [ ] Order details show all info

---

## 🐛 Troubleshooting

### "Insufficient balance"
- Make sure you added funds first
- Check wallet balance is > $0

### "Service not found"
- Database needs seeding
- Run: `npx prisma db seed`

### "Email not received"
- Check spam/junk folder
- Remember: Only sends to xsreeramx@gmail.com (testing mode)
- Check Resend dashboard: https://resend.com/emails

### "Payment failed"
- Use test card: 4242 4242 4242 4242
- Any future expiry date
- Any 3-digit CVC

---

## 🔄 Order Status Flow

```
PENDING (0-1 min)
    ↓
PROCESSING (1-5 min) ← Auto-transition via cron
    ↓
[Provider submitted] ← If provider configured
    ↓
IN_PROGRESS (5-30 min) ← Shows progress
    ↓
COMPLETED ← Final state
```

**Emails sent at:** PENDING, IN_PROGRESS, COMPLETED

---

## 📊 Current Test Mode Limitations

✅ **Working:**
- Wallet deposits
- Order creation
- Email sending
- Status transitions
- In-app notifications

⚠️ **Test Mode:**
- Emails only to xsreeramx@gmail.com
- No real social media delivery (test mode)
- Provider auto-fulfillment (if configured)

🚀 **Production Ready:**
- All systems functional
- Just needs domain verification for email
- Ready to connect real SMM providers

---

## 🎬 Quick Test Commands

**Check wallet:**
```bash
curl http://localhost:3000/api/wallet -b cookies.txt
```

**List services:**
```bash
curl http://localhost:3000/api/services
```

**View orders:**
```bash
curl http://localhost:3000/api/orders -b cookies.txt
```

---

## ✅ Success Checklist

After completing the test:
- [ ] Wallet deposit email received
- [ ] Order confirmation email received
- [ ] Order visible in dashboard
- [ ] Wallet balance deducted
- [ ] Order status progressing
- [ ] All emails look professional
- [ ] Buttons in emails work

---

**Ready to test?** Start with Option 1 (Browser)! 🚀
