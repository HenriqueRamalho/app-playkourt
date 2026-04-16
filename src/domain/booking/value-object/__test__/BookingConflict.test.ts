import { BookingConflict } from '@/domain/booking/value-object/BookingConflict';
import { Booking, BookingStatus } from '@/domain/booking/entity/booking.interface';

const makeBooking = (startTime: string, durationHours: number): Booking => ({
  id: 'booking-1',
  courtId: 'court-1',
  userId: 'user-1',
  date: '2025-06-02',
  startTime,
  durationHours,
  status: BookingStatus.CONFIRMED,
  createdAt: new Date(),
});

describe('BookingConflict', () => {
  it('Cenário 1 — horários adjacentes: permite reserva que começa quando a outra termina', () => {
    // Existente: 19h–20h | Nova: 20h–22h
    const existing = [makeBooking('19:00', 1)];
    expect(BookingConflict.hasConflict(existing, '20:00', 2)).toBe(false);
  });

  it('Cenário 1b — horários adjacentes: permite reserva que termina quando a outra começa', () => {
    // Existente: 20h–22h | Nova: 18h–20h
    const existing = [makeBooking('20:00', 2)];
    expect(BookingConflict.hasConflict(existing, '18:00', 2)).toBe(false);
  });

  it('Cenário 2 — nova reserva dentro da existente: nega', () => {
    // Existente: 18h–19h | Nova: 18h–18:30
    const existing = [makeBooking('18:00', 1)];
    expect(BookingConflict.hasConflict(existing, '18:00', 0.5)).toBe(true);
  });

  it('Cenário 3 — nova reserva cobre o fim da existente: nega', () => {
    // Existente: 20h–22h | Nova: 21h–22h
    const existing = [makeBooking('20:00', 2)];
    expect(BookingConflict.hasConflict(existing, '21:00', 1)).toBe(true);
  });

  it('Cenário 4 — nova reserva cruza e ultrapassa a existente: nega', () => {
    // Existente: 20h–22h | Nova: 21h–23h
    const existing = [makeBooking('20:00', 2)];
    expect(BookingConflict.hasConflict(existing, '21:00', 2)).toBe(true);
  });

  it('Cenário 5 — nova reserva envolve totalmente a existente: nega', () => {
    // Existente: 19h–20h | Nova: 18h–21h
    const existing = [makeBooking('19:00', 1)];
    expect(BookingConflict.hasConflict(existing, '18:00', 3)).toBe(true);
  });

  it('Cenário 6 — horários exatamente iguais: nega', () => {
    // Existente: 19h–20h | Nova: 19h–20h
    const existing = [makeBooking('19:00', 1)];
    expect(BookingConflict.hasConflict(existing, '19:00', 1)).toBe(true);
  });

  it('retorna false quando não há reservas existentes', () => {
    expect(BookingConflict.hasConflict([], '10:00', 1)).toBe(false);
  });

  it('detecta conflito com múltiplas reservas existentes', () => {
    const existing = [makeBooking('08:00', 1), makeBooking('12:00', 1)];
    expect(BookingConflict.hasConflict(existing, '12:30', 1)).toBe(true);
  });
});
