import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { HeroModern } from "@/components/landing/hero-modern";
import { PlatformsShowcase } from "@/components/landing/platforms-showcase";
import { FeaturesEnhanced } from "@/components/landing/features-enhanced";
import { HowItWorksEnhanced } from "@/components/landing/how-it-works-enhanced";
import { TestimonialsModern } from "@/components/landing/testimonials-modern";
import { FAQ } from "@/components/landing/faq";
import { CTAModern } from "@/components/landing/cta-modern";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1">
        <HeroModern />
        <PlatformsShowcase />
        <FeaturesEnhanced />
        <HowItWorksEnhanced />
        <TestimonialsModern />
        <FAQ />
        <CTAModern />
      </div>
      <Footer />
    </main>
  );
}
