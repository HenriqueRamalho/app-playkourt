'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { goService, CourtDetailDTO } from '@/infrastructure/frontend-services/api/go.service';
import { SPORT_TYPE_LABELS, SportType } from '@/domain/court/entity/court.interface';
import { CourtSchedule } from '@/domain/court/value-object/CourtSchedule';
import { generateFakeScheduling } from './scheduling-fake-data';

const DURATION_OPTIONS = [1, 1.5, 2, 2.5, 3, 3.5, 4];
const selectClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed';

export default function SchedulingPage() {
  const { courtId } = useParams<{ courtId: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [court, setCourt] = useState<CourtDetailDTO | null>(null);
  const [fetching, setFetching] = useState(true);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [durationHours, setDurationHours] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/auth/login'); return; }
    goService.getCourtById(courtId)
      .then(setCourt)
      .catch(() => setError('Quadra não encontrada.'))
      .finally(() => setFetching(false));
  }, [courtId, user, authLoading, router]);

  if (authLoading || fetching) return null;

  const schedule = court ? new CourtSchedule(court.businessHours, court.dateExceptions ?? [], court.recurringBlocks ?? []) : null;
  const closedReason = date && schedule ? schedule.getClosedReason(date) : null;
  const isDateOpen = date && schedule ? schedule.isDateOpen(date) : true;
  const availableSlots = date && schedule && isDateOpen ? schedule.getAvailableSlots(date, durationHours) : [];
  const activeBlocks = date && schedule ? schedule.getBlocksForDate(date) : [];

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    setStartTime('');
  };

  const handleDurationChange = (newDuration: number) => {
    setDurationHours(newDuration);
    setStartTime('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await goService.createBooking({ courtId, date, startTime, durationHours });
      router.push('/go/reservations');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar agendamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <Link href="/go" className="text-sm text-gray-500 hover:text-gray-700">← Voltar para busca</Link>

      <div className="mt-4 mb-1 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Agendar quadra</h1>
          <p className="text-gray-500 text-sm mb-8">Escolha a data e o horário desejados.</p>
        </div>
        <button
          type="button"
          onClick={() => { const f = generateFakeScheduling(); setDate(f.date); setStartTime(f.startTime); setDurationHours(f.durationHours); }}
          className="text-xs font-medium text-gray-500 border border-dashed border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-100 transition-colors shrink-0"
        >
          Preencher automaticamente
        </button>
      </div>

      {court && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <p className="font-semibold text-gray-900 text-sm">{court.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">{court.venueName} · {court.neighborhood} · {court.cityName}</p>
          <p className="text-xs text-green-700 font-medium mt-1">{SPORT_TYPE_LABELS[court.sportType as SportType]} · R$ {court.pricePerHour.toFixed(2)}/h</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        {error && <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data <span className="text-red-500">*</span></label>
            <input
              type="date"
              required
              min={today}
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              className={selectClass}
            />
            {date && closedReason && (
              <p className="mt-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                ⚠️ {closedReason}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duração <span className="text-red-500">*</span></label>
            <select value={durationHours} onChange={(e) => handleDurationChange(Number(e.target.value))} className={selectClass}>
              {DURATION_OPTIONS.map((d) => (
                <option key={d} value={d}>{d === 1 ? '1 hora' : `${d} horas`}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Horário de início <span className="text-red-500">*</span></label>
            <select
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              disabled={!date || !isDateOpen}
              className={selectClass}
            >
              <option value="">
                {!date ? 'Selecione uma data primeiro' : !isDateOpen ? 'Indisponível neste dia' : availableSlots.length === 0 ? 'Nenhum horário disponível' : 'Selecione'}
              </option>
              {availableSlots.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            {date && isDateOpen && availableSlots.length === 0 && (
              <p className="mt-2 text-sm text-gray-500">Nenhum horário disponível para {durationHours}h neste dia.</p>
            )}
            {date && isDateOpen && activeBlocks.filter(b => !b.type || b.type === 'recurring').length > 0 && (
              <div className="mt-2 space-y-1">
                {activeBlocks.map((block, i) => (
                  <p key={i} className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                    ⚠️ Horário bloqueado das {block.startTime} às {block.endTime}
                    {block.reason ? ` — ${block.reason}` : ''}
                  </p>
                ))}
              </div>
            )}
          </div>

          {date && startTime && isDateOpen && (
            <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-600">
              Agendamento: <strong>{date}</strong> às <strong>{startTime}</strong> por <strong>{durationHours}h</strong>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-1">
            <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !date || !startTime || !isDateOpen}
              className="px-6 py-2 bg-green-700 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Agendando...' : 'Confirmar agendamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
