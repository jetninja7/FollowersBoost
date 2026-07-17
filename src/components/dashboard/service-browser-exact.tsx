'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Service {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  minQuantity: number;
  maxQuantity: number;
  estimatedDeliveryTime: string;
  categoryName: string;
  platformName: string;
  platformIcon: string;
  platformSlug: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  services: Service[];
}

interface Platform {
  id: string;
  name: string;
  slug: string;
  icon: string;
  categories: Category[];
}

interface ServiceBrowserExactProps {
  platforms: Platform[];
}

// Platform icon mapping (using emojis as fallback)
const getPlatformEmoji = (name: string) => {
  const map: Record<string, string> = {
    instagram: '📷',
    facebook: '👥',
    twitter: '🐦',
    youtube: '▶️',
    tiktok: '🎵',
    telegram: '✈️',
    linkedin: '💼',
    spotify: '🎵',
    snapchat: '👻',
    pinterest: '📌',
    twitch: '🎮',
    whatsapp: '💬',
    kick: '⚡',
  };
  return map[name.toLowerCase()] || '📱';
};

export function ServiceBrowserExact({ platforms }: ServiceBrowserExactProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [hoveredService, setHoveredService] = useState<string | null>(null);

  // Flatten all services with platform info
  const allServices: Service[] = platforms.flatMap(platform =>
    platform.categories.flatMap(category =>
      category.services.map(service => ({
        ...service,
        categoryName: category.name,
        platformName: platform.name,
        platformIcon: platform.icon,
        platformSlug: platform.slug,
      }))
    )
  );

  // Filter services based on search and platform
  const filteredServices = allServices.filter(service => {
    const matchesPlatform = selectedPlatform === 'all' || service.platformSlug === selectedPlatform;
    const matchesSearch = searchQuery.length === 0 ||
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.platformName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPlatform && matchesSearch;
  });

  // Group by platform and category for display
  const groupedServices = filteredServices.reduce((acc, service) => {
    const key = `${service.platformSlug}-${service.categoryName}`;
    if (!acc[key]) {
      acc[key] = {
        platformName: service.platformName,
        platformIcon: service.platformIcon,
        categoryName: service.categoryName,
        services: [],
      };
    }
    acc[key].services.push(service);
    return acc;
  }, {} as Record<string, any>);

  return (
    <div className="space-y-6">
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/dashboard/orders"
          className="flex items-center justify-center gap-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl p-4 font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <span className="text-2xl">🛒</span>
          <span>My Orders</span>
        </Link>
        <Link
          href="/dashboard/wallet"
          className="flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl p-4 font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <span className="text-2xl">💳</span>
          <span>Add Funds</span>
        </Link>
      </div>

      {/* Platform Filter Buttons - Horizontal Scroll */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setSelectedPlatform('all')}
          className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full border-2 font-medium transition-all ${
            selectedPlatform === 'all'
              ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
              : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50'
          }`}
        >
          <span className="text-base">☰</span>
          <span className="text-sm font-semibold">All Platforms</span>
        </button>
        {platforms.map((platform) => (
          <button
            key={platform.id}
            onClick={() => setSelectedPlatform(platform.slug)}
            className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full border-2 font-medium transition-all ${
              selectedPlatform === platform.slug
                ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50'
            }`}
          >
            <span className="text-base">{platform.icon}</span>
            <span className="text-sm font-semibold">{platform.name}</span>
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-400 focus:outline-none bg-gray-50"
        />
      </div>

      {/* Services List - Clean Flat Layout */}
      <div className="space-y-3">
        {Object.entries(groupedServices).map(([key, group]) => (
          <div key={key} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            {/* Category Header */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-3.5 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{group.platformIcon}</span>
                <span className="font-bold text-gray-900 text-lg">
                  {group.platformName}
                </span>
                <span className="font-semibold text-gray-700">
                  {group.categoryName}
                </span>
                <span className="text-sm text-gray-500 ml-auto">
                  {group.services.length} services
                </span>
              </div>
            </div>

            {/* Services - Clean Flat List */}
            <div>
              {group.services.map((service: Service) => (
                <Link
                  key={service.id}
                  href={`/dashboard/order/${service.id}`}
                  onMouseEnter={() => setHoveredService(service.id)}
                  onMouseLeave={() => setHoveredService(null)}
                  className={`flex items-center gap-4 px-5 py-4 border-b border-gray-100 last:border-b-0 transition-all duration-150 ${
                    hoveredService === service.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Platform Icon Badge */}
                  <div className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg ${
                    hoveredService === service.id ? 'bg-white/20' : 'bg-gray-100'
                  }`}>
                    <span className="text-xl">{group.platformIcon}</span>
                  </div>

                  {/* Service Info */}
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold text-base mb-1 ${
                      hoveredService === service.id ? 'text-white' : 'text-gray-900'
                    }`}>
                      {service.name}
                    </div>
                    <div className={`text-sm flex items-center gap-2 ${
                      hoveredService === service.id ? 'text-blue-50' : 'text-gray-600'
                    }`}>
                      <span>⏱️</span>
                      <span>Start: {service.estimatedDeliveryTime}</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex-shrink-0 text-right">
                    <div className={`font-bold text-lg ${
                      hoveredService === service.id ? 'text-white' : 'text-blue-600'
                    }`}>
                      ${service.price}
                    </div>
                    <div className={`text-xs mt-0.5 ${
                      hoveredService === service.id ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      per {service.minQuantity}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredServices.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">No services found</p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
            >
              Clear search
            </button>
          )}
        </div>
      )}
    </div>
  );
}
