import { Text, Heading, Button, Section } from '@react-email/components';
import * as React from 'react';
import { BaseEmailLayout } from './base-layout';

interface OrderInProgressEmailProps {
  orderId: string;
  serviceName: string;
  quantity: number;
  currentCount: number;
  startCount: number;
}

export function OrderInProgressEmail({
  orderId,
  serviceName,
  quantity,
  currentCount,
  startCount,
}: OrderInProgressEmailProps) {
  const orderUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/orders/${orderId}`;
  const delivered = currentCount - startCount;
  const progress = Math.round((delivered / quantity) * 100);

  return (
    <BaseEmailLayout previewText={`Order ${orderId.slice(0, 8)} is now being delivered`}>
      <Heading style={h1}>Delivery Started! 🚀</Heading>

      <Text style={text}>
        Great news! Your order is now in progress and delivery has begun.
      </Text>

      {/* Progress Info */}
      <Section style={progressBox}>
        <Text style={serviceName}>{serviceName}</Text>

        <Section style={progressBar}>
          <Section style={{ ...progressFill, width: `${progress}%` }} />
        </Section>

        <Text style={progressText}>
          {delivered.toLocaleString()} of {quantity.toLocaleString()} delivered ({progress}%)
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button href={orderUrl} style={button}>
          Track Progress
        </Button>
      </Section>

      <Text style={footer}>
        We'll send you another email when your order is complete.
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

const progressBox = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const serviceName = {
  color: '#111827',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 16px',
};

const progressBar = {
  width: '100%',
  height: '12px',
  backgroundColor: '#e5e7eb',
  borderRadius: '6px',
  overflow: 'hidden',
  margin: '16px 0',
};

const progressFill = {
  height: '100%',
  backgroundColor: '#10b981',
  borderRadius: '6px',
  transition: 'width 0.3s ease',
};

const progressText = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '8px 0 0',
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
