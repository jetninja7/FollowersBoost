/**
 * Resend Email Client
 *
 * Wrapper around Resend API for sending transactional emails.
 * Gracefully degrades if RESEND_API_KEY is not configured.
 */

import { Resend } from 'resend';
import { logger } from '@/lib/logger';

let resend: Resend | null = null;

/**
 * Initialize Resend client (lazy)
 */
function getResendClient(): Resend | null {
  if (resend) return resend;

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    logger.warn('RESEND_API_KEY not configured - email sending disabled');
    return null;
  }

  resend = new Resend(apiKey);
  return resend;
}

/**
 * Check if email is enabled
 */
export function isEmailEnabled(): boolean {
  return !!process.env.RESEND_API_KEY;
}

/**
 * Send email via Resend
 */
export async function sendEmail(params: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const client = getResendClient();

  if (!client) {
    logger.warn({ to: params.to, subject: params.subject }, 'Email not sent - Resend not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const from = params.from || process.env.EMAIL_FROM || 'noreply@followersboost.com';

    const result = await client.emails.send({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      replyTo: params.replyTo,
    });

    if ('id' in result && result.id) {
      logger.info(
        {
          emailId: result.id,
          to: params.to,
          subject: params.subject,
        },
        'Email sent successfully'
      );

      return { success: true, id: result.id };
    }

    logger.error({ result, params }, 'Email send failed - no ID returned');
    return { success: false, error: 'No email ID returned' };
  } catch (error) {
    logger.error(
      {
        error,
        to: params.to,
        subject: params.subject,
      },
      'Failed to send email'
    );

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send bulk emails (up to 100 recipients per batch)
 */
export async function sendBulkEmails(
  emails: Array<{
    to: string;
    subject: string;
    html: string;
    text?: string;
  }>
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const results = {
    sent: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const email of emails) {
    const result = await sendEmail(email);

    if (result.success) {
      results.sent++;
    } else {
      results.failed++;
      if (result.error) {
        results.errors.push(result.error);
      }
    }
  }

  logger.info(results, 'Bulk email send completed');

  return results;
}
