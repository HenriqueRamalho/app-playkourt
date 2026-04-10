'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { courtService, CourtDTO } from '@/infrastructure/frontend-services/api/court.service';
import { SportType, SPORT_TYPE_LABELS } from '@/domain/court/entity/court.interface';

interface EditCourtForm {
  name: string;
  sportType: SportType;
  description: string;
  pricePerHour: number;
  isActive: boolean;
}

function courtToForm(court: CourtDTO): EditCourtForm {
  return {
    name: court.name,
    sportType: court.sportType,
    description: court.description ?? '',
    pricePerHour: court.pricePerHour,
    isActive: court.isActive,
  };
}

export default function EditCourtPage() {
  const router = useRouter();
  const { id: venueId, courtId } = useParams<{ id: string; courtId: string }>();
  const { user, loading: authLoading } = useAuth();
  const [form, setForm] = useState<EditCourtForm | null>(null);
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/auth/login');
      return;
    }

    courtService.getById(venueId, courtId)
      .then((court) => setForm(courtToForm(court)))
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar quadra'))
      .finally(() => setFetching(false));
  }, [user, authLoading, router, venueId, courtId]);

  if (authLoading || fetching) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => {
      if (!prev) return prev;
      if (type === 'checkbox') return { ...prev, [name]: (e.target as HTMLInputElement).checked };
      return { ...prev, [name]: name === 'pricePerHour' ? Number(value) : value };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setLoading(true);
    setError(null);
    try {
      await courtService.update(venueId, courtId, form);
      router.push(`/venue/${venueId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar quadra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto">
        <div className="mb-8">
          <Link href={`/venue/${venueId}`} className="text-sm text-gray-500 hover:text-gray-700">
            ← Voltar para o venue
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-gray-900">Editar Quadra</h1>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {form && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da quadra <span className="text-red-500">*</span>
                </label>
                <input
                  id="name" name="name" type="text" required
                  value={form.name} onChange={handleChange}
                  placeholder="Ex: Quadra 1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="sportType" className="block text-sm font-medium text-gray-700 mb-1">
                  Modalidade <span className="text-red-500">*</span>
                </label>
                <select
                  id="sportType" name="sportType" required
                  value={form.sportType} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {Object.values(SportType).map((type) => (
                    <option key={type} value={type}>{SPORT_TYPE_LABELS[type]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="pricePerHour" className="block text-sm font-medium text-gray-700 mb-1">
                  Preço por hora (R$) <span className="text-red-500">*</span>
                </label>
                <input
                  id="pricePerHour" name="pricePerHour" type="number" required min="0.01" step="0.01"
                  value={form.pricePerHour || ''} onChange={handleChange}
                  placeholder="Ex: 80.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  id="description" name="description" rows={3}
                  value={form.description} onChange={handleChange}
                  placeholder="Informações adicionais sobre a quadra..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="border-t border-gray-100 pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Quadra ativa</p>
                    <p className="text-xs text-gray-500">Desmarque para desativar e impedir novas reservas nesta quadra.</p>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Salvando...' : 'Salvar alterações'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
