import { Button, Heading, Hr, Text } from '@react-email/components';
import { EmailLayout } from '../email-layout';

export interface PasswordResetEmailProps {
  userName: string;
  resetUrl: string;
}

export function PasswordResetEmail({ userName, resetUrl }: PasswordResetEmailProps) {
  return (
    <EmailLayout preview="Redefinir sua senha — Playkourt">
      <Heading as="h1" style={{ fontSize: '22px', margin: '0 0 16px', color: '#18181b' }}>
        Redefinir senha
      </Heading>
      <Text style={{ fontSize: '16px', lineHeight: '24px', color: '#3f3f46', margin: '0 0 16px' }}>
        Olá, {userName}!
      </Text>
      <Text style={{ fontSize: '16px', lineHeight: '24px', color: '#3f3f46', margin: '0 0 24px' }}>
        Recebemos um pedido para redefinir a senha da sua conta no Playkourt. Clique no botão abaixo para
        escolher uma nova senha.
      </Text>
      <Button
        href={resetUrl}
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
        Redefinir minha senha
      </Button>
      <Hr style={{ borderColor: '#e4e4e7', margin: '28px 0 20px' }} />
      <Text style={{ fontSize: '13px', lineHeight: '20px', color: '#71717a', margin: '0 0 8px' }}>
        Se você não solicitou a redefinição, ignore este email — sua senha permanece a mesma.
      </Text>
      <Text style={{ fontSize: '13px', lineHeight: '20px', color: '#71717a', margin: 0 }}>
        O link expira em <strong>1 hora</strong>. Depois disso, solicite um novo link em &quot;Esqueci minha
        senha&quot; na tela de login.
      </Text>
    </EmailLayout>
  );
}

export default PasswordResetEmail;
