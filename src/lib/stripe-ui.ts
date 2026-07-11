import type { StripeCardElementOptions } from '@stripe/stripe-js';

/**
 * Shared Stripe Elements styling for any CardElement used in the app.
 * Imported by both the wallet top-up modal and the order checkout modal
 * so they look and behave consistently.
 */
export const CARD_ELEMENT_OPTIONS: StripeCardElementOptions = {
  style: {
    base: {
      fontSize: '14px',
      color: 'hsl(var(--foreground))',
      '::placeholder': {
        color: 'hsl(var(--muted-foreground))',
      },
      fontFamily: 'system-ui, sans-serif',
    },
    invalid: {
      color: 'hsl(var(--destructive))',
    },
  },
};
