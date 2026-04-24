'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { venueService, CreateVenueDTO, VenueDTO } from '@/infrastructure/frontend-services/api/venue.service';
import { venueImageService, type VenueImageDTO } from '@/infrastructure/frontend-services/api/venue-image.service';
import StateCitySelect from '@/components/StateCitySelect';
import BusinessHoursEditor from '@/components/BusinessHoursEditor';
import { VenuePhotosSection } from './_components/VenuePhotosSection';

function venueToForm(venue: VenueDTO): CreateVenueDTO {
  return {
    name: venue.name, cnpj: venue.cnpj ?? '', phone: venue.phone ?? '',
    street: venue.street ?? '', number: venue.number ?? '',
    complement: venue.complement ?? '', neighborhood: venue.neighborhood ?? '',
    cityId: venue.cityId, stateId: venue.stateId, zipCode: venue.zipCode ?? '',
    minBookingLeadMinutes: venue.minBookingLeadMinutes ?? null,
    businessHours: venue.businessHours,
  };
}

export default function EditVenuePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [form, setForm] = useState<CreateVenueDTO | null>(null);
  const [photos, setPhotos] = useState<VenueImageDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/auth/login'); return; }
    Promise.all([
      venueService.getById(id),
      venueImageService.list(id),
    ])
      .then(([venue, images]) => {
        setForm(venueToForm(venue));
        setPhotos(images);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar venue'))
      .finally(() => setFetching(false));
  }, [user, authLoading, router, id]);

  if (authLoading || fetching) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => prev ? { ...prev, [e.target.name]: e.target.value } : prev);
  };

  const handleLeadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const hours = parseFloat(raw);
    setForm((prev) => prev ? {
      ...prev,
      minBookingLeadMinutes: raw === '' || isNaN(hours) || hours <= 0 ? null : Math.round(hours * 60),
    } : prev);
  };

  const leadHoursDisplay = form?.minBookingLeadMinutes != null && form.minBookingLeadMinutes > 0
    ? String(form.minBookingLeadMinutes / 60)
    : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setLoading(true);
    setError(null);
    try {
      await venueService.update(id, form);
      router.push(`/admin/venues/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar venue');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent';

  return (
    <div>
      <div className="mb-8">
        <Link href={`/admin/venues/${id}`} className="text-sm text-gray-500 hover:text-gray-700">← Voltar para detalhes</Link>
        <h1 className="mt-3 text-2xl font-bold text-gray-900">Editar local</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 max-w-2xl">
        {error && <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}

        {form && (
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
                  onStateChange={(sid) => setForm((prev) => prev ? { ...prev, stateId: sid, cityId: 0 } : prev)}
                  onCityChange={(cid) => setForm((prev) => prev ? { ...prev, cityId: cid } : prev)}
                />
              </div>
            </section>

            <div className="border-t border-gray-100" />

            <section>
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Reservas</h2>
              <div>
                <label htmlFor="minBookingLeadHours" className="block text-sm font-medium text-gray-700 mb-1">
                  Antecedência mínima de reserva
                </label>
                <div className="flex items-center gap-2 max-w-xs">
                  <input
                    id="minBookingLeadHours"
                    name="minBookingLeadHours"
                    type="number"
                    min="0"
                    step="0.5"
                    value={leadHoursDisplay}
                    onChange={handleLeadChange}
                    placeholder="Ex: 2"
                    className={inputClass}
                  />
                  <span className="text-sm text-gray-500 whitespace-nowrap">horas</span>
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  Tempo mínimo entre o momento da reserva e o início do horário. Deixe em branco para não aplicar restrição.
                </p>
              </div>
            </section>

            <div className="border-t border-gray-100" />

            <section>
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Horário de funcionamento</h2>
              <BusinessHoursEditor
                value={form.businessHours ?? []}
                onChange={(businessHours) => setForm((prev) => prev ? { ...prev, businessHours } : prev)}
              />
            </section>

            <div className="border-t border-gray-100" />

            <VenuePhotosSection venueId={id} initialPhotos={photos} />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={loading} className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
