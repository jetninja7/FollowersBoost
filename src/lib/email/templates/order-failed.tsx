import { Text, Heading, Button, Section } from '@react-email/components';
import * as React from 'react';
import { BaseEmailLayout } from './base-layout';

interface OrderFailedEmailProps {
  orderId: string;
  serviceName: string;
  totalPrice: string;
  failureReason?: string;
  unsubscribeUrl?: string;
}

export function OrderFailedEmail({
  orderId,
  serviceName,
  totalPrice,
  failureReason,
  unsubscribeUrl,
}: OrderFailedEmailProps) {
  const walletUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/wallet`;
  const supportUrl = `${process.env.NEXT_PUBLIC_APP_URL}/support`;

  return (
    <BaseEmailLayout previewText={`Order ${orderId.slice(0, 8)} refunded - Issue occurred`} unsubscribeUrl={unsubscribeUrl}>
      <Heading style={h1}>Order Refunded</Heading>

      <Text style={text}>
        We're sorry, but we encountered an issue processing your order. Your payment of ${totalPrice} has been refunded to your wallet.
      </Text>

      {/* Failure Info */}
      <Section style={alertBox}>
        <Text style={alertIcon}>⚠️</Text>
        <Text style={orderInfo}>Order #{orderId.slice(0, 8)}</Text>
        <Text style={serviceName}>{serviceName}</Text>
        {failureReason && (
          <Text style={reason}>
            <strong>Reason:</strong> {failureReason}
          </Text>
        )}
      </Section>

      <Text style={text}>
        The refund of ${totalPrice} is now available in your wallet. You can use it to place a new order or withdraw it.
      </Text>

      <Section style={buttonContainer}>
        <Button href={walletUrl} style={button}>
          View Wallet
        </Button>
        <Text style={linkText}>
          Need help?{' '}
          <a href={supportUrl} style={link}>
            Contact Support
          </a>
        </Text>
      </Section>

      <Text style={footer}>
        We apologize for the inconvenience. Our team is working to prevent similar issues in the future.
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

const alertBox = {
  backgroundColor: '#fef2f2',
  border: '2px solid #ef4444',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const alertIcon = {
  fontSize: '48px',
  margin: '0 0 16px',
};

const orderInfo = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0 0 8px',
};

const serviceName = {
  color: '#111827',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 16px',
};

const reason = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
  padding: '12px',
  backgroundColor: '#ffffff',
  borderRadius: '4px',
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
