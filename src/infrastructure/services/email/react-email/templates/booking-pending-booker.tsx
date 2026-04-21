import { Heading, Hr, Section, Text } from '@react-email/components';
import { EmailLayout } from '../email-layout';

export interface BookingPendingBookerProps {
  userLabel: string;
  courtLabel: string;
  venueLabel: string;
  bookingId: string;
  date: string;
  startTime: string;
  durationHours: number;
}

export function BookingPendingBookerEmail({
  userLabel,
  courtLabel,
  venueLabel,
  bookingId,
  date,
  startTime,
  durationHours,
}: BookingPendingBookerProps) {
  const preview = `Reserva pendente: ${courtLabel} em ${date}`;

  return (
    <EmailLayout preview={preview}>
      <Heading as="h1" style={{ fontSize: '22px', margin: '0 0 16px', color: '#18181b' }}>
        Recebemos sua solicitação de reserva
      </Heading>
      <Text style={{ fontSize: '16px', lineHeight: '24px', color: '#3f3f46', margin: '0 0 16px' }}>
        Olá, {userLabel}!
      </Text>
      <Text style={{ fontSize: '16px', lineHeight: '24px', color: '#3f3f46', margin: '0 0 20px' }}>
        Sua reserva foi criada com status <strong>pendente</strong>.
      </Text>
      <Section style={{ marginBottom: '20px' }}>
        <Text style={{ fontSize: '15px', lineHeight: '22px', color: '#52525b', margin: '0 0 8px' }}>
          <strong>Quadra:</strong> {courtLabel}
        </Text>
        <Text style={{ fontSize: '15px', lineHeight: '22px', color: '#52525b', margin: '0 0 8px' }}>
          <strong>Local:</strong> {venueLabel}
        </Text>
        <Text style={{ fontSize: '15px', lineHeight: '22px', color: '#52525b', margin: '0 0 8px' }}>
          <strong>Data:</strong> {date}
        </Text>
        <Text style={{ fontSize: '15px', lineHeight: '22px', color: '#52525b', margin: '0 0 8px' }}>
          <strong>Início:</strong> {startTime}
        </Text>
        <Text style={{ fontSize: '15px', lineHeight: '22px', color: '#52525b', margin: '0 0 8px' }}>
          <strong>Duração:</strong> {durationHours}h
        </Text>
        <Text style={{ fontSize: '15px', lineHeight: '22px', color: '#52525b', margin: '0 0 8px' }}>
          <strong>ID da reserva:</strong> {bookingId}
        </Text>
      </Section>
      <Hr style={{ borderColor: '#e4e4e7', margin: '0 0 20px' }} />
      <Text style={{ fontSize: '14px', lineHeight: '22px', color: '#71717a', margin: 0 }}>
        Assim que o proprietário confirmar, você será avisado.
      </Text>
    </EmailLayout>
  );
}

export default BookingPendingBookerEmail;
