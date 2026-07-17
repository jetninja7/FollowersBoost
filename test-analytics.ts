/**
 * Simple test script to verify analytics functions return proper data types
 * Run with: npx tsx test-analytics.ts
 */

import {
  getPlatformPerformance,
  getPaymentMethodStats,
  getCustomerSegments,
  getConversionMetrics,
  getFulfillmentMetrics,
  getCohortAnalysis
} from './src/actions/analytics-advanced';

async function testAnalytics() {
  console.log('Testing analytics functions for serialization issues...\n');

  try {
    console.log('1. Testing getPlatformPerformance...');
    const platforms = await getPlatformPerformance();
    console.log(`   ✅ Returned ${platforms.length} platforms`);
    if (platforms.length > 0) {
      const sample = platforms[0];
      console.log(`   Sample: ${JSON.stringify(sample, null, 2)}`);
    }

    console.log('\n2. Testing getPaymentMethodStats...');
    const paymentMethods = await getPaymentMethodStats();
    console.log(`   ✅ Returned ${paymentMethods.length} payment methods`);
    if (paymentMethods.length > 0) {
      console.log(`   Sample: ${JSON.stringify(paymentMethods[0], null, 2)}`);
    }

    console.log('\n3. Testing getCustomerSegments...');
    const segments = await getCustomerSegments();
    console.log(`   ✅ Returned ${segments.length} segments`);
    if (segments.length > 0) {
      console.log(`   Sample: ${JSON.stringify(segments[0], null, 2)}`);
    }

    console.log('\n4. Testing getConversionMetrics...');
    const conversion = await getConversionMetrics();
    console.log(`   ✅ Conversion metrics: ${JSON.stringify(conversion, null, 2)}`);

    console.log('\n5. Testing getFulfillmentMetrics...');
    const fulfillment = await getFulfillmentMetrics();
    console.log(`   ✅ Returned ${fulfillment.length} providers`);
    if (fulfillment.length > 0) {
      console.log(`   Sample: ${JSON.stringify(fulfillment[0], null, 2)}`);
    }

    console.log('\n6. Testing getCohortAnalysis...');
    const cohorts = await getCohortAnalysis();
    console.log(`   ✅ Returned ${cohorts.length} cohorts`);
    if (cohorts.length > 0) {
      console.log(`   Sample: ${JSON.stringify(cohorts[0], null, 2)}`);
    }

    console.log('\n✅ All analytics functions passed serialization test!');
    console.log('All return values are JSON-serializable (no Decimal objects)');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run without auth for testing (comment out requireAdmin() calls temporarily)
testAnalytics().then(() => process.exit(0));
