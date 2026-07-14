import { Text, Heading, Button, Section } from '@react-email/components';
import * as React from 'react';
import { BaseEmailLayout } from './base-layout';

interface OrderCompletedEmailProps {
  orderId: string;
  serviceName: string;
  quantity: number;
}

export function OrderCompletedEmail({
  orderId,
  serviceName,
  quantity,
}: OrderCompletedEmailProps) {
  const orderUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/orders/${orderId}`;
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;

  return (
    <BaseEmailLayout previewText={`Order ${orderId.slice(0, 8)} completed successfully`}>
      <Heading style={h1}>Order Completed! ✅</Heading>

      <Text style={text}>
        Excellent news! Your order has been completed successfully.
      </Text>

      {/* Completion Details */}
      <Section style={completionBox}>
        <Text style={checkmark}>✓</Text>
        <Text style={serviceName}>{serviceName}</Text>
        <Text style={quantityText}>{quantity.toLocaleString()} delivered</Text>
      </Section>

      <Text style={text}>
        Thank you for choosing FollowersBoost! We hope you're satisfied with our service.
      </Text>

      <Section style={buttonContainer}>
        <Button href={orderUrl} style={button}>
          View Order
        </Button>
        <Text style={linkText}>
          or{' '}
          <a href={dashboardUrl} style={link}>
            browse more services
          </a>
        </Text>
      </Section>

      <Text style={footer}>
        If you have any questions or concerns, please don't hesitate to contact our support team.
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

const completionBox = {
  backgroundColor: '#f0fdf4',
  border: '2px solid #10b981',
  borderRadius: '8px',
  padding: '32px 24px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const checkmark = {
  fontSize: '48px',
  color: '#10b981',
  margin: '0 0 16px',
};

const serviceName = {
  color: '#111827',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 8px',
};

const quantityText = {
  color: '#6b7280',
  fontSize: '16px',
  margin: '0',
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

const linkText = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '16px 0 0',
};

const link = {
  color: '#4F46E5',
  textDecoration: 'underline',
};

const footer = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '24px 0 0',
};
