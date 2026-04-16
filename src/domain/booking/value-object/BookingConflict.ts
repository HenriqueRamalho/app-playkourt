import { Booking } from '../entity/booking.interface';

export class BookingConflict {
  private static toMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  static hasConflict(existingBookings: Booking[], startTime: string, durationHours: number): boolean {
    const newStart = this.toMinutes(startTime);
    const newEnd = newStart + durationHours * 60;

    return existingBookings.some((booking) => {
      const existingStart = this.toMinutes(booking.startTime);
      const existingEnd = existingStart + booking.durationHours * 60;

      // Adjacentes são permitidos: só há conflito quando os intervalos se sobrepõem
      return newStart < existingEnd && newEnd > existingStart;
    });
  }
}
