import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Sample 10% of transactions for performance monitoring
  tracesSampleRate: 0.1,

  // Only enable in production
  enabled: process.env.NODE_ENV === 'production',

  // Scrub sensitive data before sending
  beforeSend(event) {
    // Remove sensitive headers
    if (event.request?.headers) {
      delete event.request.headers.cookie;
      delete event.request.headers.authorization;
    }

    // Remove sensitive request data
    if (event.request?.data && typeof event.request.data === 'object') {
      const data = event.request.data as Record<string, unknown>;
      delete data.password;
      delete data.token;
      delete data.secret;
    }

    return event;
  },

  // Ignore expected errors
  ignoreErrors: [
    'NEXT_REDIRECT',
    'NEXT_NOT_FOUND',
  ],
});
