import { Button, Heading, Hr, Text } from '@react-email/components';
import { EmailLayout } from '../email-layout';

export interface EmailVerificationProps {
  userName: string;
  verificationUrl: string;
}

export function EmailVerificationEmail({ userName, verificationUrl }: EmailVerificationProps) {
  return (
    <EmailLayout preview="Confirme seu endereço de email — Playkourt">
      <Heading as="h1" style={{ fontSize: '22px', margin: '0 0 16px', color: '#18181b' }}>
        Confirme seu email
      </Heading>
      <Text style={{ fontSize: '16px', lineHeight: '24px', color: '#3f3f46', margin: '0 0 16px' }}>
        Olá, {userName}!
      </Text>
      <Text style={{ fontSize: '16px', lineHeight: '24px', color: '#3f3f46', margin: '0 0 24px' }}>
        Clique no botão abaixo para verificar seu endereço de email e ativar sua conta no Playkourt.
      </Text>
      <Button
        href={verificationUrl}
        style={{
          backgroundColor: '#16a34a',
          borderRadius: '8px',
          color: '#ffffff',
          display: 'inline-block',
          fontSize: '15px',
          fontWeight: 600,
          padding: '12px 28px',
          textDecoration: 'none',
        }}
      >
        Verificar meu email
      </Button>
      <Hr style={{ borderColor: '#e4e4e7', margin: '28px 0 20px' }} />
      <Text style={{ fontSize: '13px', lineHeight: '20px', color: '#71717a', margin: '0 0 8px' }}>
        Se você não criou uma conta no Playkourt, pode ignorar este email com segurança.
      </Text>
      <Text style={{ fontSize: '13px', lineHeight: '20px', color: '#71717a', margin: 0 }}>
        O link expira em <strong>24 horas</strong>. Após esse prazo, solicite um novo link na tela de login.
      </Text>
    </EmailLayout>
  );
}

export default EmailVerificationEmail;
