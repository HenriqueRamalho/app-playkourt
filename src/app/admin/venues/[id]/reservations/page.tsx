'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { adminBookingService, AdminBookingDTO, PaginatedBookingsDTO } from '@/infrastructure/frontend-services/api/admin-booking.service';
import { BookingStatus } from '@/domain/booking/entity/booking.interface';
import { SPORT_TYPE_LABELS, SportType } from '@/domain/court/entity/court.interface';

const STATUS_CONFIG: Record<BookingStatus, { label: string; className: string }> = {
  [BookingStatus.PENDING]:   { label: 'Pendente',   className: 'bg-yellow-100 text-yellow-700' },
  [BookingStatus.CONFIRMED]: { label: 'Confirmado', className: 'bg-green-100 text-green-700' },
  [BookingStatus.CANCELLED]: { label: 'Cancelado',  className: 'bg-red-100 text-red-600' },
};

function formatDate(date: string) {
  const [y, m, d] = date.split('-');
  return `${d}/${m}/${y}`;
}

const PAGE_SIZE = 20;

export default function VenueReservationsPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [result, setResult] = useState<PaginatedBookingsDTO | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/auth/login'); return; }
    setLoading(true);
    adminBookingService.list(id, page, PAGE_SIZE)
      .then(setResult)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar reservas'))
      .finally(() => setLoading(false));
  }, [user, authLoading, router, id, page]);

  if (authLoading || loading) return null;

  const totalPages = result ? Math.ceil(result.total / PAGE_SIZE) : 1;

  return (
    <div>
      <div className="mb-6">
        <Link href={`/admin/venues/${id}`} className="text-sm text-gray-500 hover:text-gray-700">← Voltar para o local</Link>
      </div>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reservas</h1>
          <p className="mt-1 text-sm text-gray-500">
            {result ? `${result.total} reserva${result.total !== 1 ? 's' : ''} encontrada${result.total !== 1 ? 's' : ''}` : ''}
          </p>
        </div>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}

      {result?.data.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <span className="text-4xl block mb-3">📅</span>
          <p className="text-gray-500 text-sm">Nenhuma reserva encontrada.</p>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {result?.data.map((booking: AdminBookingDTO) => {
              const status = STATUS_CONFIG[booking.status];
              return (
                <li key={booking.id} className="bg-white rounded-xl border border-gray-200 px-6 py-4 flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-gray-900 text-sm">{booking.courtName}</span>
                    <span className="text-xs text-gray-500">
                      {SPORT_TYPE_LABELS[booking.sportType as SportType]} · {formatDate(booking.date)} às {booking.startTime.slice(0, 5)} · {booking.durationHours}h
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.className}`}>
                      {status.label}
                    </span>
                    <Link
                      href={`/admin/venues/${id}/reservations/${booking.id}`}
                      className="text-sm font-medium text-gray-600 hover:text-gray-900"
                    >
                      Ver →
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Anterior
              </button>
              <span className="text-sm text-gray-500">Página {page} de {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
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
