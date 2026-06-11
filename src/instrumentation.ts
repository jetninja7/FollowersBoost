export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Validate environment variables early
    await import('./lib/env');
    // Initialize Sentry for error tracking
    await import('./lib/sentry');
  }
}
