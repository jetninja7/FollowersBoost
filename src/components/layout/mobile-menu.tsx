'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import type { Session } from 'next-auth';

interface MobileMenuProps {
  user: Session['user'] | undefined;
}

export function MobileMenu({ user }: MobileMenuProps) {
  const [open, setOpen] = useState(false);

  const closeSheet = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        }
      />
      <SheetContent side="right" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col space-y-4 mt-8">
          {/* Navigation Links */}
          <Link
            href="#services"
            className="text-lg font-medium text-foreground/80 hover:text-foreground transition-colors"
            onClick={closeSheet}
          >
            Services
          </Link>
          <Link
            href="#pricing"
            className="text-lg font-medium text-foreground/80 hover:text-foreground transition-colors"
            onClick={closeSheet}
          >
            Pricing
          </Link>
          <Link
            href="#faq"
            className="text-lg font-medium text-foreground/80 hover:text-foreground transition-colors"
            onClick={closeSheet}
          >
            FAQ
          </Link>

          {/* Auth Buttons */}
          <div className="flex flex-col space-y-2 pt-4 border-t">
            {user ? (
              <Link href="/dashboard" onClick={closeSheet}>
                <Button className="w-full">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login" onClick={closeSheet}>
                  <Button variant="ghost" className="w-full">
                    Login
                  </Button>
                </Link>
                <Link href="/signup" onClick={closeSheet}>
                  <Button className="w-full">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
