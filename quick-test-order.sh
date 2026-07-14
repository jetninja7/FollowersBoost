#!/bin/bash

# Quick Test Order Script
# This will create a test order via API

echo "🧪 Testing Order Flow..."
echo ""

# 1. Login to get session cookie
echo "1️⃣ Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@followersboost.com",
    "password": "Admin123!",
    "redirect": "false"
  }' \
  -c /tmp/cookies.txt)

echo "   ✅ Logged in"
echo ""

# 2. Get wallet balance
echo "2️⃣ Checking wallet balance..."
WALLET=$(curl -s http://localhost:3000/api/wallet \
  -b /tmp/cookies.txt)

echo "   Balance: $(echo $WALLET | grep -o '"balance":"[^"]*"' | cut -d'"' -f4)"
echo ""

# 3. Get a service ID
echo "3️⃣ Getting Instagram service..."
SERVICES=$(curl -s "http://localhost:3000/api/services?platform=instagram" \
  -b /tmp/cookies.txt)

SERVICE_ID=$(echo $SERVICES | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
SERVICE_NAME=$(echo $SERVICES | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)

echo "   Service: $SERVICE_NAME"
echo "   ID: $SERVICE_ID"
echo ""

# 4. Create order
echo "4️⃣ Creating test order..."
ORDER=$(curl -s -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -b /tmp/cookies.txt \
  -d "{
    \"serviceId\": \"$SERVICE_ID\",
    \"quantity\": 1000,
    \"targetUrl\": \"https://instagram.com/testuser\",
    \"notes\": \"Test order from script\",
    \"paymentMethod\": \"WALLET\"
  }")

ORDER_ID=$(echo $ORDER | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -n "$ORDER_ID" ]; then
  echo "   ✅ Order created!"
  echo "   Order ID: $ORDER_ID"
  echo ""
  echo "🎉 Success! Check your email at xsreeramx@gmail.com"
  echo ""
  echo "📋 View order: http://localhost:3000/dashboard/orders/$ORDER_ID"
else
  echo "   ❌ Failed to create order"
  echo "   Response: $ORDER"
fi

# Cleanup
rm -f /tmp/cookies.txt
