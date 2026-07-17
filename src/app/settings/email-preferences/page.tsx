import { requireAuth } from '@/lib/auth/session';
import { getEmailPreferences } from '@/lib/email/preferences';
import { EmailPreferencesForm } from '@/components/settings/email-preferences-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function EmailPreferencesPage() {
  const session = await requireAuth();
  const preferences = await getEmailPreferences(session.user.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Email Preferences</h1>
          <p className="text-gray-600 mt-2">
            Manage which emails you receive from FollowersBoost
          </p>
        </div>

        {/* Preferences Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <EmailPreferencesForm
            initialPreferences={{
              orderUpdates: preferences.orderUpdates,
              orderCompleted: preferences.orderCompleted,
              orderFailed: preferences.orderFailed,
              walletUpdates: preferences.walletUpdates,
              promotional: preferences.promotional,
              newsletter: preferences.newsletter,
              unsubscribedAll: preferences.unsubscribedAll,
            }}
          />
        </div>

        {/* Info Section */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> Important account security notifications will always be sent regardless of these preferences.
          </p>
        </div>
      </div>
    </div>
  );
}
