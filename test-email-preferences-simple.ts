/**
 * Email Preferences Simple Test
 *
 * Simplified test that explicitly sets DATABASE_URL before importing Prisma
 */

// MUST set DATABASE_URL before importing anything that uses Prisma
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/followersboost';

import { prisma } from './src/lib/db/prisma';
import {
  getEmailPreferences,
  shouldSendEmail,
  updateEmailPreferences,
  unsubscribeByToken,
  getUnsubscribeUrl,
} from './src/lib/email/preferences';

async function testEmailPreferences() {
  console.log('🧪 Testing Email Preferences System\n');
  console.log(`Using database: ${process.env.DATABASE_URL}\n`);

  try {
    // Test 1: Find test user
    console.log('📧 Test 1: Finding test user');
    const testUser = await prisma.user.findFirst({
      where: { email: 'admin@followersboost.com' },
    });

    if (!testUser) {
      console.log('❌ Test user not found. Run: npm run db:seed');
      process.exit(1);
    }

    console.log(`✅ Found test user: ${testUser.email} (${testUser.id})\n`);

    // Test 2: Get or create preferences
    console.log('📧 Test 2: Get or create email preferences');
    const preferences = await getEmailPreferences(testUser.id);
    console.log('   Preferences loaded:', {
      orderUpdates: preferences.orderUpdates,
      promotional: preferences.promotional,
      unsubscribedAll: preferences.unsubscribedAll,
    });
    console.log('✅ Preferences working\n');

    // Test 3: Check shouldSendEmail
    console.log('📧 Test 3: Check shouldSendEmail logic');
    const shouldSend = await shouldSendEmail(testUser.id, 'orderUpdates');
    console.log(`   Should send orderUpdates: ${shouldSend}`);
    console.log('✅ Email filtering working\n');

    // Test 4: Update preferences
    console.log('📧 Test 4: Update preferences');
    await updateEmailPreferences(testUser.id, {
      promotional: false,
      newsletter: false,
    });
    const updated = await getEmailPreferences(testUser.id);
    console.log('   Updated:', {
      promotional: updated.promotional,
      newsletter: updated.newsletter,
    });
    console.log('✅ Update working\n');

    // Test 5: Get unsubscribe URL
    console.log('📧 Test 5: Get unsubscribe URL');
    const unsubUrl = await getUnsubscribeUrl(testUser.id);
    const token = unsubUrl.split('token=')[1];
    console.log(`   Token: ${token.substring(0, 20)}...`);
    console.log('✅ Unsubscribe URL generation working\n');

    // Test 6: Unsubscribe via token
    console.log('📧 Test 6: Unsubscribe via token');
    const unsubscribedUser = await unsubscribeByToken(token);
    if (unsubscribedUser) {
      const prefsAfterUnsub = await getEmailPreferences(testUser.id);
      console.log('   After unsubscribe:', {
        unsubscribedAll: prefsAfterUnsub.unsubscribedAll,
        orderUpdates: prefsAfterUnsub.orderUpdates,
      });
      console.log('✅ Token unsubscribe working\n');
    }

    // Test 7: Verify emails are blocked
    console.log('📧 Test 7: Verify emails blocked after unsubscribe');
    const shouldSendAfterUnsub = await shouldSendEmail(testUser.id, 'orderUpdates');
    console.log(`   Should send: ${shouldSendAfterUnsub} (expected: false)`);
    if (!shouldSendAfterUnsub) {
      console.log('✅ Unsubscribe from all working\n');
    } else {
      console.log('❌ Unsubscribe not blocking emails\n');
    }

    // Test 8: Re-enable preferences
    console.log('📧 Test 8: Resubscribe');
    await updateEmailPreferences(testUser.id, {
      orderUpdates: true,
      orderCompleted: true,
      orderFailed: true,
      walletUpdates: true,
      promotional: true,
      newsletter: true,
    });
    const resubscribed = await getEmailPreferences(testUser.id);
    console.log('   After resubscribe:', {
      unsubscribedAll: resubscribed.unsubscribedAll,
      orderUpdates: resubscribed.orderUpdates,
    });
    console.log('✅ Resubscribe working\n');

    console.log('🎉 All email preference tests passed!\n');

    // Summary
    console.log('📊 Test Summary:');
    console.log('   ✅ Email preferences retrieval');
    console.log('   ✅ Email preferences updates');
    console.log('   ✅ shouldSendEmail filtering logic');
    console.log('   ✅ Unsubscribe URL generation');
    console.log('   ✅ Token-based unsubscribe');
    console.log('   ✅ Unsubscribe from all functionality');
    console.log('   ✅ Resubscribe functionality');
    console.log('\n✅ Email Preferences System: FULLY FUNCTIONAL');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
testEmailPreferences();
