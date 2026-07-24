/**
 * Encryption Utilities
 *
 * AES-256-GCM encryption for sensitive provider credentials.
 * Uses Node.js crypto module for secure encryption/decryption.
 */

import crypto from 'crypto';
import { logger } from '@/lib/logger';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits for GCM
const KEY_LENGTH = 32; // 256 bits

/**
 * Get encryption key from environment variable
 * Key should be 32 bytes (256 bits) hex-encoded
 */
function getEncryptionKey(): Buffer {
  const keyHex = process.env.PROVIDER_ENCRYPTION_KEY;

  if (!keyHex) {
    throw new Error(
      'PROVIDER_ENCRYPTION_KEY environment variable is not set. ' +
      'Generate one with: openssl rand -hex 32'
    );
  }

  const key = Buffer.from(keyHex, 'hex');

  if (key.length !== KEY_LENGTH) {
    throw new Error(
      `PROVIDER_ENCRYPTION_KEY must be ${KEY_LENGTH} bytes (${KEY_LENGTH * 2} hex characters). ` +
      `Current length: ${key.length} bytes. Generate with: openssl rand -hex 32`
    );
  }

  return key;
}

/**
 * Encrypt data using AES-256-GCM
 *
 * Returns base64-encoded string in format: iv:authTag:encryptedData
 */
export function encrypt(plaintext: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:encryptedData (all base64 encoded)
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
  } catch (error) {
    logger.error({ error }, 'Failed to encrypt data');
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypt data encrypted with AES-256-GCM
 *
 * Expects base64-encoded string in format: iv:authTag:encryptedData
 */
export function decrypt(ciphertext: string): string {
  try {
    const key = getEncryptionKey();
    const parts = ciphertext.split(':');

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    const encrypted = parts[2];

    if (iv.length !== IV_LENGTH) {
      throw new Error('Invalid IV length');
    }

    if (authTag.length !== AUTH_TAG_LENGTH) {
      throw new Error('Invalid auth tag length');
    }

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    logger.error({ error }, 'Failed to decrypt data');
    throw new Error('Decryption failed');
  }
}

/**
 * Encrypt credentials object
 *
 * Encrypts the entire JSON object and returns encrypted string
 */
export function encryptCredentials(credentials: Record<string, unknown>): string {
  const json = JSON.stringify(credentials);
  return encrypt(json);
}

/**
 * Decrypt credentials object
 *
 * Decrypts encrypted string and returns parsed JSON object
 */
export function decryptCredentials(encryptedCredentials: string): Record<string, unknown> {
  const json = decrypt(encryptedCredentials);
  return JSON.parse(json);
}

/**
 * Check if encryption is configured
 */
export function isEncryptionEnabled(): boolean {
  return !!process.env.PROVIDER_ENCRYPTION_KEY;
}

/**
 * Generate a new encryption key (for setup/documentation)
 * NOT used in production - key should be generated via CLI
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}
