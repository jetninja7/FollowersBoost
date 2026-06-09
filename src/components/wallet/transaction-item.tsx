import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  PlusCircleIcon,
  MinusCircleIcon,
  ArrowLeftRightIcon,
  WalletIcon,
} from 'lucide-react';

type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'ORDER_PAYMENT' | 'REFUND';
type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface TransactionItemProps {
  transaction: {
    id: string;
    type: TransactionType;
    amount: number | string;
    status: TransactionStatus;
    paymentMethod?: string;
    createdAt: Date | string;
  };
}

function getTransactionIcon(type: TransactionType) {
  switch (type) {
    case 'DEPOSIT':
      return PlusCircleIcon;
    case 'ORDER_PAYMENT':
      return MinusCircleIcon;
    case 'REFUND':
      return ArrowLeftRightIcon;
    case 'WITHDRAWAL':
      return MinusCircleIcon;
    default:
      return WalletIcon;
  }
}

function getTransactionColor(type: TransactionType): string {
  switch (type) {
    case 'DEPOSIT':
      return 'text-green-600 dark:text-green-400';
    case 'ORDER_PAYMENT':
    case 'WITHDRAWAL':
      return 'text-red-600 dark:text-red-400';
    case 'REFUND':
      return 'text-blue-600 dark:text-blue-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
}

function formatTransactionAmount(type: TransactionType, amount: number): string {
  const sign =
    type === 'ORDER_PAYMENT' || type === 'WITHDRAWAL' ? '-' : '+';
  return `${sign}$${amount.toFixed(2)}`;
}

function getTransactionDescription(type: TransactionType): string {
  switch (type) {
    case 'DEPOSIT':
      return 'Wallet deposit';
    case 'ORDER_PAYMENT':
      return 'Order payment';
    case 'REFUND':
      return 'Order refund';
    case 'WITHDRAWAL':
      return 'Withdrawal';
    default:
      return 'Transaction';
  }
}

function getStatusColor(status: TransactionStatus): string {
  switch (status) {
    case 'PENDING':
      return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800';
    case 'COMPLETED':
      return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900';
    case 'FAILED':
      return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900';
    case 'CANCELLED':
      return 'text-gray-600 bg-gray-50 border-gray-300 dark:text-gray-400 dark:bg-gray-950 dark:border-gray-800';
    default:
      return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800';
  }
}

function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function formatAbsoluteTime(date: Date | string): string {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Transaction Item Component
 * Displays a single transaction with icon, status badge, and amount
 */
export function TransactionItem({ transaction }: TransactionItemProps) {
  const Icon = getTransactionIcon(transaction.type);
  const amountValue =
    typeof transaction.amount === 'string'
      ? parseFloat(transaction.amount)
      : transaction.amount;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          {/* Icon */}
          <div
            className={`flex items-center justify-center size-10 rounded-full bg-opacity-10 ${
              transaction.type === 'DEPOSIT'
                ? 'bg-green-100 dark:bg-green-900/30'
                : transaction.type === 'REFUND'
                ? 'bg-blue-100 dark:bg-blue-900/30'
                : 'bg-red-100 dark:bg-red-900/30'
            }`}
          >
            <Icon
              className={`size-5 ${getTransactionColor(transaction.type)}`}
            />
          </div>

          {/* Details */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {getTransactionDescription(transaction.type)}
              </p>
              <Badge className={getStatusColor(transaction.status)}>
                {transaction.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span title={formatAbsoluteTime(transaction.createdAt)}>
                {formatRelativeTime(transaction.createdAt)}
              </span>
              {transaction.paymentMethod && (
                <>
                  <span>•</span>
                  <span className="capitalize">
                    {transaction.paymentMethod.toLowerCase()}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Amount */}
        <div className="text-right">
          <p
            className={`text-lg font-semibold ${getTransactionColor(
              transaction.type
            )}`}
          >
            {formatTransactionAmount(transaction.type, amountValue)}
          </p>
        </div>
      </div>
    </Card>
  );
}
