import paypal from '@paypal/checkout-server-sdk';

let paypalClient: paypal.core.PayPalHttpClient | null = null;

function getPayPalClient(): paypal.core.PayPalHttpClient {
  if (!paypalClient) {
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      throw new Error('PayPal credentials are not defined');
    }

    const mode = process.env.PAYPAL_MODE || 'sandbox';
    const environment =
      mode === 'live'
        ? new paypal.core.LiveEnvironment(
            process.env.PAYPAL_CLIENT_ID,
            process.env.PAYPAL_CLIENT_SECRET
          )
        : new paypal.core.SandboxEnvironment(
            process.env.PAYPAL_CLIENT_ID,
            process.env.PAYPAL_CLIENT_SECRET
          );

    paypalClient = new paypal.core.PayPalHttpClient(environment);
  }

  return paypalClient;
}

export const paypalHttpClient = new Proxy({} as paypal.core.PayPalHttpClient, {
  get: (_target, prop) => {
    const client = getPayPalClient();
    const value = client[prop as keyof paypal.core.PayPalHttpClient];
    return typeof value === 'function' ? value.bind(client) : value;
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

// Export PayPal SDK orders namespace for creating and capturing orders
export const PayPalOrders = paypal.orders;
