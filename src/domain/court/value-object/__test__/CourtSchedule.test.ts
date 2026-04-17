import { CourtSchedule } from '@/domain/court/value-object/CourtSchedule';
import { BusinessHours } from '@/domain/venue/entity/venue.interface';
import { CourtDateException, CourtRecurringBlock } from '@/domain/court/entity/court.interface';

// 2025-06-02 = segunda-feira (dayOfWeek 1)
// 2025-06-07 = sábado (dayOfWeek 6)
// 2025-06-08 = domingo (dayOfWeek 0)

const makeHours = (overrides: Partial<BusinessHours>[] = []): BusinessHours[] =>
  [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
    const override = overrides.find((o) => o.dayOfWeek === dayOfWeek);
    return {
      dayOfWeek: dayOfWeek as BusinessHours['dayOfWeek'],
      openTime: '08:00',
      closeTime: '22:00',
      isClosed: dayOfWeek === 0,
      ...override,
    };
  });

describe('CourtSchedule', () => {
  describe('Cenário 1 — herança do venue (sem exceções)', () => {
    it('retorna slots disponíveis para dia aberto', () => {
      const schedule = new CourtSchedule(makeHours());
      expect(schedule.isDateOpen('2025-06-02')).toBe(true);
    });

    it('retorna fechado para domingo', () => {
      const schedule = new CourtSchedule(makeHours());
      expect(schedule.isDateOpen('2025-06-08')).toBe(false);
    });
  });

  describe('Cenário 3 — horário reduzido', () => {
    it('bloqueia slots fora do horário reduzido', () => {
      const hours = makeHours([{ dayOfWeek: 1, openTime: '06:00', closeTime: '18:00', isClosed: false }]);
      const schedule = new CourtSchedule(hours);
      expect(schedule.isSlotAvailable('2025-06-02', '18:00', 1)).toBe(false);
      expect(schedule.isSlotAvailable('2025-06-02', '17:00', 1)).toBe(true);
    });
  });

  describe('Cenário 4 — horários diferentes por dia', () => {
    it('respeita horários distintos entre dias úteis e fim de semana', () => {
      const hours = makeHours([
        { dayOfWeek: 1, openTime: '08:00', closeTime: '22:00', isClosed: false },
        { dayOfWeek: 6, openTime: '07:00', closeTime: '20:00', isClosed: false },
      ]);
      const schedule = new CourtSchedule(hours);
      expect(schedule.isSlotAvailable('2025-06-02', '21:00', 1)).toBe(true);  // segunda 21h-22h ✓
      expect(schedule.isSlotAvailable('2025-06-07', '21:00', 1)).toBe(false); // sábado 21h-22h ✗
      expect(schedule.isSlotAvailable('2025-06-07', '07:00', 1)).toBe(true);  // sábado 07h-08h ✓
    });
  });

  describe('Cenário 5 — bloqueio pontual total', () => {
    it('bloqueia o dia inteiro quando isFullDayBlock = true', () => {
      const exception: CourtDateException = { date: '2025-06-02', isFullDayBlock: true, reason: 'Manutenção' };
      const schedule = new CourtSchedule(makeHours(), [exception]);
      expect(schedule.isDateOpen('2025-06-02')).toBe(false);
      expect(schedule.getAvailableSlots('2025-06-02', 1)).toEqual([]);
    });

    it('retorna motivo correto no getClosedReason', () => {
      const exception: CourtDateException = { date: '2025-06-02', isFullDayBlock: true, reason: 'Manutenção' };
      const schedule = new CourtSchedule(makeHours(), [exception]);
      expect(schedule.getClosedReason('2025-06-02')).toContain('Manutenção');
    });

    it('não afeta outros dias', () => {
      const exception: CourtDateException = { date: '2025-06-02', isFullDayBlock: true };
      const schedule = new CourtSchedule(makeHours(), [exception]);
      expect(schedule.isDateOpen('2025-06-03')).toBe(true);
    });

    it('bloqueio parcial bloqueia apenas o intervalo', () => {
      const exception: CourtDateException = { date: '2025-06-02', isFullDayBlock: false, startTime: '08:00', endTime: '12:00' };
      const schedule = new CourtSchedule(makeHours(), [exception]);
      expect(schedule.isSlotAvailable('2025-06-02', '09:00', 1)).toBe(false);
      expect(schedule.isSlotAvailable('2025-06-02', '12:00', 1)).toBe(true);
      expect(schedule.isSlotAvailable('2025-06-02', '14:00', 1)).toBe(true);
    });
  });

  describe('Cenário 6 — bloqueio recorrente', () => {
    it('bloqueia o intervalo recorrente no dia configurado', () => {
      const block: CourtRecurringBlock = { dayOfWeek: 1, startTime: '07:00', endTime: '12:00' };
      const schedule = new CourtSchedule(makeHours(), [], [block]);
      expect(schedule.isSlotAvailable('2025-06-02', '08:00', 1)).toBe(false);
      expect(schedule.isSlotAvailable('2025-06-02', '11:00', 1)).toBe(false);
    });

    it('permite slots fora do bloqueio recorrente', () => {
      const block: CourtRecurringBlock = { dayOfWeek: 1, startTime: '07:00', endTime: '12:00' };
      const schedule = new CourtSchedule(makeHours(), [], [block]);
      expect(schedule.isSlotAvailable('2025-06-02', '12:00', 1)).toBe(true);
      expect(schedule.isSlotAvailable('2025-06-02', '14:00', 2)).toBe(true);
    });

    it('não afeta outros dias da semana', () => {
      const block: CourtRecurringBlock = { dayOfWeek: 1, startTime: '07:00', endTime: '12:00' };
      const schedule = new CourtSchedule(makeHours(), [], [block]);
      // terça-feira (dayOfWeek 2)
      expect(schedule.isSlotAvailable('2025-06-03', '08:00', 1)).toBe(true);
    });

    it('getAvailableSlots exclui os slots bloqueados recorrentemente', () => {
      const hours = makeHours([{ dayOfWeek: 1, openTime: '08:00', closeTime: '14:00', isClosed: false }]);
      const block: CourtRecurringBlock = { dayOfWeek: 1, startTime: '08:00', endTime: '12:00' };
      const schedule = new CourtSchedule(hours, [], [block]);
      const slots = schedule.getAvailableSlots('2025-06-02', 1);
      expect(slots).toEqual(['12:00', '12:30', '13:00']);
    });
  });

  describe('Cenário 7 — reversão para horário do venue', () => {
    it('ao usar horário do venue, ignora businessHours da court', () => {
      // Simula: court com useVenueHours=true passa os hours do venue
      const venueHours = makeHours([{ dayOfWeek: 1, openTime: '06:00', closeTime: '23:00', isClosed: false }]);
      const schedule = new CourtSchedule(venueHours);
      expect(schedule.isSlotAvailable('2025-06-02', '22:00', 1)).toBe(true);
    });
  });

  describe('combinação de bloqueios', () => {
    it('bloqueio pontual + recorrente no mesmo dia bloqueiam corretamente', () => {
      const exception: CourtDateException = { date: '2025-06-02', isFullDayBlock: false, startTime: '14:00', endTime: '16:00' };
      const block: CourtRecurringBlock = { dayOfWeek: 1, startTime: '08:00', endTime: '10:00' };
      const schedule = new CourtSchedule(makeHours(), [exception], [block]);
      expect(schedule.isSlotAvailable('2025-06-02', '09:00', 1)).toBe(false); // recorrente
      expect(schedule.isSlotAvailable('2025-06-02', '15:00', 1)).toBe(false); // pontual
      expect(schedule.isSlotAvailable('2025-06-02', '11:00', 1)).toBe(true);  // livre
    });
  });
});
