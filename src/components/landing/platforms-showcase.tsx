import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, CheckCircle } from 'lucide-react';

const platforms = [
  {
    name: 'Instagram',
    icon: '📷',
    gradient: 'from-purple-500 to-pink-500',
    services: ['Followers', 'Likes', 'Views', 'Comments'],
    slug: 'instagram',
  },
  {
    name: 'Facebook',
    icon: '👍',
    gradient: 'from-blue-600 to-blue-400',
    services: ['Page Likes', 'Post Likes', 'Followers', 'Shares'],
    slug: 'facebook',
  },
  {
    name: 'Twitter/X',
    icon: '🐦',
    gradient: 'from-sky-500 to-blue-600',
    services: ['Followers', 'Likes', 'Retweets', 'Views'],
    slug: 'twitter',
  },
  {
    name: 'YouTube',
    icon: '▶️',
    gradient: 'from-red-600 to-red-500',
    services: ['Subscribers', 'Views', 'Likes', 'Comments'],
    slug: 'youtube',
  },
  {
    name: 'TikTok',
    icon: '🎵',
    gradient: 'from-gray-900 to-pink-600',
    services: ['Followers', 'Likes', 'Views', 'Shares'],
    slug: 'tiktok',
  },
  {
    name: 'LinkedIn',
    icon: '💼',
    gradient: 'from-blue-700 to-blue-500',
    services: ['Connections', 'Followers', 'Post Likes', 'Shares'],
    slug: 'linkedin',
  },
];

export function PlatformsShowcase() {
  return (
    <section className="py-20 bg-gray-50" id="services">
      <div className="container px-4 mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            All Major Platforms Supported
          </h2>
          <p className="text-xl text-gray-600">
            Boost your presence across 10+ social media platforms with our premium services
          </p>
        </div>

        {/* Platforms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {platforms.map((platform) => (
            <Card
              key={platform.slug}
              className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-blue-500 cursor-pointer"
            >
              <CardContent className="p-6">
                <Link href={`/dashboard/services/${platform.slug}`}>
                  <div className="space-y-4">
                    {/* Platform Header */}
                    <div className="flex items-center gap-4">
                      <div
                        className={`text-5xl p-4 rounded-2xl bg-gradient-to-br ${platform.gradient} shadow-lg`}
                      >
                        {platform.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {platform.name}
                        </h3>
                        <p className="text-sm text-gray-500">{platform.services.length} Services</p>
                      </div>
                    </div>

                    {/* Services List */}
                    <div className="space-y-2">
                      {platform.services.map((service) => (
                        <div key={service} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>{service}</span>
                        </div>
                      ))}
                    </div>

                    {/* View Button */}
                    <Button
                      variant="ghost"
                      className="w-full group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors"
                    >
                      View Services
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/signup">
            <Button size="lg" className="text-lg px-8 py-6">
              Get Started Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <p className="text-sm text-gray-500 mt-4">
            No credit card required • Instant access • 24/7 support
          </p>
        </div>
      </div>
    </section>
  );
}
