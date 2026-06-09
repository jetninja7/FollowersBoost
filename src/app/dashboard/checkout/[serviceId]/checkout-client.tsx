'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { CheckoutStepper } from '@/components/checkout/checkout-stepper';
import { ConfigureStep } from '@/components/checkout/configure-step';
import { ReviewStep } from '@/components/checkout/review-step';
import { PaymentModal } from '@/components/checkout/payment-modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

interface Service {
  id: string;
  name: string;
  platform: string;
  price: number | { toNumber?: () => number };
  minQuantity: number;
  maxQuantity: number;
  deliveryTime: string;
}

interface OrderData {
  quantity: number;
  targetUrl: string;
  notes?: string;
}

interface CreatedOrder {
  id: string;
  status: string;
  totalPrice: number;
  quantity: number;
  targetUrl: string;
  notes?: string;
}

interface CheckoutPageClientProps {
  service: Service;
  userId: string;
}

export function CheckoutPageClient({ service, userId }: CheckoutPageClientProps) {
  const router = useRouter();

  // Current step state (1, 2, or 3)
  const [currentStep, setCurrentStep] = useState(1);

  // Order configuration data
  const [orderData, setOrderData] = useState<OrderData>({
    quantity: service.minQuantity,
    targetUrl: '',
    notes: '',
  });

  // Wallet balance
  const [walletBalance, setWalletBalance] = useState(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Created order
  const [createdOrder, setCreatedOrder] = useState<CreatedOrder | null>(null);

  // Order creation loading state
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  // Fetch wallet balance when moving to step 2
  useEffect(() => {
    if (currentStep === 2) {
      fetchWalletBalance();
    }
  }, [currentStep]);

  // Fetch wallet balance
  const fetchWalletBalance = async () => {
    setIsLoadingBalance(true);
    try {
      const response = await fetch('/api/wallet/balance');
      if (!response.ok) {
        throw new Error('Failed to fetch wallet balance');
      }
      const result = await response.json();
      const balance = typeof result.data.balance === 'number'
        ? result.data.balance
        : Number(result.data.balance);
      setWalletBalance(balance);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      toast.error('Failed to fetch wallet balance', {
        description: 'Please try again or contact support',
      });
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Handle Step 1 -> Step 2
  const handleConfigureNext = (data: OrderData) => {
    setOrderData(data);
    setCurrentStep(2);
  };

  // Handle Step 2 -> Step 1
  const handleReviewBack = () => {
    setCurrentStep(1);
  };

  // Handle order creation
  const createOrder = async () => {
    setIsCreatingOrder(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceId: service.id,
          quantity: orderData.quantity,
          targetUrl: orderData.targetUrl,
          notes: orderData.notes || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create order');
      }

      const result = await response.json();
      const order = result.data;

      // Transform order data
      setCreatedOrder({
        id: order.id,
        status: order.status,
        totalPrice: typeof order.totalPrice === 'number'
          ? order.totalPrice
          : Number(order.totalPrice),
        quantity: order.quantity,
        targetUrl: order.targetUrl,
        notes: order.notes,
      });

      // Show success toast
      toast.success('Order placed successfully!', {
        description: `Order #${order.id.substring(0, 8)} has been created`,
      });

      // Move to success step
      setCurrentStep(3);
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // Handle Step 2 -> Step 3 (or payment modal)
  const handleReviewNext = async () => {
    // Calculate total price
    const servicePrice = typeof service.price === 'number'
      ? service.price
      : service.price.toNumber?.() ?? 0;
    const totalPrice = orderData.quantity * servicePrice;

    // Check if balance is sufficient
    if (walletBalance >= totalPrice) {
      // Create order directly
      await createOrder();
    } else {
      // Open payment modal
      setShowPaymentModal(true);
    }
  };

  // Handle add funds button
  const handleAddFunds = () => {
    setShowPaymentModal(true);
  };

  // Handle payment success
  const handlePaymentSuccess = async (amount: number) => {
    // Refetch wallet balance
    await fetchWalletBalance();

    // Close payment modal
    setShowPaymentModal(false);

    // Create order
    await createOrder();
  };

  // Handle cancel in step 1
  const handleCancel = () => {
    router.push('/dashboard/services');
  };

  // Calculate total price for display
  const servicePrice = typeof service.price === 'number'
    ? service.price
    : service.price.toNumber?.() ?? 0;
  const totalPrice = orderData.quantity * servicePrice;

  return (
    <>
      {/* Checkout Stepper */}
      <CheckoutStepper currentStep={currentStep} />

      {/* Step Content */}
      {currentStep === 1 && (
        <ConfigureStep
          service={service}
          initialData={orderData}
          onNext={handleConfigureNext}
          onCancel={handleCancel}
        />
      )}

      {currentStep === 2 && (
        <>
          {isLoadingBalance ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <ReviewStep
              orderData={{
                service: {
                  name: service.name,
                  platform: service.platform,
                  price: service.price,
                  deliveryTime: service.deliveryTime,
                },
                quantity: orderData.quantity,
                targetUrl: orderData.targetUrl,
                notes: orderData.notes,
              }}
              walletBalance={walletBalance}
              onBack={handleReviewBack}
              onNext={handleReviewNext}
              onAddFunds={handleAddFunds}
            />
          )}
        </>
      )}

      {currentStep === 3 && createdOrder && (
        <div className="text-center py-12 space-y-6">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 dark:bg-green-950/20 p-4">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
          </div>

          {/* Success Message */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Order placed successfully!</h2>
            <p className="text-muted-foreground">
              Order ID: <span className="font-mono font-medium">{createdOrder.id.substring(0, 8).toUpperCase()}</span>
            </p>
          </div>

          {/* Order Summary Card */}
          <Card className="max-w-md mx-auto text-left">
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Service:</span>
                <span className="font-medium">{service.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Platform:</span>
                <span className="font-medium">{service.platform}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Quantity:</span>
                <span className="font-medium">{createdOrder.quantity.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Target URL:</span>
                <span className="font-medium text-xs break-all">{createdOrder.targetUrl}</span>
              </div>
              {createdOrder.notes && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Notes:</span>
                  <span className="font-medium text-xs">{createdOrder.notes}</span>
                </div>
              )}
              <div className="pt-3 border-t">
                <div className="flex justify-between">
                  <span className="font-semibold">Total Paid:</span>
                  <span className="text-xl font-bold text-blue-600">
                    ${createdOrder.totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium capitalize">{createdOrder.status.toLowerCase()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center pt-4">
            <Link href={`/dashboard/orders/${createdOrder.id}`}>
              <Button size="lg">View Order Details</Button>
            </Link>
            <Link href="/dashboard/services">
              <Button variant="outline" size="lg">
                Browse More Services
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
          minimumAmount={Math.max(0, totalPrice - walletBalance)}
        />
      )}

      {/* Loading Overlay for Order Creation */}
      {isCreatingOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center backdrop-blur-sm">
          <Card className="p-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <div className="text-center">
                <p className="font-semibold">Creating your order...</p>
                <p className="text-sm text-muted-foreground">Please wait</p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
