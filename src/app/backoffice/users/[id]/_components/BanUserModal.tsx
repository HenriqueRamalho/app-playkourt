'use client';

import { FormEvent, useEffect, useState } from 'react';

const REASON_MIN = 10;
const REASON_MAX = 500;

export interface BanUserModalSuccess {
  revokedSessions: number;
}

interface Props {
  userId: string;
  userName: string;
  userEmail: string;
  onClose: () => void;
  onSuccess: (result: BanUserModalSuccess) => void;
}

export function BanUserModal({ userId, userName, userEmail, onClose, onSuccess }: Props) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [loading, onClose]);

  const trimmed = reason.trim();
  const reasonValid = trimmed.length >= REASON_MIN && trimmed.length <= REASON_MAX;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!reasonValid || loading) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/backoffice/users/${userId}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: trimmed }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || `Erro ${res.status}`);
      }
      onSuccess({ revokedSessions: body.revokedSessions ?? 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao banir usuário');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={() => !loading && onClose()}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-xl w-full max-w-md"
      >
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Banir usuário</h2>
          <p className="text-sm text-gray-500 mt-1 truncate" title={userEmail}>
            {userName} · {userEmail}
          </p>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="bg-amber-50 border border-amber-200 text-amber-900 text-sm rounded-lg px-3 py-2">
            O usuário será impedido de entrar e todas as sessões ativas serão encerradas.
          </div>

          <div>
            <label htmlFor="ban-reason" className="block text-sm font-medium text-gray-700 mb-1">
              Motivo <span className="text-red-600">*</span>
            </label>
            <textarea
              id="ban-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex.: Fraude reportada, violação dos termos de uso, etc."
              rows={4}
              maxLength={REASON_MAX}
              disabled={loading}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-50"
            />
            <div className="flex justify-between mt-1">
              <p className="text-xs text-gray-500">
                Mínimo {REASON_MIN} caracteres.
              </p>
              <p
                className={`text-xs ${
                  trimmed.length > REASON_MAX ? 'text-red-600' : 'text-gray-400'
                }`}
              >
                {trimmed.length}/{REASON_MAX}
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!reasonValid || loading}
            className="px-3 py-1.5 text-sm font-medium bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Banindo...' : 'Confirmar banimento'}
          </button>
        </div>
      </form>
    </div>
  );
}
