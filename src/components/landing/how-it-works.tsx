import { UserPlus, CreditCard, Rocket, CheckCircle2 } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: UserPlus,
    title: 'Create Account',
    description: 'Sign up in seconds with just your email. No credit card required to start.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    number: '02',
    icon: CreditCard,
    title: 'Add Funds',
    description: 'Deposit funds securely using your preferred payment method. Multiple options available.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    number: '03',
    icon: Rocket,
    title: 'Place Order',
    description: 'Choose your service, enter details, and submit. Orders start instantly!',
    color: 'from-orange-500 to-red-500',
  },
  {
    number: '04',
    icon: CheckCircle2,
    title: 'Watch Growth',
    description: 'Track your order in real-time. Delivery typically completes within hours.',
    color: 'from-green-500 to-emerald-500',
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container px-4 mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600">
            Get started in 4 simple steps and see results within hours
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative">
                {/* Connection Line (except last item) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/4 left-full w-full h-0.5 bg-gradient-to-r from-gray-300 to-transparent -z-10"></div>
                )}

                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-blue-500">
                  <div className="space-y-4">
                    {/* Step Number */}
                    <div className="text-6xl font-bold text-gray-100">{step.number}</div>

                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-2xl font-semibold text-gray-900 mb-4">
            Ready to grow your social media?
          </p>
          <p className="text-gray-600">
            Join thousands of satisfied customers who trust FollowersBoost
          </p>
        </div>
      </div>
    </section>
  );
}
