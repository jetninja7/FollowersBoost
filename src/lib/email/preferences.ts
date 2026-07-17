import { prisma } from '@/lib/db/prisma';

export type EmailPreferenceType =
  | 'orderUpdates'
  | 'orderCompleted'
  | 'orderFailed'
  | 'walletUpdates'
  | 'promotional'
  | 'newsletter';

/**
 * Get or create email preferences for a user
 */
export async function getEmailPreferences(userId: string) {
  let preferences = await prisma.emailPreferences.findUnique({
    where: { userId },
  });

  // Create default preferences if they don't exist
  if (!preferences) {
    preferences = await prisma.emailPreferences.create({
      data: { userId },
    });
  }

  return preferences;
}

/**
 * Check if user should receive a specific type of email
 */
export async function shouldSendEmail(
  userId: string,
  emailType: EmailPreferenceType
): Promise<boolean> {
  const preferences = await getEmailPreferences(userId);

  // If user unsubscribed from all, don't send anything
  if (preferences.unsubscribedAll) {
    return false;
  }

  // Check specific preference
  return preferences[emailType] === true;
}

/**
 * Update email preferences
 */
export async function updateEmailPreferences(
  userId: string,
  updates: Partial<{
    orderUpdates: boolean;
    orderCompleted: boolean;
    orderFailed: boolean;
    walletUpdates: boolean;
    promotional: boolean;
    newsletter: boolean;
  }>
) {
  return prisma.emailPreferences.upsert({
    where: { userId },
    create: {
      userId,
      ...updates,
    },
    update: updates,
  });
}

/**
 * Unsubscribe user from all emails
 */
export async function unsubscribeAll(userId: string) {
  return prisma.emailPreferences.upsert({
    where: { userId },
    create: {
      userId,
      unsubscribedAll: true,
      orderUpdates: false,
      orderCompleted: false,
      orderFailed: false,
      walletUpdates: false,
      promotional: false,
      newsletter: false,
    },
    update: {
      unsubscribedAll: true,
      orderUpdates: false,
      orderCompleted: false,
      orderFailed: false,
      walletUpdates: false,
      promotional: false,
      newsletter: false,
    },
  });
}

/**
 * Unsubscribe user via token (for email links)
 */
export async function unsubscribeByToken(token: string) {
  const preferences = await prisma.emailPreferences.findUnique({
    where: { unsubscribeToken: token },
    include: { user: true },
  });

  if (!preferences) {
    return null;
  }

  await unsubscribeAll(preferences.userId);

  return preferences.user;
}

/**
 * Get unsubscribe URL for a user
 */
export async function getUnsubscribeUrl(userId: string): Promise<string> {
  const preferences = await getEmailPreferences(userId);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/unsubscribe?token=${preferences.unsubscribeToken}`;
}

/**
 * Get email preferences management URL
 */
export function getPreferencesUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/settings/email-preferences`;
}
