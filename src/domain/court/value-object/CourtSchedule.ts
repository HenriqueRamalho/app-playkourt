import { BusinessHours } from '@/domain/venue/entity/venue.interface';

export class CourtSchedule {
  constructor(private readonly businessHours: BusinessHours[]) {}

  private getDayOfWeek(date: string): number {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  }

  private toMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  getHoursForDate(date: string): BusinessHours | null {
    const dayOfWeek = this.getDayOfWeek(date);
    return this.businessHours.find((h) => h.dayOfWeek === dayOfWeek) ?? null;
  }

  isDateOpen(date: string): boolean {
    const hours = this.getHoursForDate(date);
    return hours !== null && !hours.isClosed;
  }

  isSlotAvailable(date: string, startTime: string, durationHours: number): boolean {
    const hours = this.getHoursForDate(date);
    if (!hours || hours.isClosed || !hours.openTime || !hours.closeTime) return false;

    const slotStart = this.toMinutes(startTime);
    const slotEnd = slotStart + durationHours * 60;
    const open = this.toMinutes(hours.openTime);
    const close = this.toMinutes(hours.closeTime);

    return slotStart >= open && slotEnd <= close;
  }

  getAvailableSlots(date: string, durationHours: number): string[] {
    const hours = this.getHoursForDate(date);
    if (!hours || hours.isClosed || !hours.openTime || !hours.closeTime) return [];

    const open = this.toMinutes(hours.openTime);
    const close = this.toMinutes(hours.closeTime);
    const slots: string[] = [];

    for (let start = open; start + durationHours * 60 <= close; start += 30) {
      const h = String(Math.floor(start / 60)).padStart(2, '0');
      const m = String(start % 60).padStart(2, '0');
      slots.push(`${h}:${m}`);
    }

    return slots;
  }

  getClosedReason(date: string): string | null {
    const hours = this.getHoursForDate(date);
    if (!hours) return 'Data sem configuração de horário.';
    if (hours.isClosed) {
      const DAY_LABELS: Record<number, string> = {
        0: 'Domingos', 1: 'Segundas', 2: 'Terças',
        3: 'Quartas', 4: 'Quintas', 5: 'Sextas', 6: 'Sábados',
      };
      return `Este local não funciona às ${DAY_LABELS[hours.dayOfWeek]}.`;
    }
    return null;
  }
}
