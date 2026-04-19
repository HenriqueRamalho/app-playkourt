'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';

interface BackofficeUserDTO {
  id: string;
  name: string;
  email: string;
  banned: boolean;
  banReason: string | null;
  banSource: string | null;
  bannedAt: string | null;
  emailVerified: boolean;
  createdAt: string;
  lastSeenAt: string | null;
}

interface BackofficeUsersResponse {
  data: BackofficeUserDTO[];
  total: number;
  page: number;
  pageSize: number;
}

interface Filters {
  id: string;
  email: string;
  name: string;
  banned: '' | 'true' | 'false';
}

const DEFAULT_PAGE_SIZE = 20;
const EMPTY_FILTERS: Filters = { id: '', email: '', name: '', banned: '' };

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

function banLabel(user: BackofficeUserDTO): string {
  if (!user.banned) return 'Ativo';
  switch (user.banSource) {
    case 'user_requested_deletion':
      return 'Exclusão solicitada';
    case 'staff':
      return 'Bloqueado';
    default:
      return 'Banido';
  }
}

export default function BackofficeUsersPage() {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [response, setResponse] = useState<BackofficeUsersResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async (currentFilters: Filters, currentPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (currentFilters.id) params.set('id', currentFilters.id);
      if (currentFilters.email) params.set('email', currentFilters.email);
      if (currentFilters.name) params.set('name', currentFilters.name);
      if (currentFilters.banned) params.set('banned', currentFilters.banned);
      params.set('page', String(currentPage));
      params.set('pageSize', String(DEFAULT_PAGE_SIZE));

      const res = await fetch(`/api/backoffice/users?${params.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Erro ${res.status}`);
      }
      const data: BackofficeUsersResponse = await res.json();
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar usuários');
      setResponse(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(appliedFilters, page);
  }, [appliedFilters, page, fetchUsers]);

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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Usuários</h1>
        <p className="text-gray-500 text-sm">Pesquise usuários cadastrados na plataforma.</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-xl p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3"
      >
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">ID (UUID)</label>
          <input
            type="text"
            value={filters.id}
            onChange={(e) => setFilters((f) => ({ ...f, id: e.target.value }))}
            placeholder="uuid exato"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Email (contém)</label>
          <input
            type="text"
            value={filters.email}
            onChange={(e) => setFilters((f) => ({ ...f, email: e.target.value }))}
            placeholder="@empresa.com"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Nome (contém)</label>
          <input
            type="text"
            value={filters.name}
            onChange={(e) => setFilters((f) => ({ ...f, name: e.target.value }))}
            placeholder="nome"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
          <select
            value={filters.banned}
            onChange={(e) => setFilters((f) => ({ ...f, banned: e.target.value as Filters['banned'] }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Todos</option>
            <option value="false">Ativos</option>
            <option value="true">Banidos</option>
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
                <th className="px-4 py-3 text-left font-medium">ID</th>
                <th className="px-4 py-3 text-left font-medium">Nome</th>
                <th className="px-4 py-3 text-left font-medium">Email</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Cadastro</th>
                <th className="px-4 py-3 text-left font-medium">Último acesso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Carregando...
                  </td>
                </tr>
              )}
              {!loading && response && response.data.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
              {!loading &&
                response?.data.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500" title={user.id}>
                      {user.id.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-3 text-gray-900">{user.name}</td>
                    <td className="px-4 py-3 text-gray-700">
                      <div className="flex items-center gap-2">
                        <span>{user.email}</span>
                        {user.emailVerified && (
                          <span className="text-[10px] font-medium text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                            verificado
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          user.banned
                            ? 'bg-red-50 text-red-700'
                            : 'bg-green-50 text-green-700'
                        }`}
                      >
                        {banLabel(user)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(user.lastSeenAt)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {response && response.total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-600">
            <span>
              {response.total} resultado{response.total === 1 ? '' : 's'} · página {response.page} de{' '}
              {totalPages}
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
    </div>
  );
}
