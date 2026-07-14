'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

const platforms = [
  { id: 'all', name: 'All', icon: Menu, color: 'border-gray-300' },
  { id: 'instagram', name: 'Instagram', emoji: '📷', color: 'border-pink-500' },
  { id: 'youtube', name: 'YouTube', emoji: '▶️', color: 'border-red-500' },
  { id: 'telegram', name: 'Telegram', emoji: '✈️', color: 'border-blue-400' },
  { id: 'facebook', name: 'Facebook', emoji: '👍', color: 'border-blue-600' },
  { id: 'tiktok', name: 'TikTok', emoji: '🎵', color: 'border-gray-900' },
  { id: 'twitter', name: 'Twitter', emoji: '🐦', color: 'border-sky-500' },
  { id: 'linkedin', name: 'LinkedIn', emoji: '💼', color: 'border-blue-700' },
  { id: 'whatsapp', name: 'WhatsApp', emoji: '💬', color: 'border-green-500' },
  { id: 'kick', name: 'Kick', emoji: '🎮', color: 'border-lime-500' },
  { id: 'other', name: 'Other', emoji: '➕', color: 'border-gray-400' },
];

export function PlatformFilters() {
  const [selected, setSelected] = useState('all');

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
      {platforms.map((platform) => {
        const Icon = platform.icon;
        const isSelected = selected === platform.id;

        return (
          <Button
            key={platform.id}
            variant="outline"
            onClick={() => setSelected(platform.id)}
            className={`h-14 flex items-center justify-center gap-2 font-medium transition-all ${
              isSelected
                ? 'bg-blue-50 border-blue-500 text-blue-700 border-2'
                : `${platform.color} border-2 hover:border-blue-400`
            }`}
          >
            {platform.emoji ? (
              <span className="text-2xl">{platform.emoji}</span>
            ) : (
              Icon && <Icon className="w-5 h-5" />
            )}
            <span className="text-sm">{platform.name}</span>
          </Button>
        );
      })}
    </div>
  );
}
