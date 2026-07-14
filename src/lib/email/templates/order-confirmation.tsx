import { Text, Heading, Button, Section } from '@react-email/components';
import * as React from 'react';
import { BaseEmailLayout } from './base-layout';

interface OrderConfirmationEmailProps {
  orderId: string;
  serviceName: string;
  platform: string;
  quantity: number;
  totalPrice: string;
  targetUrl: string;
  estimatedDelivery: string;
}

export function OrderConfirmationEmail({
  orderId,
  serviceName,
  platform,
  quantity,
  totalPrice,
  targetUrl,
  estimatedDelivery,
}: OrderConfirmationEmailProps) {
  const orderUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/orders/${orderId}`;

  return (
    <BaseEmailLayout previewText={`Order ${orderId.slice(0, 8)} confirmed`}>
      <Heading style={h1}>Order Confirmed! 🎉</Heading>

      <Text style={text}>
        Your order has been received and is being processed. We'll notify you when delivery begins.
      </Text>

      {/* Order Details */}
      <Section style={detailsBox}>
        <Text style={detailLabel}>Order ID</Text>
        <Text style={detailValue}>#{orderId.slice(0, 8)}</Text>

        <Text style={detailLabel}>Service</Text>
        <Text style={detailValue}>
          {serviceName} - {platform}
        </Text>

        <Text style={detailLabel}>Quantity</Text>
        <Text style={detailValue}>{quantity.toLocaleString()}</Text>

        <Text style={detailLabel}>Target URL</Text>
        <Text style={detailValue}>{targetUrl}</Text>

        <Text style={detailLabel}>Total Price</Text>
        <Text style={detailValue}>${totalPrice}</Text>

        <Text style={detailLabel}>Estimated Delivery</Text>
        <Text style={detailValue}>{estimatedDelivery}</Text>
      </Section>

      <Section style={buttonContainer}>
        <Button href={orderUrl} style={button}>
          View Order Details
        </Button>
      </Section>

      <Text style={footer}>
        You can track your order progress at any time from your dashboard.
      </Text>
    </BaseEmailLayout>
  );
}

// Styles
const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '32px 0 16px',
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const detailsBox = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
};

const detailLabel = {
  color: '#6b7280',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '16px 0 4px',
};

const detailValue = {
  color: '#111827',
  fontSize: '16px',
  margin: '0 0 8px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#4F46E5',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
};

const footer = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '24px 0 0',
};
