import { requireAuth } from '@/lib/auth/session';
import { updateEmailPreferences, unsubscribeAll } from '@/lib/email/preferences';
import { z } from 'zod';

const PreferencesSchema = z.object({
  orderUpdates: z.boolean().optional(),
  orderCompleted: z.boolean().optional(),
  orderFailed: z.boolean().optional(),
  walletUpdates: z.boolean().optional(),
  promotional: z.boolean().optional(),
  newsletter: z.boolean().optional(),
  unsubscribedAll: z.boolean().optional(),
});

export async function PUT(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const validated = PreferencesSchema.parse(body);

    // If unsubscribing from all, use special function
    if (validated.unsubscribedAll) {
      await unsubscribeAll(session.user.id);
    } else {
      await updateEmailPreferences(session.user.id, validated);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('[EMAIL_PREFERENCES_UPDATE]', error);

    if (error instanceof z.ZodError) {
      return Response.json(
        { success: false, error: 'Invalid preferences format' },
        { status: 400 }
      );
    }

    return Response.json(
      { success: false, error: 'Failed to update email preferences' },
      { status: 500 }
    );
  }
}
