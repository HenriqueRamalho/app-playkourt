'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { goService, BookingDTO, PaginatedBookingsDTO } from '@/infrastructure/frontend-services/api/go.service';
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

const PAGE_SIZE = 20;

export default function ReservationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [result, setResult] = useState<PaginatedBookingsDTO | null>(null);
  const [page, setPage] = useState(1);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<BookingStatus | 'all'>('all');

  const loading = initialLoading;
  const paginating = !initialLoading && result !== null && result.page !== page;

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/auth/login'); return; }
    let cancelled = false;
    goService.listMyBookings(page, PAGE_SIZE)
      .then((data) => { if (!cancelled) setResult(data); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Erro ao carregar reservas'); })
      .finally(() => { if (!cancelled) setInitialLoading(false); });
    return () => { cancelled = true; };
  }, [user, authLoading, router, page]);

  if (authLoading || loading) return null;

  const bookings = result?.data ?? [];
  const totalPages = result ? Math.ceil(result.total / PAGE_SIZE) : 1;
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
      <p className="text-gray-500 text-sm mb-6">
        {result ? `${result.total} reserva${result.total !== 1 ? 's' : ''} no total` : ''}
      </p>

      <div className="flex gap-2 mb-6">
        {filters.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => { setActiveFilter(value); setPage(1); }}
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
        <>
          <ul className="space-y-3">
            {filtered.map((booking: BookingDTO) => {
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

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || paginating}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Anterior
              </button>
              <span className="text-sm text-gray-500">{paginating ? 'Carregando...' : `Página ${page} de ${totalPages}`}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || paginating}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Próxima →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
