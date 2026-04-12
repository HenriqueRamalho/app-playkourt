'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { goService, BookingDTO } from '@/infrastructure/frontend-services/api/go.service';
import { BookingStatus } from '@/domain/booking/entity/booking.interface';
import { SPORT_TYPE_LABELS, SportType } from '@/domain/court/entity/court.interface';

const STATUS_CONFIG: Record<BookingStatus, { label: string; className: string }> = {
  [BookingStatus.PENDING]:   { label: 'Pendente',   className: 'bg-yellow-100 text-yellow-700' },
  [BookingStatus.CONFIRMED]: { label: 'Confirmado', className: 'bg-green-100 text-green-700' },
  [BookingStatus.CANCELLED]: { label: 'Cancelado',  className: 'bg-red-100 text-red-600' },
};

function formatDate(date: string) {
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}

function formatTime(time: string) {
  return time.slice(0, 5);
}

export default function ReservationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<BookingStatus | 'all'>('all');

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/auth/login'); return; }
    goService.listMyBookings()
      .then(setBookings)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar reservas'))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  if (authLoading || loading) return null;

  const filtered = activeFilter === 'all' ? bookings : bookings.filter((b) => b.status === activeFilter);

  const filters: { value: BookingStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'Todas' },
    { value: BookingStatus.PENDING, label: 'Pendentes' },
    { value: BookingStatus.CONFIRMED, label: 'Confirmadas' },
    { value: BookingStatus.CANCELLED, label: 'Canceladas' },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Minhas reservas</h1>
      <p className="text-gray-500 text-sm mb-6">Histórico de todos os seus agendamentos.</p>

      <div className="flex gap-2 mb-6">
        {filters.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setActiveFilter(value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeFilter === value
                ? 'bg-green-700 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 flex flex-col items-center text-center">
          <span className="text-4xl mb-3">📅</span>
          <p className="text-gray-500 text-sm">
            {activeFilter === 'all' ? 'Você ainda não tem nenhuma reserva.' : 'Nenhuma reserva com esse status.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((booking) => {
            const status = STATUS_CONFIG[booking.status];
            return (
              <li key={booking.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-gray-900 text-sm">{booking.courtName}</span>
                  <span className="text-xs text-gray-500">{booking.venueName} · {SPORT_TYPE_LABELS[booking.sportType as SportType]}</span>
                  <span className="text-xs text-gray-500">
                    {formatDate(booking.date)} às {formatTime(booking.startTime)} · {booking.durationHours}h
                  </span>
                </div>
                <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${status.className}`}>
                  {status.label}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
