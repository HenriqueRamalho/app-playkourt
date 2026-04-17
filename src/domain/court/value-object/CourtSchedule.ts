import { BusinessHours } from '@/domain/venue/entity/venue.interface';
import { CourtDateException, CourtRecurringBlock } from '@/domain/court/entity/court.interface';

export class CourtSchedule {
  constructor(
    private readonly businessHours: BusinessHours[],
    private readonly dateExceptions: CourtDateException[] = [],
    private readonly recurringBlocks: CourtRecurringBlock[] = [],
  ) {}

  private getDayOfWeek(date: string): number {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  }

  private toMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  private getDateException(date: string): CourtDateException | null {
    return this.dateExceptions.find((e) => e.date === date) ?? null;
  }

  private getRecurringBlocksForDate(date: string): CourtRecurringBlock[] {
    const dayOfWeek = this.getDayOfWeek(date);
    return this.recurringBlocks.filter((b) => b.dayOfWeek === dayOfWeek);
  }

  getHoursForDate(date: string): BusinessHours | null {
    const dayOfWeek = this.getDayOfWeek(date);
    return this.businessHours.find((h) => h.dayOfWeek === dayOfWeek) ?? null;
  }

  isDateOpen(date: string): boolean {
    const exception = this.getDateException(date);
    if (exception?.isFullDayBlock) return false;

    const hours = this.getHoursForDate(date);
    return hours !== null && !hours.isClosed;
  }

  isSlotAvailable(date: string, startTime: string, durationHours: number): boolean {
    const exception = this.getDateException(date);
    if (exception?.isFullDayBlock) return false;

    const hours = this.getHoursForDate(date);
    if (!hours || hours.isClosed || !hours.openTime || !hours.closeTime) return false;

    const slotStart = this.toMinutes(startTime);
    const slotEnd = slotStart + durationHours * 60;
    const open = this.toMinutes(hours.openTime);
    const close = this.toMinutes(hours.closeTime);

    if (slotStart < open || slotEnd > close) return false;

    // Verifica bloqueio pontual parcial
    if (exception && !exception.isFullDayBlock && exception.startTime && exception.endTime) {
      const blockStart = this.toMinutes(exception.startTime);
      const blockEnd = this.toMinutes(exception.endTime);
      if (slotStart < blockEnd && slotEnd > blockStart) return false;
    }

    // Verifica bloqueios recorrentes
    const blocks = this.getRecurringBlocksForDate(date);
    for (const block of blocks) {
      const blockStart = this.toMinutes(block.startTime);
      const blockEnd = this.toMinutes(block.endTime);
      if (slotStart < blockEnd && slotEnd > blockStart) return false;
    }

    return true;
  }

  getAvailableSlots(date: string, durationHours: number): string[] {
    const hours = this.getHoursForDate(date);
    if (!hours || hours.isClosed || !hours.openTime || !hours.closeTime) return [];

    const exception = this.getDateException(date);
    if (exception?.isFullDayBlock) return [];

    const open = this.toMinutes(hours.openTime);
    const close = this.toMinutes(hours.closeTime);
    const slots: string[] = [];

    for (let start = open; start + durationHours * 60 <= close; start += 30) {
      const h = String(Math.floor(start / 60)).padStart(2, '0');
      const m = String(start % 60).padStart(2, '0');
      const time = `${h}:${m}`;
      if (this.isSlotAvailable(date, time, durationHours)) {
        slots.push(time);
      }
    }

    return slots;
  }

  getClosedReason(date: string): string | null {
    const exception = this.getDateException(date);
    if (exception?.isFullDayBlock) {
      return exception.reason
        ? `Quadra indisponível: ${exception.reason}`
        : 'Quadra indisponível nesta data.';
    }

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

  // Retorna os bloqueios que afetam uma data específica (para alertas ao dono)
  getBlocksForDate(date: string): { type: 'exception' | 'recurring'; reason?: string; startTime?: string; endTime?: string }[] {
    const result: { type: 'exception' | 'recurring'; reason?: string; startTime?: string; endTime?: string }[] = [];

    const exception = this.getDateException(date);
    if (exception) {
      result.push({ type: 'exception', reason: exception.reason, startTime: exception.startTime, endTime: exception.endTime });
    }

    for (const block of this.getRecurringBlocksForDate(date)) {
      result.push({ type: 'recurring', reason: block.reason, startTime: block.startTime, endTime: block.endTime });
    }

    return result;
  }
}
