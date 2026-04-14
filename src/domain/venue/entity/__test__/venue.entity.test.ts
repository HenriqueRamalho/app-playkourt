import { VenueEntity } from '@/domain/venue/entity/venue.entity';

const validParams = {
  ownerId: 'owner-1',
  name: 'Arena Central',
  cityId: 1,
  cityName: 'Belo Horizonte',
  stateId: 1,
  stateName: 'Minas Gerais',
  stateUf: 'MG',
};

describe('VenueEntity', () => {
  describe('creation', () => {
    it('creates a venue with valid params', () => {
      const venue = new VenueEntity(validParams);

      expect(venue.name).toBe('Arena Central');
      expect(venue.ownerId).toBe('owner-1');
      expect(venue.cityId).toBe(1);
      expect(venue.stateId).toBe(1);
    });

    it('generates an id when none is provided', () => {
      const venue = new VenueEntity(validParams);

      expect(venue.id).toBeDefined();
      expect(typeof venue.id).toBe('string');
    });

    it('uses provided id when given', () => {
      const venue = new VenueEntity({ ...validParams, id: 'custom-id' });

      expect(venue.id).toBe('custom-id');
    });

    it('defaults isActive to true', () => {
      const venue = new VenueEntity(validParams);

      expect(venue.isActive).toBe(true);
    });

    it('respects isActive when provided', () => {
      const venue = new VenueEntity({ ...validParams, isActive: false });

      expect(venue.isActive).toBe(false);
    });

    it('defaults createdAt to now', () => {
      const before = new Date();
      const venue = new VenueEntity(validParams);
      const after = new Date();

      expect(venue.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(venue.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('validation', () => {
    it('throws if name is empty', () => {
      expect(() => new VenueEntity({ ...validParams, name: '' })).toThrow('Name is required');
    });

    it('throws if name is whitespace only', () => {
      expect(() => new VenueEntity({ ...validParams, name: '   ' })).toThrow('Name is required');
    });

    it('throws if cityId is missing', () => {
      expect(() => new VenueEntity({ ...validParams, cityId: 0 })).toThrow('City is required');
    });

    it('throws if stateId is missing', () => {
      expect(() => new VenueEntity({ ...validParams, stateId: 0 })).toThrow('State is required');
    });

    it('throws if ownerId is missing', () => {
      expect(() => new VenueEntity({ ...validParams, ownerId: '' })).toThrow('Owner is required');
    });
  });
});
