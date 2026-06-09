'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { NotificationItem } from './notification-item';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: {
    orderId?: string;
  };
  createdAt: string;
}

interface NotificationPopoverProps {
  onClose: () => void;
  onNotificationRead: () => void;
}

export function NotificationPopover({ onClose, onNotificationRead }: NotificationPopoverProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications?limit=5');
      const data = await response.json();
      setNotifications(data.notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
      });
      onNotificationRead();
      onClose();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      });
      onNotificationRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  if (loading) {
    return (
      <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
        <div className="p-8 text-center text-gray-500">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[600px] flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Notifications</h3>
        {notifications.some(n => !n.isRead) && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="overflow-y-auto flex-1">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No notifications yet
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() => markAsRead(notification.id)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200">
        <Link
          href="/dashboard/notifications"
          className="block text-center text-sm text-blue-600 hover:text-blue-700"
          onClick={onClose}
        >
          View all notifications
        </Link>
      </div>
    </div>
  );
}
