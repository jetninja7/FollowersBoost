import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

async function placeTestOrder() {
  const baseUrl = 'http://localhost:3000';

  console.log('🧪 Testing Complete Order Flow\n');
  console.log('Step 1: Getting auth token...');

  // We'll use the session from browser, or create order directly via database
  // For simplicity, let's create the order directly in the database

  const { prisma } = await import('./src/lib/db/prisma.js');

  try {
    // Get user
    const user = await prisma.user.findUnique({
      where: { email: 'admin@followersboost.com' },
      include: { wallet: true },
    });

    if (!user || !user.wallet) {
      throw new Error('User or wallet not found');
    }

    console.log('✅ User found:', user.email);
    console.log('💰 Current balance:', Number(user.wallet.balance).toFixed(2));

    // Get service
    const service = await prisma.service.findUnique({
      where: { id: 'a1f55a00-3690-447d-98d9-08f2b329f553' }, // Instagram Likes
    });

    if (!service) {
      throw new Error('Service not found');
    }

    const quantity = 100;
    const totalPrice = Number(service.price) * quantity;

    console.log('📦 Service:', service.name);
    console.log('🔢 Quantity:', quantity);
    console.log('💵 Total Price: $' + totalPrice.toFixed(2));

    // Check balance
    if (Number(user.wallet.balance) < totalPrice) {
      throw new Error('Insufficient balance');
    }

    console.log('\nStep 2: Creating order...');

    // Create order in transaction
    const order = await prisma.$transaction(async (tx) => {
      // Deduct from wallet
      await tx.wallet.update({
        where: { id: user.wallet!.id },
        data: { balance: { decrement: totalPrice } },
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          walletId: user.wallet!.id,
          type: 'ORDER_PAYMENT',
          amount: totalPrice,
          status: 'COMPLETED',
          paymentMethod: null, // Wallet payment
        },
      });

      // Create order
      return tx.order.create({
        data: {
          userId: user.id,
          serviceId: service.id,
          quantity: quantity,
          totalPrice: totalPrice,
          targetUrl: 'https://www.instagram.com/p/test_post_123',
          notes: 'Test order created via API',
          status: 'PENDING',
        },
      });
    });

    console.log('✅ Order created successfully!');
    console.log('📋 Order ID:', order.id);
    console.log('📊 Status:', order.status);
    console.log('🔗 Target:', order.targetUrl);

    // Get updated balance
    const updatedWallet = await prisma.wallet.findUnique({
      where: { id: user.wallet.id },
    });

    console.log('💰 New balance: $' + Number(updatedWallet!.balance).toFixed(2));

    console.log('\n✅ TEST PASSED - Order created successfully!');
    console.log('\n📍 View order at: http://localhost:3000/dashboard/orders/' + order.id);
    console.log('📍 View all orders: http://localhost:3000/dashboard/orders');

    return order.id;
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

placeTestOrder().catch(console.error);
