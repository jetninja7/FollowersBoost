import { Zap, Shield, Clock, HeadphonesIcon, TrendingUp, DollarSign } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Instant Delivery',
    description: 'Orders start processing within minutes. No waiting, no delays.',
    color: 'bg-yellow-100 text-yellow-600',
  },
  {
    icon: Shield,
    title: '100% Safe & Secure',
    description: 'SSL encrypted payments. Your data is protected with bank-level security.',
    color: 'bg-green-100 text-green-600',
  },
  {
    icon: Clock,
    title: '24/7 Availability',
    description: 'Place orders anytime, anywhere. Our system never sleeps.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: HeadphonesIcon,
    title: 'Premium Support',
    description: 'Expert support team ready to help you via live chat and email.',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    icon: TrendingUp,
    title: 'Real Growth',
    description: 'High-quality followers and engagement from real, active accounts.',
    color: 'bg-pink-100 text-pink-600',
  },
  {
    icon: DollarSign,
    title: 'Best Prices',
    description: 'Competitive pricing with no hidden fees. Pay only for what you need.',
    color: 'bg-indigo-100 text-indigo-600',
  },
];

export function FeaturesModern() {
  return (
    <section className="py-20 bg-white">
      <div className="container px-4 mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Why Choose FollowersBoost?
          </h2>
          <p className="text-xl text-gray-600">
            The most trusted SMM panel with features designed for your success
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group p-8 rounded-2xl border-2 border-gray-100 hover:border-blue-500 hover:shadow-xl transition-all duration-300"
              >
                <div className="space-y-4">
                  <div className={`w-16 h-16 rounded-xl ${feature.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
