/**
 * Provider Credential Encryption Test Script
 *
 * Tests the encryption/decryption system for provider credentials
 */

import {
  encrypt,
  decrypt,
  encryptCredentials,
  decryptCredentials,
  isEncryptionEnabled,
  generateEncryptionKey,
} from './src/lib/crypto/encryption';

async function testEncryption() {
  console.log('🔐 Testing Provider Credential Encryption\n');

  // Test 1: Check if encryption is enabled
  console.log('Test 1: Check encryption configuration');
  const enabled = isEncryptionEnabled();
  if (!enabled) {
    console.log('❌ Encryption not enabled - PROVIDER_ENCRYPTION_KEY not set');
    console.log('\n📝 To enable encryption:');
    console.log('   1. Generate a key: openssl rand -hex 32');
    console.log('   2. Add to .env.local: PROVIDER_ENCRYPTION_KEY=<generated-key>');
    console.log('   3. Re-run this test\n');
    process.exit(1);
  }
  console.log('✅ Encryption is enabled\n');

  // Test 2: Basic string encryption/decryption
  console.log('Test 2: Basic string encryption/decryption');
  const testString = 'my-secret-api-key-12345';
  try {
    const encrypted = encrypt(testString);
    console.log(`   Original: ${testString}`);
    console.log(`   Encrypted: ${encrypted.substring(0, 50)}...`);

    const decrypted = decrypt(encrypted);
    console.log(`   Decrypted: ${decrypted}`);

    if (decrypted === testString) {
      console.log('✅ Basic encryption/decryption working\n');
    } else {
      console.log('❌ Decrypted value does not match original\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Basic encryption failed:', error);
    process.exit(1);
  }

  // Test 3: Credentials object encryption
  console.log('Test 3: Credentials object encryption');
  const testCredentials = {
    apiKey: 'sk_test_abc123xyz789',
    apiSecret: 'secret_987654321',
    webhookSecret: 'whsec_test123',
  };

  try {
    const encryptedCreds = encryptCredentials(testCredentials);
    console.log('   Original credentials:', testCredentials);
    console.log(`   Encrypted: ${encryptedCreds.substring(0, 50)}...`);

    const decryptedCreds = decryptCredentials(encryptedCreds);
    console.log('   Decrypted credentials:', decryptedCreds);

    if (
      decryptedCreds.apiKey === testCredentials.apiKey &&
      decryptedCreds.apiSecret === testCredentials.apiSecret &&
      decryptedCreds.webhookSecret === testCredentials.webhookSecret
    ) {
      console.log('✅ Credentials encryption/decryption working\n');
    } else {
      console.log('❌ Decrypted credentials do not match original\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Credentials encryption failed:', error);
    process.exit(1);
  }

  // Test 4: Encryption uniqueness (same input produces different output)
  console.log('Test 4: Encryption uniqueness (IV randomization)');
  const encrypted1 = encrypt(testString);
  const encrypted2 = encrypt(testString);

  if (encrypted1 !== encrypted2) {
    console.log('✅ Encryption produces unique output (proper IV randomization)\n');
  } else {
    console.log('❌ Encryption produces identical output (IV not randomized)\n');
    process.exit(1);
  }

  // Test 5: Tamper detection
  console.log('Test 5: Tamper detection');
  try {
    const encrypted = encrypt(testString);
    const parts = encrypted.split(':');
    // Tamper with the encrypted data
    const tampered = parts[0] + ':' + parts[1] + ':' + parts[2].substring(0, parts[2].length - 5) + 'xxxxx';

    try {
      decrypt(tampered);
      console.log('❌ Tamper detection failed - accepted modified data\n');
      process.exit(1);
    } catch (error) {
      console.log('✅ Tamper detection working - rejected modified data\n');
    }
  } catch (error) {
    console.error('❌ Tamper detection test failed:', error);
    process.exit(1);
  }

  // Test 6: Edge cases
  console.log('Test 6: Edge cases');

  // Empty string
  try {
    const emptyEncrypted = encrypt('');
    const emptyDecrypted = decrypt(emptyEncrypted);
    if (emptyDecrypted === '') {
      console.log('   ✅ Empty string handled correctly');
    } else {
      console.log('   ❌ Empty string not handled correctly');
      process.exit(1);
    }
  } catch (error) {
    console.error('   ❌ Empty string test failed:', error);
    process.exit(1);
  }

  // Unicode characters
  try {
    const unicodeString = '🔐 Secret 密钥 مفتاح سري';
    const unicodeEncrypted = encrypt(unicodeString);
    const unicodeDecrypted = decrypt(unicodeEncrypted);
    if (unicodeDecrypted === unicodeString) {
      console.log('   ✅ Unicode characters handled correctly');
    } else {
      console.log('   ❌ Unicode characters not handled correctly');
      process.exit(1);
    }
  } catch (error) {
    console.error('   ❌ Unicode test failed:', error);
    process.exit(1);
  }

  // Large credential object
  try {
    const largeCreds: Record<string, string> = {};
    for (let i = 0; i < 20; i++) {
      largeCreds[`key${i}`] = `value${i}`.repeat(10);
    }
    const largeEncrypted = encryptCredentials(largeCreds);
    const largeDecrypted = decryptCredentials(largeEncrypted);
    if (JSON.stringify(largeDecrypted) === JSON.stringify(largeCreds)) {
      console.log('   ✅ Large credential objects handled correctly');
    } else {
      console.log('   ❌ Large credential objects not handled correctly');
      process.exit(1);
    }
  } catch (error) {
    console.error('   ❌ Large object test failed:', error);
    process.exit(1);
  }

  console.log('\n✅ All encryption tests passed!\n');

  // Summary
  console.log('📊 Test Summary:');
  console.log('   ✅ Encryption configuration valid');
  console.log('   ✅ Basic encryption/decryption working');
  console.log('   ✅ Credentials object encryption working');
  console.log('   ✅ IV randomization (unique ciphertexts)');
  console.log('   ✅ Tamper detection (authentication)');
  console.log('   ✅ Edge cases (empty, unicode, large)');
  console.log('\n🎉 Provider credential encryption is fully functional!\n');

  // Display sample encrypted output
  console.log('📝 Sample encrypted provider credentials:');
  const sampleCreds = {
    apiKey: 'your-api-key-here',
    apiSecret: 'your-api-secret-here',
  };
  const sampleEncrypted = encryptCredentials(sampleCreds);
  console.log(`   ${sampleEncrypted.substring(0, 80)}...\n`);
  console.log('This encrypted string is what gets stored in the database.\n');
}

// Run tests
testEncryption().catch((error) => {
  console.error('💥 Test execution failed:', error);
  process.exit(1);
});
