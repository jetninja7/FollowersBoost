import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section className="relative py-12 md:py-20 lg:py-28">
      <div className="container px-4 mx-auto">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary">
            <Sparkles className="size-4" />
            Trusted by 10,000+ customers
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            Boost Your Social Media{" "}
            <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Presence
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Get real followers, likes, and engagement across all major platforms.
            Fast, reliable, and affordable social media growth services.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="w-full sm:w-auto">
              <Button size="lg" className="w-full">
                Get Started
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
            <Link href="#services" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full">
                View Services
              </Button>
            </Link>
          </div>

          {/* Stats Display */}
          <div className="mt-12 pt-8 border-t border-border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-br from-primary to-purple-600 bg-clip-text text-transparent">
                  10+
                </div>
                <div className="text-sm md:text-base text-muted-foreground">
                  Platforms
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-br from-primary to-purple-600 bg-clip-text text-transparent">
                  24/7
                </div>
                <div className="text-sm md:text-base text-muted-foreground">
                  Support
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-br from-primary to-purple-600 bg-clip-text text-transparent">
                  Fast
                </div>
                <div className="text-sm md:text-base text-muted-foreground">
                  Delivery
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
