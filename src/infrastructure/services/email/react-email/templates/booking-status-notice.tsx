import { Heading, Hr, Section, Text } from '@react-email/components';
import { EmailLayout } from '../email-layout';

export type BookingStatusNoticeKind = 'confirmed' | 'cancelled';

export interface BookingStatusNoticeProps {
  userLabel: string;
  courtLabel: string;
  venueLabel: string;
  bookingId: string;
  date: string;
  startTime: string;
  durationHours: number;
  status: BookingStatusNoticeKind;
}

const COPY: Record<
  BookingStatusNoticeKind,
  { preview: string; title: string; lead: string; footer: string }
> = {
  confirmed: {
    preview: 'Sua reserva foi confirmada',
    title: 'Reserva confirmada',
    lead: 'Boa notícia: sua reserva foi confirmada pelo estabelecimento.',
    footer: 'Apresente o ID da reserva se precisar de suporte no local.',
  },
  cancelled: {
    preview: 'Sua reserva foi cancelada',
    title: 'Reserva cancelada',
    lead: 'Sua reserva foi cancelada pelo estabelecimento.',
    footer: 'Se tiver dúvidas, entre em contato com o local ou refaça uma nova solicitação no app.',
  },
};

export function BookingStatusNoticeEmail({
  userLabel,
  courtLabel,
  venueLabel,
  bookingId,
  date,
  startTime,
  durationHours,
  status,
}: BookingStatusNoticeProps) {
  const copy = COPY[status];

  return (
    <EmailLayout preview={`${copy.preview} — ${courtLabel}`}>
      <Heading as="h1" style={{ fontSize: '22px', margin: '0 0 16px', color: '#18181b' }}>
        {copy.title}
      </Heading>
      <Text style={{ fontSize: '16px', lineHeight: '24px', color: '#3f3f46', margin: '0 0 16px' }}>
        Olá, {userLabel}!
      </Text>
      <Text style={{ fontSize: '16px', lineHeight: '24px', color: '#3f3f46', margin: '0 0 20px' }}>
        {copy.lead}
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
      <Text style={{ fontSize: '14px', lineHeight: '22px', color: '#71717a', margin: 0 }}>{copy.footer}</Text>
    </EmailLayout>
  );
}

export default BookingStatusNoticeEmail;
