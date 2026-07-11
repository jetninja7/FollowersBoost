import { prisma } from '@/lib/db/prisma';
import { stripe } from '@/lib/stripe';

/**
 * Get or create a Stripe customer for a user
 * If user already has a stripeCustomerId, return it
 * Otherwise create a new Stripe customer and save the ID to the database
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string
): Promise<string> {
  // Check if user already has a Stripe customer ID
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  if (user?.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    metadata: {
      userId,
    },
  });

  // Save customer ID to database
  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

/**
 * Get Stripe customer ID for a user
 * Returns null if user doesn't have a customer ID yet
 */
export async function getStripeCustomerId(
  userId: string
): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  return user?.stripeCustomerId || null;
}
