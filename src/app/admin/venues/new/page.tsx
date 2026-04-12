'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { venueService, CreateVenueDTO } from '@/infrastructure/frontend-services/api/venue.service';
import { generateFakeVenue } from './venue-fake-data';
import StateCitySelect from '@/components/StateCitySelect';

const EMPTY_FORM: CreateVenueDTO = {
  name: '', cnpj: '', phone: '', street: '', number: '',
  complement: '', neighborhood: '', cityId: 0, stateId: 0, zipCode: '',
};

export default function NewVenuePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [form, setForm] = useState<CreateVenueDTO>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (authLoading) return null;
  if (!user) { router.replace('/auth/login'); return null; }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await venueService.create(form);
      router.push('/admin/venues');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar venue');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent';

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo local</h1>
          <p className="mt-1 text-sm text-gray-500">Cadastre o endereço físico onde suas quadras estão localizadas.</p>
        </div>
        <button
          type="button"
          onClick={() => setForm(generateFakeVenue())}
          className="text-xs font-medium text-gray-500 border border-dashed border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-100 transition-colors"
        >
          Preencher com dados fictícios
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 max-w-2xl">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <section>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Informações básicas</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome do local <span className="text-red-500">*</span></label>
                <input id="name" name="name" type="text" required value={form.name} onChange={handleChange} placeholder="Ex: Arena Central" className={inputClass} />
              </div>
              <div>
                <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                <input id="cnpj" name="cnpj" type="text" value={form.cnpj} onChange={handleChange} placeholder="00.000.000/0000-00" className={inputClass} />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="(00) 00000-0000" className={inputClass} />
              </div>
            </div>
          </section>

          <div className="border-t border-gray-100" />

          <section>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Endereço</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                <input id="zipCode" name="zipCode" type="text" value={form.zipCode} onChange={handleChange} placeholder="00000-000" className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">Rua</label>
                <input id="street" name="street" type="text" value={form.street} onChange={handleChange} placeholder="Rua das Quadras" className={inputClass} />
              </div>
              <div>
                <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                <input id="number" name="number" type="text" value={form.number} onChange={handleChange} placeholder="123" className={inputClass} />
              </div>
              <div>
                <label htmlFor="complement" className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
                <input id="complement" name="complement" type="text" value={form.complement} onChange={handleChange} placeholder="Bloco A, Sala 2..." className={inputClass} />
              </div>
              <div>
                <label htmlFor="neighborhood" className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                <input id="neighborhood" name="neighborhood" type="text" value={form.neighborhood} onChange={handleChange} placeholder="Centro" className={inputClass} />
              </div>
              <StateCitySelect
                stateId={form.stateId || ''}
                cityId={form.cityId || ''}
                onStateChange={(id) => setForm((prev) => ({ ...prev, stateId: id, cityId: 0 }))}
                onCityChange={(id) => setForm((prev) => ({ ...prev, cityId: id }))}
              />
            </div>
          </section>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Salvando...' : 'Criar local'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
