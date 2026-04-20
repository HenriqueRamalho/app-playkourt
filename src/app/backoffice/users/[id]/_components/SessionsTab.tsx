import { SessionsResponse, formatDateTime } from './types';

interface Props {
  data: SessionsResponse | null;
  loading: boolean;
  error: string | null;
  onRevoke: (sessionId: string) => void;
}

export function SessionsTab({ data, loading, error, onRevoke }: Props) {
  if (loading)
    return (
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-8 text-center text-sm text-gray-500">
        Carregando...
      </div>
    );
  if (error)
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
        {error}
      </div>
    );
  if (!data) return null;

  if (data.data.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-8 text-center text-sm text-gray-500">
        Nenhuma sessão ativa.
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-4 py-2 text-left font-medium">IP</th>
              <th className="px-4 py-2 text-left font-medium">User agent</th>
              <th className="px-4 py-2 text-left font-medium">Criada em</th>
              <th className="px-4 py-2 text-left font-medium">Atualizada em</th>
              <th className="px-4 py-2 text-left font-medium">Expira em</th>
              <th className="px-4 py-2 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.data.map((session) => (
              <tr key={session.id} className="hover:bg-gray-50 align-top">
                <td className="px-4 py-2 text-gray-800 whitespace-nowrap">
                  {session.ipAddress ?? '—'}
                </td>
                <td className="px-4 py-2 text-gray-700 font-mono text-xs max-w-xs break-words">
                  {session.userAgent ?? '—'}
                </td>
                <td className="px-4 py-2 text-gray-700 whitespace-nowrap">
                  {formatDateTime(session.createdAt)}
                </td>
                <td className="px-4 py-2 text-gray-700 whitespace-nowrap">
                  {formatDateTime(session.updatedAt)}
                </td>
                <td className="px-4 py-2 text-gray-700 whitespace-nowrap">
                  {formatDateTime(session.expiresAt)}
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => onRevoke(session.id)}
                    className="text-xs font-medium text-red-700 hover:text-red-900"
                  >
                    Revogar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
