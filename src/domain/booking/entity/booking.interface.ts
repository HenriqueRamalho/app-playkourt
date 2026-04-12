export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
}

export interface Booking {
  id: string;
  courtId: string;
  userId: string;
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:MM
  durationHours: number;
  status: BookingStatus;
  createdAt: Date;
}
