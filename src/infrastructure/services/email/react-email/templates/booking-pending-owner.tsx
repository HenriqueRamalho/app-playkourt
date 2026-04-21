import { Heading, Hr, Section, Text } from '@react-email/components';
import { EmailLayout } from '../email-layout';

export interface BookingPendingOwnerProps {
  ownerLabel: string;
  userLabel: string;
  courtLabel: string;
  venueLabel: string;
  requesterEmailDisplay: string;
  bookingId: string;
  date: string;
  startTime: string;
  durationHours: number;
}

export function BookingPendingOwnerEmail({
  ownerLabel,
  userLabel,
  courtLabel,
  venueLabel,
  requesterEmailDisplay,
  bookingId,
  date,
  startTime,
  durationHours,
}: BookingPendingOwnerProps) {
  const preview = `Nova reserva pendente: ${courtLabel}`;

  return (
    <EmailLayout preview={preview}>
      <Heading as="h1" style={{ fontSize: '22px', margin: '0 0 16px', color: '#18181b' }}>
        Nova solicitação de reserva
      </Heading>
      <Text style={{ fontSize: '16px', lineHeight: '24px', color: '#3f3f46', margin: '0 0 16px' }}>
        Olá, {ownerLabel}!
      </Text>
      <Text style={{ fontSize: '16px', lineHeight: '24px', color: '#3f3f46', margin: '0 0 20px' }}>
        Uma nova reserva foi criada com status <strong>pendente</strong>.
      </Text>
      <Section style={{ marginBottom: '20px' }}>
        <Text style={{ fontSize: '15px', lineHeight: '22px', color: '#52525b', margin: '0 0 8px' }}>
          <strong>Quadra:</strong> {courtLabel}
        </Text>
        <Text style={{ fontSize: '15px', lineHeight: '22px', color: '#52525b', margin: '0 0 8px' }}>
          <strong>Local:</strong> {venueLabel}
        </Text>
        <Text style={{ fontSize: '15px', lineHeight: '22px', color: '#52525b', margin: '0 0 8px' }}>
          <strong>Cliente:</strong> {userLabel}
        </Text>
        <Text style={{ fontSize: '15px', lineHeight: '22px', color: '#52525b', margin: '0 0 8px' }}>
          <strong>Email do cliente:</strong> {requesterEmailDisplay}
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
      <Hr style={{ borderColor: '#e4e4e7', margin: 0 }} />
    </EmailLayout>
  );
}

export default BookingPendingOwnerEmail;
