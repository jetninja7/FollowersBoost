import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/session';
import { Button } from '@/components/ui/button';
import { MobileMenu } from './mobile-menu';

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            FollowersBoost
          </span>
        </Link>

        {/* Desktop Navigation Links - Hidden on mobile */}
        <div className="hidden md:flex items-center space-x-6">
          <Link
            href="#services"
            className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
          >
            Services
          </Link>
          <Link
            href="#pricing"
            className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="#faq"
            className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
          >
            FAQ
          </Link>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center space-x-2">
          {user ? (
            // Logged in - Show Dashboard button
            <Link href="/dashboard">
              <Button>Dashboard</Button>
            </Link>
          ) : (
            // Not logged in - Show Login and Sign Up buttons
            <>
              <Link href="/login" className="hidden sm:block">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/signup">
                <Button>Sign Up</Button>
              </Link>
            </>
          )}

          {/* Mobile Menu */}
          <MobileMenu user={user} />
        </div>
      </nav>
    </header>
  );
}
