'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { courtService, CourtDTO, UpdateScheduleResponseDTO } from '@/infrastructure/frontend-services/api/court.service';
import { venueService, VenueDTO } from '@/infrastructure/frontend-services/api/venue.service';
import { BusinessHours, DAY_OF_WEEK_LABELS, DEFAULT_BUSINESS_HOURS } from '@/domain/venue/entity/venue.interface';
import { CourtDateException, CourtRecurringBlock } from '@/domain/court/entity/court.interface';
import BusinessHoursEditor from '@/components/BusinessHoursEditor';

const inputClass = 'px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent';

export default function CourtSchedulePage() {
  const { id: venueId, courtId } = useParams<{ id: string; courtId: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [court, setCourt] = useState<CourtDTO | null>(null);
  const [venue, setVenue] = useState<VenueDTO | null>(null);
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [affectedBookings, setAffectedBookings] = useState<{ date: string; count: number }[]>([]);

  const [useVenueHours, setUseVenueHours] = useState(true);
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>(DEFAULT_BUSINESS_HOURS);
  const [dateExceptions, setDateExceptions] = useState<CourtDateException[]>([]);
  const [recurringBlocks, setRecurringBlocks] = useState<CourtRecurringBlock[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/auth/login'); return; }

    Promise.all([courtService.getById(venueId, courtId), venueService.getById(venueId)])
      .then(([courtData, venueData]) => {
        setCourt(courtData);
        setVenue(venueData);
        setUseVenueHours(courtData.useVenueHours ?? true);
        setBusinessHours(courtData.useVenueHours ? venueData.businessHours : (courtData.businessHours ?? []));
        setDateExceptions(courtData.dateExceptions ?? []);
        setRecurringBlocks(courtData.recurringBlocks ?? []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar dados'))
      .finally(() => setFetching(false));
  }, [user, authLoading, router, venueId, courtId]);

  if (authLoading || fetching) return null;

  const handleToggleVenueHours = (checked: boolean) => {
    setUseVenueHours(checked);
    if (!checked && venue) {
      // Cenário 2: pré-preenche com o horário atual do venue
      setBusinessHours(venue.businessHours.length > 0 ? venue.businessHours : DEFAULT_BUSINESS_HOURS);
    }
  };

  const addDateException = () => {
    setDateExceptions((prev) => [...prev, { date: '', isFullDayBlock: true, reason: '' }]);
  };

  const updateDateException = (idx: number, patch: Partial<CourtDateException>) => {
    setDateExceptions((prev) => prev.map((e, i) => i === idx ? { ...e, ...patch } : e));
  };

  const removeDateException = (idx: number) => {
    setDateExceptions((prev) => prev.filter((_, i) => i !== idx));
  };

  const addRecurringBlock = () => {
    setRecurringBlocks((prev) => [...prev, { dayOfWeek: 1, startTime: '07:00', endTime: '12:00', reason: '' }]);
  };

  const updateRecurringBlock = (idx: number, patch: Partial<CourtRecurringBlock>) => {
    setRecurringBlocks((prev) => prev.map((b, i) => i === idx ? { ...b, ...patch } : b));
  };

  const removeRecurringBlock = (idx: number) => {
    setRecurringBlocks((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    setAffectedBookings([]);
    try {
      const result: UpdateScheduleResponseDTO = await courtService.updateSchedule(venueId, courtId, {
        useVenueHours,
        businessHours: useVenueHours ? [] : businessHours,
        dateExceptions,
        recurringBlocks,
      });
      if (result.affectedBookings?.length > 0) {
        setAffectedBookings(result.affectedBookings);
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <Link href={`/admin/venues/${venueId}`} className="text-sm text-gray-500 hover:text-gray-700">← Voltar para o local</Link>
        <h1 className="mt-3 text-2xl font-bold text-gray-900">Horário da quadra</h1>
        {court && <p className="mt-1 text-sm text-gray-500">{court.name}</p>}
      </div>

      {error && <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}
      {success && <div className="mb-5 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">Configurações salvas com sucesso.</div>}

      {/* Cenário 5: alerta de agendamentos afetados */}
      {affectedBookings.length > 0 && (
        <div className="mb-5 bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-lg space-y-1">
          <p className="font-medium">⚠️ Atenção: existem agendamentos nas datas bloqueadas</p>
          {affectedBookings.map(({ date, count }) => (
            <p key={date}>• {date}: {count} agendamento{count > 1 ? 's' : ''} pendente{count > 1 ? 's' : ''} — revise manualmente.</p>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Cenários 1, 2, 7 — toggle seguir venue */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={useVenueHours}
              onChange={(e) => handleToggleVenueHours(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">Seguir horário do estabelecimento</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {useVenueHours && venue
                  ? `Horário atual: ${venue.businessHours.find(h => !h.isClosed)?.openTime ?? '—'} às ${venue.businessHours.find(h => !h.isClosed)?.closeTime ?? '—'}`
                  : 'Desmarque para definir um horário específico para esta quadra.'}
              </p>
            </div>
          </label>
        </div>

        {/* Cenários 3, 4 — horário específico */}
        {!useVenueHours && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Horário específico da quadra</h2>
            <BusinessHoursEditor value={businessHours} onChange={setBusinessHours} />
          </div>
        )}

        {/* Cenário 5 — bloqueios pontuais */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Bloqueios pontuais</h2>
              <p className="text-xs text-gray-500 mt-0.5">Bloqueie datas específicas (ex: manutenção, feriado).</p>
            </div>
            <button type="button" onClick={addDateException} className="text-xs font-medium text-green-700 border border-green-300 rounded-lg px-3 py-1.5 hover:bg-green-50 transition-colors">
              + Adicionar
            </button>
          </div>

          {dateExceptions.length === 0
            ? <p className="text-sm text-gray-400 italic">Nenhum bloqueio pontual configurado.</p>
            : (
              <div className="space-y-3">
                {dateExceptions.map((ex, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Data</label>
                        <input type="date" value={ex.date} onChange={(e) => updateDateException(idx, { date: e.target.value })} className={`${inputClass} w-full`} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Motivo</label>
                        <input type="text" value={ex.reason ?? ''} onChange={(e) => updateDateException(idx, { reason: e.target.value })} placeholder="Ex: Manutenção" className={`${inputClass} w-full`} />
                      </div>
                      <div className="col-span-2">
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                          <input type="checkbox" checked={ex.isFullDayBlock} onChange={(e) => updateDateException(idx, { isFullDayBlock: e.target.checked })} className="rounded border-gray-300 text-green-600" />
                          Bloquear o dia inteiro
                        </label>
                      </div>
                      {!ex.isFullDayBlock && (
                        <div className="col-span-2 flex items-center gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Das</label>
                            <input type="time" value={ex.startTime ?? ''} onChange={(e) => updateDateException(idx, { startTime: e.target.value })} className={inputClass} />
                          </div>
                          <span className="text-sm text-gray-400 mt-4">até</span>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Às</label>
                            <input type="time" value={ex.endTime ?? ''} onChange={(e) => updateDateException(idx, { endTime: e.target.value })} className={inputClass} />
                          </div>
                        </div>
                      )}
                    </div>
                    <button type="button" onClick={() => removeDateException(idx)} className="text-red-400 hover:text-red-600 text-xs mt-1">✕</button>
                  </div>
                ))}
              </div>
            )
          }
        </div>

        {/* Cenário 6 — bloqueios recorrentes */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Bloqueios recorrentes</h2>
              <p className="text-xs text-gray-500 mt-0.5">Bloqueie intervalos fixos por dia da semana (ex: contrato com escola).</p>
            </div>
            <button type="button" onClick={addRecurringBlock} className="text-xs font-medium text-green-700 border border-green-300 rounded-lg px-3 py-1.5 hover:bg-green-50 transition-colors">
              + Adicionar
            </button>
          </div>

          {recurringBlocks.length === 0
            ? <p className="text-sm text-gray-400 italic">Nenhum bloqueio recorrente configurado.</p>
            : (
              <div className="space-y-3">
                {recurringBlocks.map((block, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Dia da semana</label>
                        <select value={block.dayOfWeek} onChange={(e) => updateRecurringBlock(idx, { dayOfWeek: Number(e.target.value) as CourtRecurringBlock['dayOfWeek'] })} className={`${inputClass} w-full`}>
                          {[0, 1, 2, 3, 4, 5, 6].map((d) => <option key={d} value={d}>{DAY_OF_WEEK_LABELS[d]}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Motivo</label>
                        <input type="text" value={block.reason ?? ''} onChange={(e) => updateRecurringBlock(idx, { reason: e.target.value })} placeholder="Ex: Escola de vôlei" className={`${inputClass} w-full`} />
                      </div>
                      <div className="flex items-center gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Das</label>
                          <input type="time" value={block.startTime} onChange={(e) => updateRecurringBlock(idx, { startTime: e.target.value })} className={inputClass} />
                        </div>
                        <span className="text-sm text-gray-400 mt-4">até</span>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Às</label>
                          <input type="time" value={block.endTime} onChange={(e) => updateRecurringBlock(idx, { endTime: e.target.value })} className={inputClass} />
                        </div>
                      </div>
                    </div>
                    <button type="button" onClick={() => removeRecurringBlock(idx)} className="text-red-400 hover:text-red-600 text-xs mt-1">✕</button>
                  </div>
                ))}
              </div>
            )
          }
        </div>

        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={loading} className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'Salvando...' : 'Salvar configurações'}
          </button>
        </div>
      </form>
    </div>
  );
}
