'use client';

import { useState } from 'react';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Service {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  minQuantity: number;
  maxQuantity: number;
  estimatedDeliveryTime: string;
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

interface ServiceBrowserEnhancedProps {
  platforms: Platform[];
}

export function ServiceBrowserEnhanced({ platforms }: ServiceBrowserEnhancedProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Toggle service expansion
  const toggleService = (serviceId: string) => {
    const newExpanded = new Set(expandedServices);
    if (newExpanded.has(serviceId)) {
      newExpanded.delete(serviceId);
    } else {
      newExpanded.add(serviceId);
    }
    setExpandedServices(newExpanded);
  };

  // Filter platforms based on selection
  const filteredPlatforms = selectedPlatform === 'all'
    ? platforms
    : platforms.filter(p => p.slug === selectedPlatform);

  // Search across all services
  const searchResults = searchQuery.length > 0
    ? platforms.flatMap(platform =>
        platform.categories.flatMap(category =>
          category.services
            .filter(service =>
              service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              platform.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map(service => ({
              ...service,
              platformName: platform.name,
              platformSlug: platform.slug,
              categoryName: category.name,
            }))
        )
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/dashboard/orders"
          className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white rounded-lg p-4 font-semibold transition-colors"
        >
          🛒 My Orders
        </Link>
        <Link
          href="/dashboard/wallet"
          className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white rounded-lg p-4 font-semibold transition-colors"
        >
          💳 Add Funds
        </Link>
      </div>

      {/* Platform Filter Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => setSelectedPlatform('all')}
          className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 font-medium transition-colors ${
            selectedPlatform === 'all'
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
          }`}
        >
          ☰ All
        </button>
        {platforms.slice(0, 7).map((platform) => (
          <button
            key={platform.id}
            onClick={() => setSelectedPlatform(platform.slug)}
            className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 font-medium transition-colors ${
              selectedPlatform === platform.slug
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
            }`}
          >
            <span className="text-lg">{platform.icon}</span>
            <span className="hidden sm:inline">{platform.name}</span>
          </button>
        ))}
      </div>

      {/* Search Bar with Dropdown */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Search Dropdown */}
        {searchQuery.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-96 overflow-y-auto">
            {searchResults.length > 0 ? (
              <div className="divide-y">
                {searchResults.map((result) => (
                  <Link
                    key={result.id}
                    href={`/dashboard/order/${result.id}`}
                    className="block p-4 hover:bg-gray-50 transition-colors"
                    onClick={() => setSearchQuery('')}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-gray-900">{result.name}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {result.platformName} → {result.categoryName}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {result.description.substring(0, 80)}...
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="font-bold text-blue-600">${result.price}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {result.estimatedDeliveryTime}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                No services found matching "{searchQuery}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category & Services Dropdowns */}
      <div className="space-y-4">
        {filteredPlatforms.map((platform) => (
          <div key={platform.id} className="space-y-2">
            {/* Platform Header (if not showing all) */}
            {selectedPlatform !== 'all' && (
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{platform.icon}</span>
                <h2 className="text-2xl font-bold text-gray-900">{platform.name}</h2>
              </div>
            )}

            {platform.categories.map((category) => (
              <div key={category.id} className="border-2 border-gray-200 rounded-lg overflow-hidden">
                {/* Category Header (Dropdown) */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{platform.icon}</span>
                    <span className="font-semibold text-gray-900">
                      {selectedPlatform === 'all' ? `${platform.name} - ${category.name}` : category.name}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({category.services.length} services)
                    </span>
                  </div>
                  {expandedCategories.has(category.id) ? (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  )}
                </button>

                {/* Services List (when category expanded) */}
                {expandedCategories.has(category.id) && (
                  <div className="divide-y bg-white">
                    {category.services.map((service, index) => (
                      <div key={service.id}>
                        {/* Service Header (Dropdown) */}
                        <button
                          onClick={() => toggleService(service.id)}
                          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-700 rounded-lg font-bold">
                              {index + 1}
                            </span>
                            <div className="text-left">
                              <div className="font-medium text-gray-900">{service.name}</div>
                              <div className="text-sm text-gray-600">
                                Start: {service.estimatedDeliveryTime}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="font-bold text-blue-600">${service.price}</div>
                              <div className="text-xs text-gray-500">per {service.minQuantity}</div>
                            </div>
                            {expandedServices.has(service.id) ? (
                              <ChevronDown className="w-5 h-5 text-gray-600" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-gray-600" />
                            )}
                          </div>
                        </button>

                        {/* Service Details (when service expanded) */}
                        {expandedServices.has(service.id) && (
                          <div className="p-4 bg-gray-50 border-t">
                            <h4 className="font-semibold text-gray-900 mb-3">Description</h4>
                            <div className="space-y-2 text-sm text-gray-700 mb-4">
                              <p className="flex items-start gap-2">
                                <span className="text-green-600">✅</span>
                                <span>{service.description}</span>
                              </p>
                              <p className="flex items-start gap-2">
                                <span className="text-green-600">✅</span>
                                <span>Min: {service.minQuantity.toLocaleString()} - Max: {service.maxQuantity.toLocaleString()}</span>
                              </p>
                              <p className="flex items-start gap-2">
                                <span className="text-green-600">✅</span>
                                <span>Delivery: {service.estimatedDeliveryTime}</span>
                              </p>
                            </div>
                            <Link
                              href={`/dashboard/order/${service.id}`}
                              className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                            >
                              Order Now
                            </Link>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredPlatforms.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No services found</p>
        </div>
      )}
    </div>
  );
}
