import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function VerifyEmailPage() {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-4">
          <svg
            className="h-16 w-16 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <CardTitle className="text-2xl font-bold text-center">
          Check your email
        </CardTitle>
        <CardDescription className="text-center">
          Email verification is coming soon
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600 text-center">
          We're working on email verification to help keep your account secure.
          For now, you can continue to the app and start exploring FollowersBoost.
        </p>
        <p className="text-sm text-gray-600 text-center">
          Email verification will be available in a future update.
        </p>
      </CardContent>
      <CardFooter>
        <Link href="/" className="w-full">
          <Button className="w-full">Continue to App</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
