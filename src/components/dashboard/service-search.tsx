'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useDebounce } from '@/lib/hooks/use-debounce';

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  categoryName: string;
  platformSlug: string;
}

export function ServiceSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Record<string, SearchResult[]>>({});
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    async function searchServices() {
      if (debouncedQuery.length < 2) {
        setResults({});
        setShowResults(false);
        return;
      }

      setIsSearching(true);

      try {
        const response = await fetch(
          `/api/services/search?q=${encodeURIComponent(debouncedQuery)}&limit=10`
        );
        const data = await response.json();
        setResults(data.data || {});
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }

    searchServices();
  }, [debouncedQuery]);

  const handleResultClick = (slug: string) => {
    router.push(`/dashboard/service/${slug}`);
    setQuery('');
    setShowResults(false);
  };

  const totalResults = Object.values(results).reduce(
    (acc, arr) => acc + arr.length,
    0
  );

  return (
    <div className="relative max-w-2xl">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
      <Input
        type="search"
        placeholder="Search services..."
        className="pl-10"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.length >= 2 && setShowResults(true)}
        onBlur={() => setTimeout(() => setShowResults(false), 200)}
      />

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute z-50 w-full mt-2 bg-white border rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {isSearching ? (
            <div className="p-4 text-center text-sm text-gray-500">
              Searching...
            </div>
          ) : totalResults === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              No services found
            </div>
          ) : (
            <div className="py-2">
              {Object.entries(results).map(([platform, services]) => (
                <div key={platform} className="mb-2 last:mb-0">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50">
                    {platform}
                  </div>
                  {services.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => handleResultClick(service.slug)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{service.name}</p>
                          <p className="text-xs text-gray-500">{service.categoryName}</p>
                        </div>
                        <p className="text-sm font-semibold text-blue-600">
                          ${Number(service.price).toFixed(2)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
