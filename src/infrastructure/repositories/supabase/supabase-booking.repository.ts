import { supabase } from '@/infrastructure/database/supabase/server/client';
import { Booking, BookingStatus } from '@/domain/booking/entity/booking.interface';
import { BookingRepositoryInterface, BookingWithDetails, PaginatedBookings } from '@/domain/booking/repository/booking-repository.interface';

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

  private withDetails(data: Record<string, unknown>): BookingWithDetails {
    const court = data.courts as { name: string; sport_type: string; venues: { name: string } };
    return {
      ...this.fromDatabase(data),
      courtName: court?.name ?? '',
      sportType: court?.sport_type ?? '',
      venueName: court?.venues?.name ?? '',
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

  async findById(id: string): Promise<BookingWithDetails | null> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, courts!court_id ( name, sport_type, venues!venue_id ( name ) )')
      .eq('id', id)
      .single();

    if (error) return null;
    return this.withDetails(data as Record<string, unknown>);
  }

  async findByUserId(userId: string): Promise<BookingWithDetails[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, courts!court_id ( name, sport_type, venues!venue_id ( name ) )')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map((d) => this.withDetails(d as Record<string, unknown>));
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

  async findActiveByCourtAndDate(courtId: string, date: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select()
      .eq('court_id', courtId)
      .eq('date', date)
      .in('status', ['pending', 'confirmed']);

    if (error) throw error;
    return data.map((d) => this.fromDatabase(d));
  }

  async findByVenueId(venueId: string, page: number, pageSize: number): Promise<PaginatedBookings> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('bookings')
      .select('*, courts!court_id ( name, sport_type, venue_id, venues!venue_id ( name ) )', { count: 'exact' })
      .eq('courts.venue_id', venueId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const bookings = (data as Record<string, unknown>[])
      .filter((d) => d.courts !== null)
      .map((d) => this.withDetails(d));

    return { data: bookings, total: count ?? 0, page, pageSize };
  }

  async updateStatus(id: string, status: Booking['status']): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.fromDatabase(data);
  }
}
