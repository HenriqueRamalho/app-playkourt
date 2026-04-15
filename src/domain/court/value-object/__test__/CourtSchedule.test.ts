import { CourtSchedule } from '@/domain/court/value-object/CourtSchedule';
import { BusinessHours } from '@/domain/venue/entity/venue.interface';

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
  describe('isDateOpen', () => {
    it('returns true for an open day', () => {
      const schedule = new CourtSchedule(makeHours());
      expect(schedule.isDateOpen('2025-06-02')).toBe(true); // segunda
    });

    it('returns false for a closed day', () => {
      const schedule = new CourtSchedule(makeHours());
      expect(schedule.isDateOpen('2025-06-08')).toBe(false); // domingo
    });
  });

  describe('isSlotAvailable', () => {
    it('returns true for a slot within business hours', () => {
      const schedule = new CourtSchedule(makeHours());
      expect(schedule.isSlotAvailable('2025-06-02', '10:00', 1)).toBe(true);
    });

    it('returns false when slot starts before opening', () => {
      const schedule = new CourtSchedule(makeHours());
      expect(schedule.isSlotAvailable('2025-06-02', '07:00', 1)).toBe(false);
    });

    it('returns false when slot ends after closing', () => {
      const schedule = new CourtSchedule(makeHours());
      expect(schedule.isSlotAvailable('2025-06-02', '21:30', 1)).toBe(false); // termina 22:30
    });

    it('returns true for a slot that ends exactly at closing time', () => {
      const schedule = new CourtSchedule(makeHours());
      expect(schedule.isSlotAvailable('2025-06-02', '21:00', 1)).toBe(true); // termina 22:00
    });

    it('returns false on a closed day', () => {
      const schedule = new CourtSchedule(makeHours());
      expect(schedule.isSlotAvailable('2025-06-08', '10:00', 1)).toBe(false); // domingo
    });

    it('returns false for a 2h slot that overflows closing', () => {
      const schedule = new CourtSchedule(makeHours());
      expect(schedule.isSlotAvailable('2025-06-02', '21:00', 2)).toBe(false); // termina 23:00
    });
  });

  describe('getAvailableSlots', () => {
    it('returns slots within business hours', () => {
      const schedule = new CourtSchedule(makeHours([{ dayOfWeek: 1, openTime: '08:00', closeTime: '10:00', isClosed: false }]));
      const slots = schedule.getAvailableSlots('2025-06-02', 1);
      expect(slots).toEqual(['08:00', '08:30', '09:00']); // 3 slots de 1h entre 08:00 e 10:00
    });

    it('returns empty array for a closed day', () => {
      const schedule = new CourtSchedule(makeHours());
      expect(schedule.getAvailableSlots('2025-06-08', 1)).toEqual([]);
    });

    it('returns fewer slots for longer duration', () => {
      const schedule = new CourtSchedule(makeHours([{ dayOfWeek: 1, openTime: '08:00', closeTime: '10:00', isClosed: false }]));
      const slots = schedule.getAvailableSlots('2025-06-02', 2);
      expect(slots).toEqual(['08:00']); // só 1 slot de 2h cabe entre 08:00 e 10:00
    });
  });

  describe('getClosedReason', () => {
    it('returns null for an open day', () => {
      const schedule = new CourtSchedule(makeHours());
      expect(schedule.getClosedReason('2025-06-02')).toBeNull();
    });

    it('returns a message for a closed day', () => {
      const schedule = new CourtSchedule(makeHours());
      const reason = schedule.getClosedReason('2025-06-08'); // domingo
      expect(reason).toContain('Domingos');
    });
  });
});
