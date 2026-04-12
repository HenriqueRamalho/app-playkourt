'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { courtService, CreateCourtDTO } from '@/infrastructure/frontend-services/api/court.service';
import { SportType, SPORT_TYPE_LABELS } from '@/domain/court/entity/court.interface';
import { generateFakeCourt } from './court-fake-data';

const EMPTY_FORM: CreateCourtDTO = {
  name: '', sportType: SportType.VOLLEYBALL, description: '', pricePerHour: 0,
};

export default function AddCourtPage() {
  const router = useRouter();
  const { id: venueId } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [form, setForm] = useState<CreateCourtDTO>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (authLoading) return null;
  if (!user) { router.replace('/auth/login'); return null; }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === 'pricePerHour' ? Number(value) : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await courtService.create(venueId, form);
      router.push(`/admin/venues/${venueId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar quadra');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent';

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <Link href={`/admin/venues/${venueId}`} className="text-sm text-gray-500 hover:text-gray-700">← Voltar para o local</Link>
          <h1 className="mt-3 text-2xl font-bold text-gray-900">Nova quadra</h1>
          <p className="mt-1 text-sm text-gray-500">Cadastre uma quadra e associe-a a este local.</p>
        </div>
        <button
          type="button"
          onClick={() => setForm(generateFakeCourt())}
          className="text-xs font-medium text-gray-500 border border-dashed border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-100 transition-colors"
        >
          Preencher automaticamente
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 max-w-xl">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome da quadra <span className="text-red-500">*</span></label>
            <input id="name" name="name" type="text" required value={form.name} onChange={handleChange} placeholder="Ex: Quadra 1" className={inputClass} />
          </div>

          <div>
            <label htmlFor="sportType" className="block text-sm font-medium text-gray-700 mb-1">Modalidade <span className="text-red-500">*</span></label>
            <select id="sportType" name="sportType" required value={form.sportType} onChange={handleChange} className={`${inputClass} bg-white`}>
              {Object.values(SportType).map((type) => (
                <option key={type} value={type}>{SPORT_TYPE_LABELS[type]}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="pricePerHour" className="block text-sm font-medium text-gray-700 mb-1">Preço por hora (R$) <span className="text-red-500">*</span></label>
            <input id="pricePerHour" name="pricePerHour" type="number" required min="0.01" step="0.01" value={form.pricePerHour || ''} onChange={handleChange} placeholder="Ex: 80.00" className={inputClass} />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea id="description" name="description" rows={3} value={form.description} onChange={handleChange} placeholder="Informações adicionais sobre a quadra..." className={`${inputClass} resize-none`} />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Salvando...' : 'Cadastrar quadra'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
