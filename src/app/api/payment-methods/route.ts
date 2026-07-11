import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { stripe, isStripeEnabled } from '@/lib/stripe';
import { getStripeCustomerId } from '@/lib/stripe-customer';
import { z } from 'zod';

/**
 * GET /api/payment-methods
 * List user's saved payment methods from Stripe
 */
export async function GET(request: Request) {
  try {
    const session = await requireAuth();

    if (!isStripeEnabled()) {
      return NextResponse.json(
        { error: { message: 'Stripe is not configured' } },
        { status: 503 }
      );
    }

    // Get user's Stripe customer ID
    const customerId = await getStripeCustomerId(session.user.id!);

    if (!customerId) {
      // User doesn't have any saved payment methods yet
      return NextResponse.json({ data: { paymentMethods: [] } });
    }

    // Fetch payment methods from Stripe
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    // Format payment methods for frontend
    const formattedMethods = paymentMethods.data.map((pm) => ({
      id: pm.id,
      brand: pm.card?.brand || 'unknown',
      last4: pm.card?.last4 || '****',
      expMonth: pm.card?.exp_month,
      expYear: pm.card?.exp_year,
      isDefault: false, // Stripe doesn't have a default payment method on Customer for one-time payments
    }));

    return NextResponse.json({
      data: { paymentMethods: formattedMethods },
    });
  } catch (error) {
    console.error('Get payment methods error:', error);
    return NextResponse.json(
      { error: { message: 'Failed to fetch payment methods' } },
      { status: 500 }
    );
  }
}

const deleteSchema = z.object({
  paymentMethodId: z.string(),
});

/**
 * DELETE /api/payment-methods
 * Remove a saved payment method from Stripe
 */
export async function DELETE(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const validation = deleteSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: { message: 'Invalid input', details: validation.error } },
        { status: 400 }
      );
    }

    const { paymentMethodId } = validation.data;

    if (!isStripeEnabled()) {
      return NextResponse.json(
        { error: { message: 'Stripe is not configured' } },
        { status: 503 }
      );
    }

    // Detach payment method from customer
    await stripe.paymentMethods.detach(paymentMethodId);

    return NextResponse.json({
      data: { success: true },
    });
  } catch (error) {
    console.error('Delete payment method error:', error);
    return NextResponse.json(
      { error: { message: 'Failed to delete payment method' } },
      { status: 500 }
    );
  }
}
