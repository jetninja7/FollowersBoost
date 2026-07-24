import { z } from 'zod';

// Server-side environment schema
const serverSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // Auth
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),

  // OAuth (optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Stripe (optional for testing without payments)
  STRIPE_SECRET_KEY: z.string().startsWith('sk_').optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_').optional(),

  // PayPal (optional for testing without PayPal)
  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_CLIENT_SECRET: z.string().optional(),
  PAYPAL_MODE: z.enum(['sandbox', 'live']).optional(),
  PAYPAL_WEBHOOK_ID: z.string().optional(),

  // Monitoring
  SENTRY_DSN: z.string().url().optional(),

  // Rate Limiting (optional for preview)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),

  // Provider Credential Encryption (optional but recommended)
  PROVIDER_ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-f]{64}$/, 'PROVIDER_ENCRYPTION_KEY must be 64 hex characters (32 bytes)')
    .optional(),

  // Email
  RESEND_API_KEY: z.string().startsWith('re_').optional(),
  EMAIL_FROM: z.string().email().optional(),

  // System
  NODE_ENV: z.enum(['development', 'production', 'test']),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

// Client-side environment schema
const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_').optional(),
  NEXT_PUBLIC_PAYPAL_CLIENT_ID: z.string().optional(),
});

// Parse and validate environment variables
const serverEnv = serverSchema.parse(process.env);
const clientEnv = clientSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_PAYPAL_CLIENT_ID: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
});

// Validate and export typed environment
export const env = {
  ...serverEnv,
  ...clientEnv,
} as const;

// Type-safe access
export type Env = typeof env;
