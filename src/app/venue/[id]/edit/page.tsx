'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { venueService, CreateVenueDTO, VenueDTO } from '@/infrastructure/frontend-services/api/venue.service';

const BRAZIL_STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

function venueToForm(venue: VenueDTO): CreateVenueDTO {
  return {
    name: venue.name,
    cnpj: venue.cnpj ?? '',
    phone: venue.phone ?? '',
    street: venue.street ?? '',
    number: venue.number ?? '',
    complement: venue.complement ?? '',
    neighborhood: venue.neighborhood ?? '',
    city: venue.city,
    state: venue.state,
    zipCode: venue.zipCode ?? '',
  };
}

export default function EditVenuePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [form, setForm] = useState<CreateVenueDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/auth/login');
      return;
    }

    venueService.getById(id)
      .then((venue) => setForm(venueToForm(venue)))
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar venue'))
      .finally(() => setFetching(false));
  }, [user, authLoading, router, id]);

  if (authLoading || fetching) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => prev ? { ...prev, [e.target.name]: e.target.value } : prev);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setLoading(true);
    setError(null);
    try {
      await venueService.update(id, form);
      router.push(`/venue/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar venue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <Link href={`/venue/${id}`} className="text-sm text-gray-500 hover:text-gray-700">
              ← Voltar para detalhes
            </Link>
            <h1 className="mt-3 text-2xl font-bold text-gray-900">Editar Venue</h1>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {form && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <section>
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Informações básicas</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Nome do venue <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="name" name="name" type="text" required
                      value={form.name} onChange={handleChange}
                      placeholder="Ex: Arena Central"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                    <input
                      id="cnpj" name="cnpj" type="text"
                      value={form.cnpj} onChange={handleChange}
                      placeholder="00.000.000/0000-00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                    <input
                      id="phone" name="phone" type="tel"
                      value={form.phone} onChange={handleChange}
                      placeholder="(00) 00000-0000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </section>

              <div className="border-t border-gray-100" />

              <section>
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Endereço</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                    <input
                      id="zipCode" name="zipCode" type="text"
                      value={form.zipCode} onChange={handleChange}
                      placeholder="00000-000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">Rua</label>
                    <input
                      id="street" name="street" type="text"
                      value={form.street} onChange={handleChange}
                      placeholder="Rua das Quadras"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                    <input
                      id="number" name="number" type="text"
                      value={form.number} onChange={handleChange}
                      placeholder="123"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="complement" className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
                    <input
                      id="complement" name="complement" type="text"
                      value={form.complement} onChange={handleChange}
                      placeholder="Bloco A, Sala 2..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="neighborhood" className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                    <input
                      id="neighborhood" name="neighborhood" type="text"
                      value={form.neighborhood} onChange={handleChange}
                      placeholder="Centro"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                      Cidade <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="city" name="city" type="text" required
                      value={form.city} onChange={handleChange}
                      placeholder="São Paulo"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                      Estado <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="state" name="state" required
                      value={form.state} onChange={handleChange}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white ${!form.state ? 'text-gray-500' : 'text-gray-900'}`}
                    >
                      <option value="">Selecione</option>
                      {BRAZIL_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

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
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
