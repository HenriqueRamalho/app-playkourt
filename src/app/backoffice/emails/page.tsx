'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { EmailDetailDrawer } from './_components/email-detail-drawer';
import {
  EMPTY_FILTERS,
  Filters,
  ProcessedEmailListResponse,
  PROVIDER_LABELS,
  PROVIDER_OPTIONS,
  PROVIDER_STATUS_LABELS,
  PROVIDER_STATUS_OPTIONS,
  STATUS_LABELS,
} from './_components/types';

const DEFAULT_PAGE_SIZE = 20;

function formatDate(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toIsoRange(filters: Filters): { sentFrom?: string; sentTo?: string } {
  const result: { sentFrom?: string; sentTo?: string } = {};
  if (filters.sentFrom) {
    result.sentFrom = new Date(`${filters.sentFrom}T00:00:00`).toISOString();
  }
  if (filters.sentTo) {
    result.sentTo = new Date(`${filters.sentTo}T23:59:59.999`).toISOString();
  }
  return result;
}

export default function BackofficeEmailsPage() {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [response, setResponse] = useState<ProcessedEmailListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);

  const fetchEmails = useCallback(async (current: Filters, currentPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      const range = toIsoRange(current);
      if (range.sentFrom) params.set('sentFrom', range.sentFrom);
      if (range.sentTo) params.set('sentTo', range.sentTo);
      if (current.to) params.set('to', current.to);
      if (current.subject) params.set('subject', current.subject);
      if (current.from) params.set('from', current.from);
      if (current.recipientUserId) params.set('recipientUserId', current.recipientUserId);
      if (current.metadataKey && current.metadataValue) {
        params.set('metadataKey', current.metadataKey);
        params.set('metadataValue', current.metadataValue);
      }
      if (current.provider) params.set('provider', current.provider);
      if (current.status) params.set('status', current.status);
      params.set('page', String(currentPage));
      params.set('pageSize', String(DEFAULT_PAGE_SIZE));

      const res = await fetch(`/api/backoffice/emails?${params.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Erro ${res.status}`);
      }
      setResponse(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar emails');
      setResponse(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmails(appliedFilters, page);
  }, [appliedFilters, page, fetchEmails]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setAppliedFilters(filters);
  };

  const handleReset = () => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
    setAppliedFilters(EMPTY_FILTERS);
  };

  const totalPages = response ? Math.max(1, Math.ceil(response.total / response.pageSize)) : 1;

  const handleResendSuccess = (newId: string) => {
    fetchEmails(appliedFilters, page);
    setSelectedEmailId(newId);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Emails processados</h1>
        <p className="text-gray-500 text-sm">
          Todos os emails que o sistema processou, com filtros por período, destinatário, assunto,
          remetente e metadados.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-xl p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3"
      >
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">De (data)</label>
          <input
            type="date"
            value={filters.sentFrom}
            onChange={(e) => setFilters((f) => ({ ...f, sentFrom: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Até (data)</label>
          <input
            type="date"
            value={filters.sentTo}
            onChange={(e) => setFilters((f) => ({ ...f, sentTo: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Destinatário (email)</label>
          <input
            type="text"
            value={filters.to}
            onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
            placeholder="contém…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Assunto</label>
          <input
            type="text"
            value={filters.subject}
            onChange={(e) => setFilters((f) => ({ ...f, subject: e.target.value }))}
            placeholder="contém…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Remetente</label>
          <input
            type="text"
            value={filters.from}
            onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
            placeholder="contém…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Destinatário (userId)</label>
          <input
            type="text"
            value={filters.recipientUserId}
            onChange={(e) => setFilters((f) => ({ ...f, recipientUserId: e.target.value }))}
            placeholder="uuid exato"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Metadado (chave)</label>
          <input
            type="text"
            value={filters.metadataKey}
            onChange={(e) => setFilters((f) => ({ ...f, metadataKey: e.target.value }))}
            placeholder="ex: bookingId"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Metadado (valor)</label>
          <input
            type="text"
            value={filters.metadataValue}
            onChange={(e) => setFilters((f) => ({ ...f, metadataValue: e.target.value }))}
            placeholder="valor exato"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Provedor</label>
          <select
            value={filters.provider}
            onChange={(e) => setFilters((f) => ({ ...f, provider: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {PROVIDER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Status do provedor
          </label>
          <select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {PROVIDER_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-4 flex items-center gap-2">
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
          >
            Pesquisar
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
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Destinatário</th>
                <th className="px-4 py-3 text-left font-medium">Assunto</th>
                <th className="px-4 py-3 text-left font-medium">Remetente</th>
                <th className="px-4 py-3 text-left font-medium">Enviado em</th>
                <th className="px-4 py-3 text-left font-medium">Provedor</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Carregando...
                  </td>
                </tr>
              )}
              {!loading && response && response.data.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Nenhum email encontrado.
                  </td>
                </tr>
              )}
              {!loading &&
                response?.data.map((email) => {
                  const providerStatus = email.lastProviderStatus
                    ? PROVIDER_STATUS_LABELS[email.lastProviderStatus] ?? email.lastProviderStatus
                    : STATUS_LABELS[email.status] ?? email.status;
                  return (
                    <tr key={email.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900 break-all max-w-[220px]">
                        {email.to}
                      </td>
                      <td className="px-4 py-3 text-gray-900 max-w-[320px] truncate" title={email.subject}>
                        {email.subject}
                      </td>
                      <td className="px-4 py-3 text-gray-700 break-all max-w-[200px]">
                        {email.from}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {formatDate(email.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {PROVIDER_LABELS[email.provider] ?? email.provider}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                          {providerStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedEmailId(email.id)}
                          className="text-xs font-medium text-green-700 hover:text-green-900 hover:underline"
                        >
                          Ver detalhes
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {response && response.total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-600">
            <span>
              {response.total} resultado{response.total === 1 ? '' : 's'} · página {response.page}{' '}
              de {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 disabled:opacity-50 hover:bg-gray-50"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))}
                disabled={page >= totalPages || loading}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 disabled:opacity-50 hover:bg-gray-50"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedEmailId && (
        <EmailDetailDrawer
          emailId={selectedEmailId}
          onClose={() => setSelectedEmailId(null)}
          onResendSuccess={handleResendSuccess}
        />
      )}
    </div>
  );
}
