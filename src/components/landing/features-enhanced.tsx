import { Award, CreditCard, DollarSign, Zap } from 'lucide-react';

const features = [
  {
    icon: Award,
    title: 'Prime quality',
    description: 'Enjoy excellent SMM services at amazing prices!!',
    iconBg: 'bg-gradient-to-br from-blue-100 to-blue-200',
    iconColor: 'text-blue-600',
  },
  {
    icon: CreditCard,
    title: 'Various payment options',
    description: 'You can add funds via any payment option we provide..',
    iconBg: 'bg-gradient-to-br from-green-100 to-green-200',
    iconColor: 'text-green-600',
  },
  {
    icon: DollarSign,
    title: 'Cheap services',
    description: 'We always make sure that our services are affordable..',
    iconBg: 'bg-gradient-to-br from-purple-100 to-purple-200',
    iconColor: 'text-purple-600',
  },
  {
    icon: Zap,
    title: 'Super fast delivery',
    description: 'You can rest assured that your orders will be delivered fast..',
    iconBg: 'bg-gradient-to-br from-orange-100 to-orange-200',
    iconColor: 'text-orange-600',
  },
];

export function FeaturesEnhanced() {
  return (
    <section className="py-20 bg-white">
      <div className="container px-4 mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Why order SMM services here?
          </h2>
          <p className="text-xl text-gray-600">
            Learn how you can benefit from ordering SMM services on our panel..
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-200 hover:-translate-y-2"
              >
                {/* Icon */}
                <div className={`w-20 h-20 ${feature.iconBg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`w-10 h-10 ${feature.iconColor}`} />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
