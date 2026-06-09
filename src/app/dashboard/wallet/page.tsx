'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PaymentModal } from '@/components/checkout/payment-modal';
import {
  PlusCircleIcon,
  MinusCircleIcon,
  ArrowLeftRightIcon,
  WalletIcon,
} from 'lucide-react';
import { toast } from 'sonner';

type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'ORDER_PAYMENT' | 'REFUND';
type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
type PaymentMethod = 'STRIPE' | 'PAYPAL';

interface Transaction {
  id: string;
  walletId: string;
  type: TransactionType;
  amount: number | string;
  status: TransactionStatus;
  paymentMethod?: PaymentMethod;
  paymentIntentId?: string;
  createdAt: string | Date;
}

interface TransactionsResponse {
  data: Transaction[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface BalanceResponse {
  data: {
    balance: number | string;
    currency: string;
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

export default function WalletPage() {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [balanceLoading, setBalanceLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);

  useEffect(() => {
    fetchBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType, currentPage]);

  const fetchBalance = async () => {
    try {
      setBalanceLoading(true);
      const response = await fetch('/api/wallet/balance');

      if (!response.ok) {
        throw new Error('Failed to fetch balance');
      }

      const data: BalanceResponse = await response.json();
      const balanceValue =
        typeof data.data.balance === 'string'
          ? parseFloat(data.data.balance)
          : data.data.balance;
      setBalance(balanceValue);
    } catch (err) {
      console.error('Error fetching balance:', err);
      toast.error('Failed to load balance');
    } finally {
      setBalanceLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
      });

      if (selectedType !== 'all') {
        params.set('type', selectedType);
      }

      const response = await fetch(`/api/wallet/transactions?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data: TransactionsResponse = await response.json();
      setTransactions(data.data);
      setTotalPages(data.meta.totalPages);
      setTotal(data.meta.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (amount: number) => {
    toast.success(`Successfully added $${amount.toFixed(2)}`, {
      description: 'Your wallet has been updated',
    });
    // Refetch balance and transactions
    await fetchBalance();
    setCurrentPage(1); // Reset to first page
    await fetchTransactions();
    setShowPaymentModal(false);
  };

  const handleTypeChange = (value: string) => {
    setSelectedType(value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Wallet
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your balance and transactions
        </p>
      </div>

      {/* Balance Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <WalletIcon className="size-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Available Balance
              </h2>
            </div>
            {balanceLoading ? (
              <Skeleton className="h-10 w-32" />
            ) : (
              <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                ${balance.toFixed(2)} USD
              </p>
            )}
          </div>
          <Button
            size="lg"
            onClick={() => setShowPaymentModal(true)}
            className="px-6"
          >
            <PlusCircleIcon className="size-4 mr-2" />
            Add Funds
          </Button>
        </div>
      </Card>

      {/* Transaction History Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Transaction History
        </h2>

        {/* Type Filter Tabs */}
        <Tabs value={selectedType} onValueChange={handleTypeChange}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="DEPOSIT">Deposits</TabsTrigger>
            <TabsTrigger value="ORDER_PAYMENT">Order Payments</TabsTrigger>
            <TabsTrigger value="REFUND">Refunds</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedType} className="mt-4">
            {/* Loading State */}
            {loading && (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <Skeleton className="size-10 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <Card className="p-6">
                <div className="text-center">
                  <p className="text-red-600 dark:text-red-400">{error}</p>
                  <Button
                    onClick={fetchTransactions}
                    className="mt-4"
                    variant="outline"
                  >
                    Try Again
                  </Button>
                </div>
              </Card>
            )}

            {/* Empty State */}
            {!loading && !error && transactions.length === 0 && (
              <Card className="p-12">
                <div className="text-center space-y-4">
                  <WalletIcon className="size-12 mx-auto text-gray-400" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    No transactions yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Add funds to get started
                  </p>
                  <Button onClick={() => setShowPaymentModal(true)}>
                    <PlusCircleIcon className="size-4 mr-2" />
                    Add Funds
                  </Button>
                </div>
              </Card>
            )}

            {/* Transaction List */}
            {!loading && !error && transactions.length > 0 && (
              <div className="space-y-3">
                {transactions.map((transaction) => {
                  const Icon = getTransactionIcon(transaction.type);
                  const amountValue =
                    typeof transaction.amount === 'string'
                      ? parseFloat(transaction.amount)
                      : transaction.amount;

                  return (
                    <Card key={transaction.id} className="p-4">
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
                              className={`size-5 ${getTransactionColor(
                                transaction.type
                              )}`}
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
                              <span
                                title={formatAbsoluteTime(transaction.createdAt)}
                              >
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
                            {formatTransactionAmount(
                              transaction.type,
                              amountValue
                            )}
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Pagination */}
        {!loading && !error && transactions.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between border-t pt-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Page {currentPage} of {totalPages} ({total} total transactions)
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
