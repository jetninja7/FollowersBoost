import { unsubscribeByToken } from '@/lib/email/preferences';
import Link from 'next/link';
import { CheckCircle, Mail } from 'lucide-react';

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function UnsubscribePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = params.token;

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h1>
          <p className="text-gray-600 mb-6">
            This unsubscribe link is invalid or has expired.
          </p>
          <Link
            href="/settings/email-preferences"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Manage Email Preferences
          </Link>
        </div>
      </div>
    );
  }

  const user = await unsubscribeByToken(token);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Not Found</h1>
          <p className="text-gray-600 mb-6">
            We couldn't find an account associated with this unsubscribe link.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          You've Been Unsubscribed
        </h1>
        <p className="text-gray-600 mb-6">
          You will no longer receive emails from FollowersBoost.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          You can manage your email preferences or resubscribe at any time from your account settings.
        </p>
        <div className="space-y-3">
          <Link
            href="/settings/email-preferences"
            className="block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Manage Email Preferences
          </Link>
          <Link
            href="/"
            className="block px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
