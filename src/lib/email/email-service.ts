/**
 * Email Service
 *
 * High-level email sending functions for different user actions.
 * Renders templates and sends emails via Resend.
 */

import { sendEmail, isEmailEnabled } from './resend-client';
import { renderEmail } from './render';
import { OrderConfirmationEmail } from './templates/order-confirmation';
import { OrderInProgressEmail } from './templates/order-in-progress';
import { OrderCompletedEmail } from './templates/order-completed';
import { OrderFailedEmail } from './templates/order-failed';
import { WalletDepositEmail } from './templates/wallet-deposit';
import { logger } from '@/lib/logger';
import { shouldSendEmail, getUnsubscribeUrl } from './preferences';

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(params: {
  to: string;
  userId: string;
  orderId: string;
  serviceName: string;
  platform: string;
  quantity: number;
  totalPrice: string;
  targetUrl: string;
  estimatedDelivery: string;
}): Promise<void> {
  if (!isEmailEnabled()) {
    logger.info({ orderId: params.orderId }, 'Skipping email - service not configured');
    return;
  }

  // Check user preferences
  const canSend = await shouldSendEmail(params.userId, 'orderUpdates');
  if (!canSend) {
    logger.info({ orderId: params.orderId, userId: params.userId }, 'Skipping email - user unsubscribed');
    return;
  }

  try {
    const unsubscribeUrl = await getUnsubscribeUrl(params.userId);

    const html = await renderEmail(
      OrderConfirmationEmail({
        orderId: params.orderId,
        serviceName: params.serviceName,
        platform: params.platform,
        quantity: params.quantity,
        totalPrice: params.totalPrice,
        targetUrl: params.targetUrl,
        estimatedDelivery: params.estimatedDelivery,
        unsubscribeUrl,
      })
    );

    await sendEmail({
      to: params.to,
      subject: `Order Confirmed - #${params.orderId.slice(0, 8)}`,
      html,
    });
  } catch (error) {
    logger.error({ error, orderId: params.orderId }, 'Failed to send order confirmation email');
  }
}

/**
 * Send order in progress email
 */
export async function sendOrderInProgressEmail(params: {
  to: string;
  userId: string;
  orderId: string;
  serviceName: string;
  quantity: number;
  currentCount: number;
  startCount: number;
}): Promise<void> {
  if (!isEmailEnabled()) {
    logger.info({ orderId: params.orderId }, 'Skipping email - service not configured');
    return;
  }

  const canSend = await shouldSendEmail(params.userId, 'orderUpdates');
  if (!canSend) {
    logger.info({ orderId: params.orderId, userId: params.userId }, 'Skipping email - user unsubscribed');
    return;
  }

  try {
    const unsubscribeUrl = await getUnsubscribeUrl(params.userId);

    const html = await renderEmail(
      OrderInProgressEmail({
        orderId: params.orderId,
        serviceName: params.serviceName,
        quantity: params.quantity,
        currentCount: params.currentCount,
        startCount: params.startCount,
        unsubscribeUrl,
      })
    );

    await sendEmail({
      to: params.to,
      subject: `Delivery Started - #${params.orderId.slice(0, 8)}`,
      html,
    });
  } catch (error) {
    logger.error({ error, orderId: params.orderId }, 'Failed to send order in progress email');
  }
}

/**
 * Send order completed email
 */
export async function sendOrderCompletedEmail(params: {
  to: string;
  userId: string;
  orderId: string;
  serviceName: string;
  quantity: number;
}): Promise<void> {
  if (!isEmailEnabled()) {
    logger.info({ orderId: params.orderId }, 'Skipping email - service not configured');
    return;
  }

  const canSend = await shouldSendEmail(params.userId, 'orderCompleted');
  if (!canSend) {
    logger.info({ orderId: params.orderId, userId: params.userId }, 'Skipping email - user unsubscribed');
    return;
  }

  try {
    const unsubscribeUrl = await getUnsubscribeUrl(params.userId);

    const html = await renderEmail(
      OrderCompletedEmail({
        orderId: params.orderId,
        serviceName: params.serviceName,
        quantity: params.quantity,
        unsubscribeUrl,
      })
    );

    await sendEmail({
      to: params.to,
      subject: `Order Completed - #${params.orderId.slice(0, 8)}`,
      html,
    });
  } catch (error) {
    logger.error({ error, orderId: params.orderId }, 'Failed to send order completed email');
  }
}

/**
 * Send order failed email
 */
export async function sendOrderFailedEmail(params: {
  to: string;
  userId: string;
  orderId: string;
  serviceName: string;
  totalPrice: string;
  failureReason?: string;
}): Promise<void> {
  if (!isEmailEnabled()) {
    logger.info({ orderId: params.orderId }, 'Skipping email - service not configured');
    return;
  }

  const canSend = await shouldSendEmail(params.userId, 'orderFailed');
  if (!canSend) {
    logger.info({ orderId: params.orderId, userId: params.userId }, 'Skipping email - user unsubscribed');
    return;
  }

  try {
    const unsubscribeUrl = await getUnsubscribeUrl(params.userId);

    const html = await renderEmail(
      OrderFailedEmail({
        orderId: params.orderId,
        serviceName: params.serviceName,
        totalPrice: params.totalPrice,
        failureReason: params.failureReason,
        unsubscribeUrl,
      })
    );

    await sendEmail({
      to: params.to,
      subject: `Order Refunded - #${params.orderId.slice(0, 8)}`,
      html,
    });
  } catch (error) {
    logger.error({ error, orderId: params.orderId }, 'Failed to send order failed email');
  }
}

/**
 * Send wallet deposit confirmation email
 */
export async function sendWalletDepositEmail(params: {
  to: string;
  userId: string;
  transactionId: string;
  amount: string;
  paymentMethod: string;
  newBalance: string;
}): Promise<void> {
  if (!isEmailEnabled()) {
    logger.info({ transactionId: params.transactionId }, 'Skipping email - service not configured');
    return;
  }

  const canSend = await shouldSendEmail(params.userId, 'walletUpdates');
  if (!canSend) {
    logger.info({ transactionId: params.transactionId, userId: params.userId }, 'Skipping email - user unsubscribed');
    return;
  }

  try {
    const unsubscribeUrl = await getUnsubscribeUrl(params.userId);

    const html = await renderEmail(
      WalletDepositEmail({
        transactionId: params.transactionId,
        amount: params.amount,
        paymentMethod: params.paymentMethod,
        newBalance: params.newBalance,
        unsubscribeUrl,
      })
    );

    await sendEmail({
      to: params.to,
      subject: `Wallet Credited - $${params.amount} Added`,
      html,
    });
  } catch (error) {
    logger.error({ error, transactionId: params.transactionId }, 'Failed to send wallet deposit email');
  }
}
