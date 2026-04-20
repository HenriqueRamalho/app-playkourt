'use client';

import Link from 'next/link';
import { use, useCallback, useEffect, useState } from 'react';
import { BanUserModal } from './_components/BanUserModal';
import { BookingsTab } from './_components/BookingsTab';
import { OverviewTab } from './_components/OverviewTab';
import { SessionsTab } from './_components/SessionsTab';
import { UnbanUserModal } from './_components/UnbanUserModal';
import { UserHeader } from './_components/UserHeader';
import { VenuesTab } from './_components/VenuesTab';
import type {
  BookingsResponse,
  OverviewDTO,
  SessionsResponse,
  VenuesDTO,
} from './_components/types';

type TabKey = 'overview' | 'venues' | 'bookings' | 'payments' | 'sessions';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Visão geral' },
  { key: 'venues', label: 'Venues' },
  { key: 'bookings', label: 'Reservas' },
  { key: 'payments', label: 'Pagamentos' },
  { key: 'sessions', label: 'Sessões' },
];

const ACTION_NOT_AVAILABLE_MSG =
  'Funcionalidade em desenvolvimento — será liberada em uma spec adjacente.';

interface BookingsFilters {
  status: string;
  from: string;
  to: string;
}

const EMPTY_BOOKINGS_FILTERS: BookingsFilters = { status: '', from: '', to: '' };

export default function BackofficeUserViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const [overview, setOverview] = useState<OverviewDTO | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [overviewNotFound, setOverviewNotFound] = useState(false);

  const [venues, setVenues] = useState<VenuesDTO | null>(null);
  const [venuesLoading, setVenuesLoading] = useState(false);
  const [venuesError, setVenuesError] = useState<string | null>(null);
  const [venuesLoaded, setVenuesLoaded] = useState(false);

  const [bookings, setBookings] = useState<BookingsResponse | null>(null);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [bookingsLoaded, setBookingsLoaded] = useState(false);
  const [bookingsFilters, setBookingsFilters] = useState<BookingsFilters>(EMPTY_BOOKINGS_FILTERS);
  const [bookingsPage, setBookingsPage] = useState(1);

  const [sessions, setSessions] = useState<SessionsResponse | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);

  const [banModalOpen, setBanModalOpen] = useState(false);
  const [unbanModalOpen, setUnbanModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    setOverviewLoading(true);
    setOverviewError(null);
    setOverviewNotFound(false);
    try {
      const res = await fetch(`/api/backoffice/users/${id}`, { credentials: 'include' });
      if (res.status === 404) {
        setOverviewNotFound(true);
        setOverview(null);
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Erro ${res.status}`);
      }
      setOverview(await res.json());
    } catch (err) {
      setOverviewError(err instanceof Error ? err.message : 'Erro ao carregar usuário');
    } finally {
      setOverviewLoading(false);
    }
  }, [id]);

  const fetchVenues = useCallback(async () => {
    setVenuesLoading(true);
    setVenuesError(null);
    try {
      const res = await fetch(`/api/backoffice/users/${id}/venues`, { credentials: 'include' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Erro ${res.status}`);
      }
      setVenues(await res.json());
      setVenuesLoaded(true);
    } catch (err) {
      setVenuesError(err instanceof Error ? err.message : 'Erro ao carregar venues');
    } finally {
      setVenuesLoading(false);
    }
  }, [id]);

  const fetchBookings = useCallback(
    async (filters: BookingsFilters, page: number) => {
      setBookingsLoading(true);
      setBookingsError(null);
      try {
        const params = new URLSearchParams();
        if (filters.status) params.set('status', filters.status);
        if (filters.from) params.set('from', filters.from);
        if (filters.to) params.set('to', filters.to);
        params.set('page', String(page));
        params.set('pageSize', '20');

        const res = await fetch(
          `/api/backoffice/users/${id}/bookings?${params.toString()}`,
          { credentials: 'include' },
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Erro ${res.status}`);
        }
        setBookings(await res.json());
        setBookingsLoaded(true);
      } catch (err) {
        setBookingsError(err instanceof Error ? err.message : 'Erro ao carregar reservas');
      } finally {
        setBookingsLoading(false);
      }
    },
    [id],
  );

  const fetchSessions = useCallback(async () => {
    setSessionsLoading(true);
    setSessionsError(null);
    try {
      const res = await fetch(`/api/backoffice/users/${id}/sessions`, { credentials: 'include' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Erro ${res.status}`);
      }
      setSessions(await res.json());
      setSessionsLoaded(true);
    } catch (err) {
      setSessionsError(err instanceof Error ? err.message : 'Erro ao carregar sessões');
    } finally {
      setSessionsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    if (activeTab === 'venues' && !venuesLoaded && !venuesLoading) fetchVenues();
    if (activeTab === 'bookings' && !bookingsLoaded && !bookingsLoading) {
      fetchBookings(bookingsFilters, bookingsPage);
    }
    if (activeTab === 'sessions' && !sessionsLoaded && !sessionsLoading) fetchSessions();
  }, [
    activeTab,
    venuesLoaded,
    venuesLoading,
    bookingsLoaded,
    bookingsLoading,
    sessionsLoaded,
    sessionsLoading,
    fetchVenues,
    fetchBookings,
    fetchSessions,
    bookingsFilters,
    bookingsPage,
  ]);

  const handleBookingsFilters = (filters: BookingsFilters) => {
    setBookingsFilters(filters);
    setBookingsPage(1);
    fetchBookings(filters, 1);
  };

  const handleBookingsPage = (page: number) => {
    setBookingsPage(page);
    fetchBookings(bookingsFilters, page);
  };

  const handleAction = () => {
    alert(ACTION_NOT_AVAILABLE_MSG);
  };

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 4000);
  };

  const handleBanClick = () => {
    if (!overview) return;
    if (overview.banned) setUnbanModalOpen(true);
    else setBanModalOpen(true);
  };

  const handleBanSuccess = async ({ revokedSessions }: { revokedSessions: number }) => {
    setBanModalOpen(false);
    setSessionsLoaded(false);
    setSessions(null);
    await fetchOverview();
    showToast(
      revokedSessions > 0
        ? `Usuário banido · ${revokedSessions} ${revokedSessions === 1 ? 'sessão revogada' : 'sessões revogadas'}.`
        : 'Usuário banido.',
    );
  };

  const handleUnbanSuccess = async () => {
    setUnbanModalOpen(false);
    await fetchOverview();
    showToast('Usuário desbanido.');
  };

  if (overviewLoading) {
    return <div className="text-gray-500 text-sm">Carregando usuário...</div>;
  }

  if (overviewNotFound) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Usuário não encontrado</h1>
        <p className="text-sm text-gray-500 mb-4">
          O usuário que você tentou acessar não existe ou foi removido.
        </p>
        <Link href="/backoffice/users" className="text-sm text-green-700 hover:underline">
          ← Voltar para listagem
        </Link>
      </div>
    );
  }

  if (overviewError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
        {overviewError}
      </div>
    );
  }

  if (!overview) return null;

  return (
    <div>
      <div className="mb-4">
        <Link href="/backoffice/users" className="text-sm text-gray-500 hover:text-gray-700">
          ← Voltar para listagem
        </Link>
      </div>

      <UserHeader
        overview={overview}
        onOpenVenues={() => setActiveTab('venues')}
        onActionBan={handleBanClick}
        onActionRevokeAll={handleAction}
        onActionImpersonate={handleAction}
        onActionResendVerification={handleAction}
      />

      <div className="border-b border-gray-200 mb-4">
        <nav className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-green-600 text-green-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && <OverviewTab overview={overview} />}
      {activeTab === 'venues' && (
        <VenuesTab data={venues} loading={venuesLoading} error={venuesError} />
      )}
      {activeTab === 'bookings' && (
        <BookingsTab
          data={bookings}
          loading={bookingsLoading}
          error={bookingsError}
          page={bookingsPage}
          onApplyFilters={handleBookingsFilters}
          onChangePage={handleBookingsPage}
        />
      )}
      {activeTab === 'payments' && (
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-8 text-center text-sm text-gray-500">
          Em breve — aguardando feature de pagamentos.
        </div>
      )}
      {activeTab === 'sessions' && (
        <SessionsTab
          data={sessions}
          loading={sessionsLoading}
          error={sessionsError}
          onRevoke={handleAction}
        />
      )}

      {banModalOpen && overview && (
        <BanUserModal
          userId={overview.id}
          userName={overview.name}
          userEmail={overview.email}
          onClose={() => setBanModalOpen(false)}
          onSuccess={handleBanSuccess}
        />
      )}

      {unbanModalOpen && overview && (
        <UnbanUserModal
          userId={overview.id}
          userName={overview.name}
          userEmail={overview.email}
          onClose={() => setUnbanModalOpen(false)}
          onSuccess={handleUnbanSuccess}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
