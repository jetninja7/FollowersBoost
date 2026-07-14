import { Star, Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Influencer',
    avatar: '👩‍💼',
    rating: 5,
    text: 'FollowersBoost helped me grow from 5K to 50K followers in just 3 months! The quality is amazing and delivery is super fast.',
    platform: 'Instagram',
  },
  {
    name: 'Michael Chen',
    role: 'Business Owner',
    avatar: '👨‍💼',
    rating: 5,
    text: 'Best SMM panel I\'ve used. Customer support is excellent and prices are unbeatable. Highly recommended for anyone serious about growth.',
    platform: 'Facebook',
  },
  {
    name: 'Emily Rodriguez',
    role: 'Content Creator',
    avatar: '👩‍🎨',
    rating: 5,
    text: 'I was skeptical at first, but the results speak for themselves. Real engagement from real accounts. This is the real deal!',
    platform: 'TikTok',
  },
  {
    name: 'David Miller',
    role: 'YouTuber',
    avatar: '👨‍🎤',
    rating: 5,
    text: 'My channel finally took off after using FollowersBoost. Views and subscribers increased dramatically. Worth every penny!',
    platform: 'YouTube',
  },
  {
    name: 'Lisa Anderson',
    role: 'Entrepreneur',
    avatar: '👩‍💻',
    rating: 5,
    text: 'Professional service with instant delivery. My LinkedIn presence has grown significantly, leading to more business opportunities.',
    platform: 'LinkedIn',
  },
  {
    name: 'James Wilson',
    role: 'Digital Marketer',
    avatar: '👨‍🔬',
    rating: 5,
    text: 'I manage multiple clients and FollowersBoost is my go-to solution. Reliable, fast, and affordable. Can\'t ask for more!',
    platform: 'Twitter',
  },
];

export function TestimonialsModern() {
  return (
    <section className="py-20 bg-white">
      <div className="container px-4 mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Loved by Thousands
          </h2>
          <p className="text-xl text-gray-600">
            Don't just take our word for it - hear from our satisfied customers
          </p>

          {/* Overall Rating */}
          <div className="mt-8 inline-flex items-center gap-4 px-6 py-3 bg-yellow-50 rounded-full border-2 border-yellow-200">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="font-bold text-gray-900">4.9/5</span>
            <span className="text-gray-600">from 10,000+ reviews</span>
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="hover:shadow-xl transition-shadow border-2">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Quote Icon */}
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Quote className="w-6 h-6 text-blue-600" />
                  </div>

                  {/* Rating */}
                  <div className="flex gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>

                  {/* Text */}
                  <p className="text-gray-700 leading-relaxed">"{testimonial.text}"</p>

                  {/* Author */}
                  <div className="flex items-center gap-3 pt-4 border-t">
                    <div className="text-3xl">{testimonial.avatar}</div>
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-500">{testimonial.role}</div>
                    </div>
                  </div>

                  {/* Platform Badge */}
                  <div className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full">
                    {testimonial.platform}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
