import { supabase } from '@/infrastructure/database/supabase/server/client';
import { Booking, BookingStatus } from '@/domain/booking/entity/booking.interface';
import { BookingRepositoryInterface } from '@/domain/booking/repository/booking-repository.interface';

export class SupabaseBookingRepository implements BookingRepositoryInterface {
  private fromDatabase(data: Record<string, unknown>): Booking {
    return {
      id: data.id as string,
      courtId: data.court_id as string,
      userId: data.user_id as string,
      date: data.date as string,
      startTime: data.start_time as string,
      durationHours: data.duration_hours as number,
      status: data.status as BookingStatus,
      createdAt: new Date(data.created_at as string),
    };
  }

  async create(booking: Omit<Booking, 'id' | 'createdAt'>): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        court_id: booking.courtId,
        user_id: booking.userId,
        date: booking.date,
        start_time: booking.startTime,
        duration_hours: booking.durationHours,
        status: booking.status,
      })
      .select()
      .single();

    if (error) throw error;
    return this.fromDatabase(data);
  }

  async findByUserId(userId: string): Promise<(Booking & { courtName: string; venueName: string; sportType: string })[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, courts!court_id ( name, sport_type, venues!venue_id ( name ) )')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map((d) => {
      const court = d.courts as { name: string; sport_type: string; venues: { name: string } };
      return {
        ...this.fromDatabase(d),
        courtName: court?.name ?? '',
        sportType: court?.sport_type ?? '',
        venueName: court?.venues?.name ?? '',
      };
    });
  }

  async findByCourtId(courtId: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select()
      .eq('court_id', courtId)
      .order('date', { ascending: true });

    if (error) throw error;
    return data.map((d) => this.fromDatabase(d));
  }
}
