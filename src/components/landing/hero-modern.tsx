'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Users, Zap, Shield, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export function HeroModern() {
  const [orderCount, setOrderCount] = useState(45234);
  const [userCount, setUserCount] = useState(12847);

  // Animated counter effect
  useEffect(() => {
    const interval = setInterval(() => {
      setOrderCount((prev) => prev + Math.floor(Math.random() * 3));
      if (Math.random() > 0.7) {
        setUserCount((prev) => prev + 1);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-300 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-300 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="container relative px-4 mx-auto py-20 md:py-32">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="space-y-8 text-center md:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium border border-white/30">
                <Zap className="w-4 h-4 text-yellow-300" />
                #1 SMM Panel - Trusted Worldwide
              </div>

              {/* Headline */}
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight">
                  Grow Your
                  <span className="block bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
                    Social Media
                  </span>
                  Instantly
                </h1>
                <p className="text-xl md:text-2xl text-blue-100 leading-relaxed">
                  The most reliable SMM panel with instant delivery, premium quality, and unbeatable prices.
                </p>
              </div>

              {/* Features */}
              <div className="flex flex-col sm:flex-row gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-300" />
                  <span>Instant Start</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-300" />
                  <span>24/7 Support</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-300" />
                  <span>Secure Payment</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/signup" className="flex-1 sm:flex-none">
                  <Button size="lg" className="w-full sm:w-auto bg-white text-blue-600 hover:bg-blue-50 font-semibold text-lg px-8 py-6 shadow-xl">
                    Get Started Free
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="#services" className="flex-1 sm:flex-none">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto bg-transparent border-2 border-white text-white hover:bg-white/10 font-semibold text-lg px-8 py-6"
                  >
                    View Services
                  </Button>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center gap-6 text-sm pt-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-300" />
                  <span className="text-blue-100">SSL Secured</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-300" />
                  <span className="text-blue-100">{userCount.toLocaleString()}+ Users</span>
                </div>
              </div>
            </div>

            {/* Right Column - Stats Cards */}
            <div className="space-y-6">
              {/* Live Stats Card */}
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-green-500 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Live Statistics</h3>
                    <p className="text-sm text-blue-100">Real-time updates</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/10 rounded-xl">
                    <span className="text-blue-100">Orders Completed</span>
                    <span className="text-2xl font-bold">{orderCount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/10 rounded-xl">
                    <span className="text-blue-100">Active Users</span>
                    <span className="text-2xl font-bold">{userCount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/10 rounded-xl">
                    <span className="text-blue-100">Avg. Delivery</span>
                    <span className="text-2xl font-bold">&lt; 1h</span>
                  </div>
                </div>
              </div>

              {/* Quick Features */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6 text-center">
                  <div className="text-3xl font-bold mb-2">10+</div>
                  <div className="text-sm text-blue-100">Platforms</div>
                </div>
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6 text-center">
                  <div className="text-3xl font-bold mb-2">100K+</div>
                  <div className="text-sm text-blue-100">Services</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave Bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
          <path
            d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="white"
          />
        </svg>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </section>
  );
}
