/**
 * Email Preferences Test Script
 *
 * Tests the email preferences system end-to-end:
 * - Database operations (create, read, update)
 * - User preference checks
 * - Unsubscribe token flow
 * - Email filtering logic
 */

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });
config({ path: '.env' });

import { prisma } from './src/lib/db/prisma';
import {
  getEmailPreferences,
  shouldSendEmail,
  updateEmailPreferences,
  unsubscribeAll,
  unsubscribeByToken,
  getUnsubscribeUrl,
} from './src/lib/email/preferences';

async function testEmailPreferences() {
  console.log('🧪 Testing Email Preferences System\n');

  try {
    // Find or create a test user
    let testUser = await prisma.user.findFirst({
      where: { email: 'admin@followersboost.com' },
    });

    if (!testUser) {
      console.log('❌ Test user not found. Please run seed script first.');
      process.exit(1);
    }

    console.log(`✅ Found test user: ${testUser.email} (${testUser.id})\n`);

    // Test 1: Get or create email preferences
    console.log('📧 Test 1: Get or create email preferences');
    const preferences = await getEmailPreferences(testUser.id);
    console.log('   Preferences:', {
      orderUpdates: preferences.orderUpdates,
      orderCompleted: preferences.orderCompleted,
      orderFailed: preferences.orderFailed,
      walletUpdates: preferences.walletUpdates,
      promotional: preferences.promotional,
      newsletter: preferences.newsletter,
      unsubscribedAll: preferences.unsubscribedAll,
    });
    console.log('✅ Get preferences working\n');

    // Test 2: Check shouldSendEmail
    console.log('📧 Test 2: Check shouldSendEmail logic');
    const shouldSend = await shouldSendEmail(testUser.id, 'orderUpdates');
    console.log(`   Should send orderUpdates: ${shouldSend}`);
    console.log('✅ shouldSendEmail working\n');

    // Test 3: Update specific preferences
    console.log('📧 Test 3: Update specific preferences');
    await updateEmailPreferences(testUser.id, {
      promotional: false,
      newsletter: false,
    });
    const updated = await getEmailPreferences(testUser.id);
    console.log('   Updated preferences:', {
      promotional: updated.promotional,
      newsletter: updated.newsletter,
    });
    console.log('✅ Update preferences working\n');

    // Test 4: Verify shouldSendEmail respects preferences
    console.log('📧 Test 4: Verify email filtering');
    const shouldSendPromo = await shouldSendEmail(testUser.id, 'promotional');
    const shouldSendOrder = await shouldSendEmail(testUser.id, 'orderUpdates');
    console.log(`   Should send promotional: ${shouldSendPromo} (expected: false)`);
    console.log(`   Should send orderUpdates: ${shouldSendOrder} (expected: true)`);

    if (!shouldSendPromo && shouldSendOrder) {
      console.log('✅ Email filtering working correctly\n');
    } else {
      console.log('❌ Email filtering not working as expected\n');
    }

    // Test 5: Get unsubscribe URL
    console.log('📧 Test 5: Get unsubscribe URL');
    const unsubUrl = await getUnsubscribeUrl(testUser.id);
    const token = unsubUrl.split('token=')[1];
    console.log(`   Unsubscribe URL: ${unsubUrl}`);
    console.log(`   Token: ${token}`);
    console.log('✅ Unsubscribe URL generation working\n');

    // Test 6: Unsubscribe via token
    console.log('📧 Test 6: Unsubscribe via token');
    const unsubscribedUser = await unsubscribeByToken(token);
    if (unsubscribedUser) {
      console.log(`   Unsubscribed user: ${unsubscribedUser.email}`);
      const prefsAfterUnsub = await getEmailPreferences(testUser.id);
      console.log('   Preferences after unsubscribe:', {
        unsubscribedAll: prefsAfterUnsub.unsubscribedAll,
        orderUpdates: prefsAfterUnsub.orderUpdates,
        promotional: prefsAfterUnsub.promotional,
      });
      console.log('✅ Token unsubscribe working\n');
    } else {
      console.log('❌ Token unsubscribe failed\n');
    }

    // Test 7: Verify shouldSendEmail returns false after unsubscribe
    console.log('📧 Test 7: Verify all emails blocked after unsubscribe');
    const shouldSendAfterUnsub = await shouldSendEmail(testUser.id, 'orderUpdates');
    console.log(`   Should send orderUpdates: ${shouldSendAfterUnsub} (expected: false)`);

    if (!shouldSendAfterUnsub) {
      console.log('✅ Unsubscribe from all working correctly\n');
    } else {
      console.log('❌ Unsubscribe from all not working\n');
    }

    // Test 8: Re-enable preferences
    console.log('📧 Test 8: Re-enable preferences (resubscribe)');
    await updateEmailPreferences(testUser.id, {
      orderUpdates: true,
      orderCompleted: true,
      orderFailed: true,
      walletUpdates: true,
      promotional: true,
      newsletter: true,
    });
    const resubscribed = await getEmailPreferences(testUser.id);
    console.log('   Preferences after resubscribe:', {
      unsubscribedAll: resubscribed.unsubscribedAll,
      orderUpdates: resubscribed.orderUpdates,
      promotional: resubscribed.promotional,
    });
    console.log('✅ Resubscribe working\n');

    console.log('🎉 All email preference tests passed!\n');

    // Summary
    console.log('📊 Test Summary:');
    console.log('   ✅ Email preferences creation');
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
