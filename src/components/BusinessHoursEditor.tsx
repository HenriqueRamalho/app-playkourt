'use client';

import { BusinessHours, DAY_OF_WEEK_LABELS } from '@/domain/venue/entity/venue.interface';

interface Props {
  value: BusinessHours[];
  onChange: (hours: BusinessHours[]) => void;
}

const PRESETS = [
  {
    label: 'Seg – Sex',
    apply: (hours: BusinessHours[]) =>
      hours.map((h) => ({
        ...h,
        isClosed: h.dayOfWeek === 0 || h.dayOfWeek === 6,
        openTime: h.dayOfWeek === 0 || h.dayOfWeek === 6 ? null : '08:00',
        closeTime: h.dayOfWeek === 0 || h.dayOfWeek === 6 ? null : '22:00',
      })),
  },
  {
    label: 'Seg – Sáb',
    apply: (hours: BusinessHours[]) =>
      hours.map((h) => ({
        ...h,
        isClosed: h.dayOfWeek === 0,
        openTime: h.dayOfWeek === 0 ? null : '08:00',
        closeTime: h.dayOfWeek === 0 ? null : '22:00',
      })),
  },
  {
    label: 'Todos os dias',
    apply: (hours: BusinessHours[]) =>
      hours.map((h) => ({ ...h, isClosed: false, openTime: '08:00', closeTime: '22:00' })),
  },
];

const inputClass = 'px-2 py-1.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-40 disabled:cursor-not-allowed';

export default function BusinessHoursEditor({ value, onChange }: Props) {
  const update = (dayOfWeek: number, patch: Partial<BusinessHours>) =>
    onChange(value.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, ...patch } : h)));

  const applyToAll = (openTime: string, closeTime: string) =>
    onChange(value.map((h) => (h.isClosed ? h : { ...h, openTime, closeTime })));

  return (
    <div className="space-y-4">

      {/* Presets */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-400 mr-1">Atalhos:</span>
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => onChange(preset.apply(value))}
            className="px-3 py-1 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Linhas por dia */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        {value.map((h, idx) => (
          <div
            key={h.dayOfWeek}
            className={`flex items-center gap-3 px-4 py-3 ${idx !== value.length - 1 ? 'border-b border-gray-100' : ''} ${h.isClosed ? 'bg-gray-50' : 'bg-white'}`}
          >
            {/* Toggle aberto/fechado */}
            <button
              type="button"
              onClick={() => update(h.dayOfWeek, {
                isClosed: !h.isClosed,
                openTime: h.isClosed ? '08:00' : null,
                closeTime: h.isClosed ? '22:00' : null,
              })}
              className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors focus:outline-none ${h.isClosed ? 'bg-gray-200' : 'bg-green-500'}`}
            >
              <span className={`inline-block h-4 w-4 mt-0.5 rounded-full bg-white shadow transition-transform ${h.isClosed ? 'translate-x-0.5' : 'translate-x-4'}`} />
            </button>

            {/* Nome do dia */}
            <span className={`w-16 text-sm shrink-0 ${h.isClosed ? 'text-gray-400' : 'text-gray-700'}`}>
              {DAY_OF_WEEK_LABELS[h.dayOfWeek]}
            </span>

            {h.isClosed ? (
              <span className="text-xs text-gray-400 italic">Fechado</span>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={h.openTime ?? ''}
                  onChange={(e) => update(h.dayOfWeek, { openTime: e.target.value })}
                  className={inputClass}
                />
                <span className="text-sm text-gray-400">até</span>
                <input
                  type="time"
                  value={h.closeTime ?? ''}
                  onChange={(e) => update(h.dayOfWeek, { closeTime: e.target.value })}
                  className={inputClass}
                />
                <button
                  type="button"
                  title="Aplicar a todos os dias abertos"
                  onClick={() => applyToAll(h.openTime!, h.closeTime!)}
                  className="ml-1 text-xs text-gray-400 hover:text-green-600 transition-colors whitespace-nowrap"
                >
                  Aplicar a todos
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}
