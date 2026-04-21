import { render } from '@react-email/render';
import { BookingPendingBookerEmail } from './templates/booking-pending-booker';
import type { BookingPendingBookerProps } from './templates/booking-pending-booker';
import { BookingPendingOwnerEmail } from './templates/booking-pending-owner';
import type { BookingPendingOwnerProps } from './templates/booking-pending-owner';
import { BookingStatusNoticeEmail } from './templates/booking-status-notice';
import type { BookingStatusNoticeProps } from './templates/booking-status-notice';

export async function renderBookingPendingBookerEmail(
  props: BookingPendingBookerProps,
): Promise<{ html: string; text: string }> {
  const element = <BookingPendingBookerEmail {...props} />;
  const [html, text] = await Promise.all([
    render(element, { pretty: false }),
    render(element, { plainText: true }),
  ]);
  return { html, text };
}

export async function renderBookingPendingOwnerEmail(
  props: BookingPendingOwnerProps,
): Promise<{ html: string; text: string }> {
  const element = <BookingPendingOwnerEmail {...props} />;
  const [html, text] = await Promise.all([
    render(element, { pretty: false }),
    render(element, { plainText: true }),
  ]);
  return { html, text };
}

export async function renderBookingStatusNoticeEmail(
  props: BookingStatusNoticeProps,
): Promise<{ html: string; text: string }> {
  const element = <BookingStatusNoticeEmail {...props} />;
  const [html, text] = await Promise.all([
    render(element, { pretty: false }),
    render(element, { plainText: true }),
  ]);
  return { html, text };
}
