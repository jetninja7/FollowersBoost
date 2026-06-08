import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center py-32 px-16 bg-white dark:bg-black">
        <div className="flex flex-col items-center gap-6 text-center">
          <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight text-black dark:text-zinc-50">
            Welcome to FollowersBoost
          </h1>

          {user ? (
            <div className="flex flex-col items-center gap-4">
              <p className="text-lg text-zinc-600 dark:text-zinc-400">
                Hello, <span className="font-semibold text-black dark:text-zinc-50">{user.name || user.email}</span>!
              </p>
              <p className="text-zinc-600 dark:text-zinc-400">
                You are logged in.
              </p>
              {user.role && (
                <p className="text-sm text-zinc-500 dark:text-zinc-500">
                  Role: {user.role}
                </p>
              )}
              <SignOutButton />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6">
              <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
                Get started by creating an account or logging in to boost your social media presence.
              </p>
              <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
                <Link
                  href="/signup"
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
                >
                  Sign Up
                </Link>
                <Link
                  href="/login"
                  className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
                >
                  Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
