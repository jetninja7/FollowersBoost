/**
 * Email Testing Script
 *
 * Tests all email templates by sending them to a test email address.
 * Run with: npx tsx test-email.ts <your-email@example.com>
 */

// Load environment variables first
import 'dotenv/config';

import {
  sendOrderConfirmationEmail,
  sendOrderInProgressEmail,
  sendOrderCompletedEmail,
  sendOrderFailedEmail,
  sendWalletDepositEmail,
} from './src/lib/email/email-service';

const testEmail = process.argv[2];

if (!testEmail) {
  console.error('Usage: npx tsx test-email.ts <your-email@example.com>');
  process.exit(1);
}

console.log(`🧪 Testing email system...`);
console.log(`📧 Sending test emails to: ${testEmail}\n`);

async function runTests() {
  try {
    // Test 1: Order Confirmation
    console.log('1️⃣  Sending Order Confirmation email...');
    await sendOrderConfirmationEmail({
      to: testEmail,
      orderId: 'test-order-12345678',
      serviceName: 'Instagram Followers',
      platform: 'Instagram',
      quantity: 1000,
      totalPrice: '49.99',
      targetUrl: 'https://instagram.com/testuser',
      estimatedDelivery: '1-3 hours',
    });
    console.log('   ✅ Order Confirmation sent\n');

    // Test 2: Order In Progress
    console.log('2️⃣  Sending Order In Progress email...');
    await sendOrderInProgressEmail({
      to: testEmail,
      orderId: 'test-order-12345678',
      serviceName: 'Instagram Followers',
      quantity: 1000,
      currentCount: 350,
      startCount: 0,
    });
    console.log('   ✅ Order In Progress sent\n');

    // Test 3: Order Completed
    console.log('3️⃣  Sending Order Completed email...');
    await sendOrderCompletedEmail({
      to: testEmail,
      orderId: 'test-order-12345678',
      serviceName: 'Instagram Followers',
      quantity: 1000,
    });
    console.log('   ✅ Order Completed sent\n');

    // Test 4: Order Failed
    console.log('4️⃣  Sending Order Failed email...');
    await sendOrderFailedEmail({
      to: testEmail,
      orderId: 'test-order-12345678',
      serviceName: 'Instagram Followers',
      totalPrice: '49.99',
      failureReason: 'Target account is private',
    });
    console.log('   ✅ Order Failed sent\n');

    // Test 5: Wallet Deposit
    console.log('5️⃣  Sending Wallet Deposit email...');
    await sendWalletDepositEmail({
      to: testEmail,
      transactionId: 'txn-987654321',
      amount: '100.00',
      paymentMethod: 'Stripe',
      newBalance: '150.00',
    });
    console.log('   ✅ Wallet Deposit sent\n');

    console.log('🎉 All test emails sent successfully!');
    console.log(`📬 Check your inbox at: ${testEmail}`);
    console.log('\n⏳ Emails may take 1-2 minutes to arrive.');

  } catch (error) {
    console.error('❌ Error sending test emails:', error);
    process.exit(1);
  }
}

runTests();
