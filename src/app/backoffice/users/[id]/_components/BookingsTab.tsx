'use client';

import { FormEvent, useState } from 'react';
import { BookingsResponse, formatDate } from './types';

interface Filters {
  status: string;
  from: string;
  to: string;
}

const EMPTY_FILTERS: Filters = { status: '', from: '', to: '' };

interface Props {
  data: BookingsResponse | null;
  loading: boolean;
  error: string | null;
  page: number;
  onApplyFilters: (filters: Filters) => void;
  onChangePage: (page: number) => void;
}

export function BookingsTab({ data, loading, error, page, onApplyFilters, onChangePage }: Props) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onApplyFilters(filters);
  };

  const handleReset = () => {
    setFilters(EMPTY_FILTERS);
    onApplyFilters(EMPTY_FILTERS);
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-3"
      >
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Todos</option>
            <option value="pending">Pendente</option>
            <option value="confirmed">Confirmada</option>
            <option value="cancelled">Cancelada</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">De</label>
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Até</label>
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
          >
            Filtrar
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Limpar
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Data</th>
                <th className="px-4 py-2 text-left font-medium">Horário</th>
                <th className="px-4 py-2 text-left font-medium">Duração</th>
                <th className="px-4 py-2 text-left font-medium">Quadra</th>
                <th className="px-4 py-2 text-left font-medium">Venue</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    Carregando...
                  </td>
                </tr>
              )}
              {!loading && data && data.data.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    Nenhuma reserva encontrada.
                  </td>
                </tr>
              )}
              {!loading &&
                data?.data.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-800">{formatDate(booking.date)}</td>
                    <td className="px-4 py-2 text-gray-800">{booking.startTime}</td>
                    <td className="px-4 py-2 text-gray-800">{booking.durationHours}h</td>
                    <td className="px-4 py-2 text-gray-800">{booking.courtName}</td>
                    <td className="px-4 py-2 text-gray-800">{booking.venueName}</td>
                    <td className="px-4 py-2">
                      <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {data && data.total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-600">
            <span>
              {data.total} resultado{data.total === 1 ? '' : 's'} · página {data.page} de{' '}
              {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onChangePage(Math.max(1, page - 1))}
                disabled={page <= 1 || loading}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 disabled:opacity-50 hover:bg-gray-50"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => onChangePage(page < totalPages ? page + 1 : page)}
                disabled={page >= totalPages || loading}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 disabled:opacity-50 hover:bg-gray-50"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
