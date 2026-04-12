'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { adminBookingService, AdminBookingDTO } from '@/infrastructure/frontend-services/api/admin-booking.service';
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{value}</dd>
    </div>
  );
}

export default function ReservationDetailPage() {
  const { id, reservationId } = useParams<{ id: string; reservationId: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [booking, setBooking] = useState<AdminBookingDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/auth/login'); return; }
    adminBookingService.getById(id, reservationId)
      .then(setBooking)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar reserva'))
      .finally(() => setLoading(false));
  }, [user, authLoading, router, id, reservationId]);

  if (authLoading || loading) return null;

  const handleUpdateStatus = async (status: BookingStatus) => {
    setUpdating(true);
    setError(null);
    try {
      const updated = await adminBookingService.updateStatus(id, reservationId, status);
      setBooking((prev) => prev ? { ...prev, status: updated.status } : prev);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar reserva');
    } finally {
      setUpdating(false);
    }
  };

  const status = booking ? STATUS_CONFIG[booking.status] : null;
  const isPending = booking?.status === BookingStatus.PENDING;

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link href={`/admin/venues/${id}/reservations`} className="text-sm text-gray-500 hover:text-gray-700">← Voltar para reservas</Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Detalhes da reserva</h1>
      <p className="text-gray-500 text-sm mb-8">Revise as informações e tome uma ação.</p>

      {error && <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}

      {booking && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">{booking.courtName}</h2>
            {status && (
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.className}`}>
                {status.label}
              </span>
            )}
          </div>

          <dl className="grid grid-cols-2 gap-5">
            <DetailRow label="Local" value={booking.venueName} />
            <DetailRow label="Modalidade" value={SPORT_TYPE_LABELS[booking.sportType as SportType]} />
            <DetailRow label="Data" value={formatDate(booking.date)} />
            <DetailRow label="Horário" value={booking.startTime.slice(0, 5)} />
            <DetailRow label="Duração" value={`${booking.durationHours}h`} />
            <DetailRow label="ID do usuário" value={booking.userId} />
          </dl>

          {isPending && (
            <>
              <div className="border-t border-gray-100" />
              <div className="flex gap-3">
                <button
                  onClick={() => handleUpdateStatus(BookingStatus.CONFIRMED)}
                  disabled={updating}
                  className="flex-1 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? 'Salvando...' : '✓ Aprovar'}
                </button>
                <button
                  onClick={() => handleUpdateStatus(BookingStatus.CANCELLED)}
                  disabled={updating}
                  className="flex-1 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? 'Salvando...' : '✕ Cancelar'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
