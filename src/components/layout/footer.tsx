import Link from 'next/link';
import { MessageCircle, ThumbsUp, Camera, Video, Briefcase } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export function Footer() {
  return (
    <footer className="bg-background border-t">
      <div className="container px-4 py-12 mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* About Column */}
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              FollowersBoost
            </h3>
            <p className="text-sm text-muted-foreground">
              Grow your social media presence with real, engaged followers.
              Fast, secure, and reliable service since 2024.
            </p>
          </div>

          {/* Quick Links Column */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="#services"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Services
                </Link>
              </li>
              <li>
                <Link
                  href="#pricing"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="#faq"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="#contact"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Services Column */}
          <div>
            <h4 className="font-semibold mb-4">Services</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#services"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Instagram
                </Link>
              </li>
              <li>
                <Link
                  href="#services"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Facebook
                </Link>
              </li>
              <li>
                <Link
                  href="#services"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Twitter
                </Link>
              </li>
              <li>
                <Link
                  href="#services"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  YouTube
                </Link>
              </li>
              <li>
                <Link
                  href="#services"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  TikTok
                </Link>
              </li>
            </ul>
          </div>

          {/* Follow Us Column */}
          <div>
            <h4 className="font-semibold mb-4">Follow Us</h4>
            <div className="flex space-x-4">
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Twitter"
              >
                <MessageCircle className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Facebook"
              >
                <ThumbsUp className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Instagram"
              >
                <Camera className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="YouTube"
              >
                <Video className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="LinkedIn"
              >
                <Briefcase className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} FollowersBoost. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <Link
              href="#terms"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="#privacy"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
