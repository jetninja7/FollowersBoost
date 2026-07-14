import { Text, Heading, Button, Section } from '@react-email/components';
import * as React from 'react';
import { BaseEmailLayout } from './base-layout';

interface WalletDepositEmailProps {
  transactionId: string;
  amount: string;
  paymentMethod: string;
  newBalance: string;
}

export function WalletDepositEmail({
  transactionId,
  amount,
  paymentMethod,
  newBalance,
}: WalletDepositEmailProps) {
  const walletUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/wallet`;

  return (
    <BaseEmailLayout previewText={`$${amount} added to your wallet`}>
      <Heading style={h1}>Funds Added Successfully! 💰</Heading>

      <Text style={text}>
        Your wallet has been credited. You can now use these funds to purchase services.
      </Text>

      {/* Transaction Details */}
      <Section style={detailsBox}>
        <Section style={amountSection}>
          <Text style={amountLabel}>Amount Added</Text>
          <Text style={amountValue}>+${amount}</Text>
        </Section>

        <Section style={divider} />

        <Text style={detailLabel}>Transaction ID</Text>
        <Text style={detailValue}>#{transactionId.slice(0, 12)}</Text>

        <Text style={detailLabel}>Payment Method</Text>
        <Text style={detailValue}>{paymentMethod}</Text>

        <Text style={detailLabel}>New Balance</Text>
        <Text style={balanceValue}>${newBalance}</Text>
      </Section>

      <Section style={buttonContainer}>
        <Button href={walletUrl} style={button}>
          View Wallet
        </Button>
      </Section>

      <Text style={footer}>
        Your funds are ready to use. Browse our services and start growing your social media presence!
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

const amountSection = {
  textAlign: 'center' as const,
  padding: '16px 0',
};

const amountLabel = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0 0 8px',
};

const amountValue = {
  color: '#10b981',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0',
};

const divider = {
  height: '1px',
  backgroundColor: '#e5e7eb',
  margin: '16px 0',
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

const balanceValue = {
  color: '#10b981',
  fontSize: '20px',
  fontWeight: '600',
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
