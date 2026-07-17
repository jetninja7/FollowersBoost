import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local first, then .env
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

import { prisma } from './src/lib/db/prisma.js';

async function addTestFunds() {
  const email = process.argv[2] || 'admin@followersboost.com';
  const amount = parseFloat(process.argv[3] || '1000');

  console.log(`💰 Adding $${amount} to ${email}...`);

  try {
    // Find user's wallet
    const wallet = await prisma.wallet.findFirst({
      where: {
        user: {
          email: email,
        },
      },
      include: {
        user: true,
      },
    });

    if (!wallet) {
      console.error('❌ Wallet not found for user:', email);
      process.exit(1);
    }

    const oldBalance = Number(wallet.balance);

    // Update wallet balance
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: {
          increment: amount,
        },
      },
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'DEPOSIT',
        amount: amount,
        status: 'COMPLETED',
        paymentMethod: 'TEST',
        metadata: {
          note: 'Test funds added via script',
        },
      },
    });

    const newBalance = oldBalance + amount;

    console.log('✅ Funds added successfully!');
    console.log(`📊 Old balance: $${oldBalance.toFixed(2)}`);
    console.log(`📊 New balance: $${newBalance.toFixed(2)}`);
    console.log(`\n🎯 Now you can place orders!`);
    console.log(`   Go to: http://localhost:3000/dashboard`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addTestFunds();
