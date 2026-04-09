'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { venueService, VenueDTO } from '@/infrastructure/frontend-services/api/venue.service';

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{value}</dd>
    </div>
  );
}

export default function VenueDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [venue, setVenue] = useState<VenueDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/auth/login');
      return;
    }

    venueService.getById(id)
      .then(setVenue)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar venue'))
      .finally(() => setLoading(false));
  }, [user, authLoading, router, id]);

  if (authLoading || loading) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/venue" className="text-sm text-gray-500 hover:text-gray-700">
            ← Voltar para venues
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {venue && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{venue.name}</h1>
                <p className="mt-1 text-sm text-gray-500">{venue.city}, {venue.state}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${venue.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {venue.isActive ? 'Ativo' : 'Inativo'}
              </span>
            </div>

            <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <DetailRow label="CNPJ" value={venue.cnpj} />
              <DetailRow label="Telefone" value={venue.phone} />
              <DetailRow label="CEP" value={venue.zipCode} />
              <DetailRow label="Rua" value={venue.street} />
              <DetailRow label="Número" value={venue.number} />
              <DetailRow label="Complemento" value={venue.complement} />
              <DetailRow label="Bairro" value={venue.neighborhood} />
              <DetailRow label="Cidade" value={venue.city} />
              <DetailRow label="Estado" value={venue.state} />
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
