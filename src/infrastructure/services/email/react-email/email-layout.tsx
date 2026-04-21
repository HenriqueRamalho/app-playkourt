import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
} from '@react-email/components';
import type { ReactNode } from 'react';

interface EmailLayoutProps {
  preview: string;
  children: ReactNode;
}

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: '#f4f4f5',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          margin: 0,
          padding: '24px 0',
        }}
      >
        <Container
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
            margin: '0 auto',
            maxWidth: '560px',
            padding: '32px 28px',
          }}
        >
          <Section style={{ marginBottom: '20px' }}>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#166534' }}>Playkourt</span>
          </Section>
          {children}
        </Container>
      </Body>
    </Html>
  );
}
