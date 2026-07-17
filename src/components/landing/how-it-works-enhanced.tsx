'use client';

import { UserPlus, Wallet, ShoppingBag, TrendingUp } from 'lucide-react';

const steps = [
  {
    number: 1,
    icon: UserPlus,
    title: 'Register & Log in',
    description: 'Begin with signing up and then log in to your account.',
    color: 'bg-blue-600',
  },
  {
    number: 2,
    icon: Wallet,
    title: 'Add funds',
    description: 'Add funds to your account using a preferred payment method.',
    color: 'bg-indigo-600',
  },
  {
    number: 3,
    icon: ShoppingBag,
    title: 'Place your orders',
    description: 'Select the services you need to help your business get more popular.',
    color: 'bg-purple-600',
  },
  {
    number: 4,
    icon: TrendingUp,
    title: 'Amazing results',
    description: "We'll inform you once your order is ready, enjoy your fantastic results!!",
    color: 'bg-pink-600',
  },
];

export function HowItWorksEnhanced() {
  return (
    <section className="relative py-24 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
      {/* Curved Top */}
      <div className="absolute top-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
          <path
            d="M0 0L60 10C120 20 240 40 360 45C480 50 600 40 720 35C840 30 960 30 1080 35C1200 40 1320 50 1380 55L1440 60V0H1380C1320 0 1200 0 1080 0C960 0 840 0 720 0C600 0 480 0 360 0C240 0 120 0 60 0H0Z"
            fill="white"
          />
        </svg>
      </div>

      <div className="container px-4 mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            How it works
          </h2>
          <p className="text-xl text-gray-600">
            Follow these 4 easy steps to learn how to use our panel.
          </p>
        </div>

        {/* Steps - Circular Flow */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-32 gap-y-16 items-center relative">
            {/* Step 1 - Top Left */}
            <div className="relative md:text-right">
              <div className="inline-block">
                <div className="flex flex-col items-center md:items-end gap-4">
                  <div className="w-24 h-24 bg-white rounded-full shadow-xl flex items-center justify-center border-4 border-blue-100">
                    <span className="text-3xl font-bold text-gray-900">{steps[0].number}</span>
                  </div>
                  <div className="space-y-2 max-w-sm">
                    <h3 className="text-2xl font-bold text-gray-900">{steps[0].title}</h3>
                    <p className="text-gray-600 leading-relaxed">
                      {steps[0].description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Arrow to Step 2 */}
              <svg className="hidden md:block absolute -right-16 top-1/4 w-32 h-32 text-blue-300" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M 0 32 Q 64 32 64 64" strokeLinecap="round"/>
                <path d="M 64 64 L 56 56 M 64 64 L 72 56" strokeLinecap="round"/>
              </svg>
            </div>

            {/* Step 2 - Top Right */}
            <div className="relative">
              <div className="flex flex-col items-center md:items-start gap-4">
                <div className="w-24 h-24 bg-white rounded-full shadow-xl flex items-center justify-center border-4 border-indigo-100">
                  <span className="text-3xl font-bold text-gray-900">{steps[1].number}</span>
                </div>
                <div className="space-y-2 max-w-sm">
                  <h3 className="text-2xl font-bold text-gray-900">{steps[1].title}</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {steps[1].description}
                  </p>
                </div>
              </div>

              {/* Arrow to Step 3 */}
              <svg className="hidden md:block absolute -left-16 bottom-1/4 w-32 h-32 text-indigo-300" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M 64 0 Q 64 32 32 64" strokeLinecap="round"/>
                <path d="M 32 64 L 40 56 M 32 64 L 24 56" strokeLinecap="round"/>
              </svg>
            </div>

            {/* Step 3 - Bottom Right */}
            <div className="relative md:text-right md:order-3">
              <div className="inline-block">
                <div className="flex flex-col items-center md:items-end gap-4">
                  <div className="w-24 h-24 bg-white rounded-full shadow-xl flex items-center justify-center border-4 border-purple-100">
                    <span className="text-3xl font-bold text-gray-900">{steps[2].number}</span>
                  </div>
                  <div className="space-y-2 max-w-sm">
                    <h3 className="text-2xl font-bold text-gray-900">{steps[2].title}</h3>
                    <p className="text-gray-600 leading-relaxed">
                      {steps[2].description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Arrow to Step 4 */}
              <svg className="hidden md:block absolute -right-16 bottom-1/4 w-32 h-32 text-purple-300" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M 0 64 Q 32 64 64 32" strokeLinecap="round"/>
                <path d="M 64 32 L 56 40 M 64 32 L 72 40" strokeLinecap="round"/>
              </svg>
            </div>

            {/* Step 4 - Bottom Left */}
            <div className="relative md:order-4">
              <div className="flex flex-col items-center md:items-start gap-4">
                <div className="w-24 h-24 bg-white rounded-full shadow-xl flex items-center justify-center border-4 border-pink-100">
                  <span className="text-3xl font-bold text-gray-900">{steps[3].number}</span>
                </div>
                <div className="space-y-2 max-w-sm">
                  <h3 className="text-2xl font-bold text-gray-900">{steps[3].title}</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {steps[3].description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Curved Bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
          <path
            d="M0 120L60 110C120 100 240 80 360 75C480 70 600 80 720 85C840 90 960 90 1080 85C1200 80 1320 70 1380 65L1440 60V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}
