import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not defined');
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-05-27.dahlia',
      typescript: true,
    });
  }
  return stripeInstance;
}

export const stripe = new Proxy({} as Stripe, {
  get: (_target, prop) => {
    const instance = getStripe();
    const value = instance[prop as keyof Stripe];
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});

/**
 * True when Stripe is configured for this environment. Use at the top of
 * routes that initiate a payment so we return a clear 503 instead of
 * throwing inside the proxy when STRIPE_SECRET_KEY is unset.
 */
export function isStripeEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
