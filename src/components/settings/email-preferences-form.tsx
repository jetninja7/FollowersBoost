'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Bell, Mail, ShoppingCart, Wallet, Megaphone, Newspaper } from 'lucide-react';

interface EmailPreferencesFormProps {
  initialPreferences: {
    orderUpdates: boolean;
    orderCompleted: boolean;
    orderFailed: boolean;
    walletUpdates: boolean;
    promotional: boolean;
    newsletter: boolean;
    unsubscribedAll: boolean;
  };
}

export function EmailPreferencesForm({ initialPreferences }: EmailPreferencesFormProps) {
  const [preferences, setPreferences] = useState(initialPreferences);
  const [saving, setSaving] = useState(false);

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
      // If unsubscribing from all, turn off all other preferences
      ...(key === 'unsubscribedAll' && !prev.unsubscribedAll
        ? {
            orderUpdates: false,
            orderCompleted: false,
            orderFailed: false,
            walletUpdates: false,
            promotional: false,
            newsletter: false,
          }
        : {}),
      // If enabling any preference, turn off unsubscribedAll
      ...(key !== 'unsubscribedAll' && !prev[key]
        ? { unsubscribedAll: false }
        : {}),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/settings/email-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to save preferences');
      }

      toast.success('Email preferences updated successfully');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast.error('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const preferenceItems = [
    {
      key: 'orderUpdates' as const,
      icon: ShoppingCart,
      title: 'Order Updates',
      description: 'Receive notifications when your order status changes',
      disabled: preferences.unsubscribedAll,
    },
    {
      key: 'orderCompleted' as const,
      icon: Bell,
      title: 'Order Completion',
      description: 'Get notified when your orders are successfully completed',
      disabled: preferences.unsubscribedAll,
    },
    {
      key: 'orderFailed' as const,
      icon: Mail,
      title: 'Order Issues',
      description: 'Receive alerts if an order fails or needs attention',
      disabled: preferences.unsubscribedAll,
    },
    {
      key: 'walletUpdates' as const,
      icon: Wallet,
      title: 'Wallet Notifications',
      description: 'Get notified about deposits, withdrawals, and balance changes',
      disabled: preferences.unsubscribedAll,
    },
    {
      key: 'promotional' as const,
      icon: Megaphone,
      title: 'Promotional Emails',
      description: 'Receive special offers, discounts, and promotional campaigns',
      disabled: preferences.unsubscribedAll,
    },
    {
      key: 'newsletter' as const,
      icon: Newspaper,
      title: 'Newsletter',
      description: 'Get product updates, tips, and platform news',
      disabled: preferences.unsubscribedAll,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Unsubscribe All Option */}
      <div className="pb-6 border-b">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Unsubscribe from All Emails
            </h3>
            <p className="text-sm text-gray-600">
              Stop receiving all marketing and transactional emails. You can resubscribe anytime.
            </p>
          </div>
          <button
            onClick={() => handleToggle('unsubscribedAll')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              preferences.unsubscribedAll ? 'bg-red-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                preferences.unsubscribedAll ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Individual Preferences */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Email Categories
        </h3>
        {preferenceItems.map(item => {
          const Icon = item.icon;
          return (
            <div
              key={item.key}
              className={`flex items-start justify-between p-4 rounded-lg border ${
                item.disabled ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-start gap-3 flex-1">
                <div
                  className={`p-2 rounded-lg ${
                    item.disabled ? 'bg-gray-200' : 'bg-blue-50'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${
                      item.disabled ? 'text-gray-400' : 'text-blue-600'
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <h4
                    className={`font-medium ${
                      item.disabled ? 'text-gray-500' : 'text-gray-900'
                    }`}
                  >
                    {item.title}
                  </h4>
                  <p
                    className={`text-sm ${
                      item.disabled ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    {item.description}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleToggle(item.key)}
                disabled={item.disabled}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  item.disabled
                    ? 'bg-gray-200 cursor-not-allowed'
                    : preferences[item.key]
                    ? 'bg-green-600'
                    : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences[item.key] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>

      {/* Save Button */}
      <div className="pt-6 border-t">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}
