import { payPalClient, Environment } from '@paypal/paypal-server-sdk';

let client: ReturnType<typeof payPalClient> | null = null;

function getPayPalClient() {
  if (!client) {
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      throw new Error('PayPal credentials are not defined');
    }

    const mode = process.env.PAYPAL_MODE || 'sandbox';
    const environment =
      mode === 'live' ? Environment.Production : Environment.Sandbox;

    client = payPalClient({
      clientCredentialsAuthCredentials: {
        oAuthClientId: process.env.PAYPAL_CLIENT_ID,
        oAuthClientSecret: process.env.PAYPAL_CLIENT_SECRET,
      },
      environment,
    });
  }

  return client;
}

export const paypalHttpClient = new Proxy({} as ReturnType<typeof payPalClient>, {
  get: (_target, prop) => {
    const c = getPayPalClient();
    const value = c[prop as keyof typeof c];
    return typeof value === 'function' ? value.bind(c) : value;
  },
});

/**
 * True when PayPal is configured for this environment. Use at the top of
 * routes that initiate a payment so we return a clear 503 instead of
 * throwing inside the proxy when PayPal credentials are unset.
 */
export function isPayPalEnabled(): boolean {
  return Boolean(
    process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET
  );
}
