import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
} from '@react-email/components';
import * as React from 'react';

interface BaseEmailLayoutProps {
  children: React.ReactNode;
  previewText?: string;
  unsubscribeUrl?: string;
}

export function BaseEmailLayout({ children, previewText, unsubscribeUrl }: BaseEmailLayoutProps) {
  return (
    <Html>
      <Head />
      {previewText && <Text style={{ display: 'none', maxHeight: 0, overflow: 'hidden' }}>{previewText}</Text>}
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>FollowersBoost</Text>
          </Section>

          {/* Content */}
          <Section style={content}>{children}</Section>

          {/* Footer */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              © 2026 FollowersBoost. All rights reserved.
            </Text>
            <Text style={footerText}>
              <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/settings/email-preferences`} style={footerLink}>
                Email Preferences
              </Link>
              {' | '}
              <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/support`} style={footerLink}>
                Support
              </Link>
              {unsubscribeUrl && (
                <>
                  {' | '}
                  <Link href={unsubscribeUrl} style={footerLink}>
                    Unsubscribe
                  </Link>
                </>
              )}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '32px 48px',
  textAlign: 'center' as const,
  backgroundColor: '#4F46E5',
};

const logo = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0',
};

const content = {
  padding: '0 48px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footer = {
  padding: '0 48px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '4px 0',
};

const footerLink = {
  color: '#4F46E5',
  textDecoration: 'underline',
};
