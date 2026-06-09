'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

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

interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
}

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ORDER_UPDATE':
        return '📦';
      case 'PAYMENT_SUCCESS':
        return '✅';
      case 'PAYMENT_FAILED':
        return '❌';
      case 'SYSTEM_ALERT':
        return '🔔';
      default:
        return '📬';
    }
  };

  const content = (
    <div
      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
        !notification.isRead ? 'bg-blue-50' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0">
          {getNotificationIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900">
            {notification.title}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {notification.message}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </p>
        </div>
        {!notification.isRead && (
          <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></div>
        )}
      </div>
    </div>
  );

  if (notification.metadata?.orderId) {
    return (
      <Link href={`/dashboard/orders/${notification.metadata.orderId}`}>
        {content}
      </Link>
    );
  }

  return content;
}
