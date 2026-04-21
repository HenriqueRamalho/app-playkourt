'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ProcessedEmailDetailDTO,
  PROVIDER_LABELS,
  PROVIDER_STATUS_LABELS,
  STATUS_LABELS,
} from './types';

interface EmailDetailDrawerProps {
  emailId: string;
  onClose: () => void;
  onResendSuccess: (newId: string) => void;
}

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
    second: '2-digit',
  });
}

export function EmailDetailDrawer({
  emailId,
  onClose,
  onResendSuccess,
}: EmailDetailDrawerProps) {
  const [detail, setDetail] = useState<ProcessedEmailDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showResendForm, setShowResendForm] = useState(false);
  const [reason, setReason] = useState('');
  const [resending, setResending] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/backoffice/emails/${emailId}`, { credentials: 'include' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Erro ${res.status}`);
      }
      setDetail(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar email');
    } finally {
      setLoading(false);
    }
  }, [emailId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleResend = async () => {
    setResending(true);
    setResendError(null);
    try {
      const body: Record<string, string> = {};
      if (reason.trim()) body.reason = reason.trim();
      const res = await fetch(`/api/backoffice/emails/${emailId}/resend`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.error || `Erro ${res.status}`);
      }
      const data = await res.json();
      if (data.id) onResendSuccess(data.id);
    } catch (err) {
      setResendError(err instanceof Error ? err.message : 'Erro ao reenviar');
    } finally {
      setResending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end bg-black/30"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-3xl h-full bg-white shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Detalhes do email</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Fechar
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="p-8 text-center text-gray-500">Carregando...</div>
          )}

          {error && (
            <div className="m-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {!loading && detail && (
            <div className="p-6 space-y-6">
              <section className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500">De</p>
                  <p className="text-gray-800 break-all">{detail.from}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Para</p>
                  <p className="text-gray-800 break-all">{detail.to}</p>
                </div>
                {detail.cc && detail.cc.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500">Cc</p>
                    <p className="text-gray-800 break-all">{detail.cc.join(', ')}</p>
                  </div>
                )}
                {detail.bcc && detail.bcc.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500">Bcc</p>
                    <p className="text-gray-800 break-all">{detail.bcc.join(', ')}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500">Provedor</p>
                  <p className="text-gray-800">
                    {PROVIDER_LABELS[detail.provider] ?? detail.provider}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status interno</p>
                  <p className="text-gray-800">
                    {STATUS_LABELS[detail.status] ?? detail.status}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Último status do provedor</p>
                  <p className="text-gray-800">
                    {detail.lastProviderStatus
                      ? PROVIDER_STATUS_LABELS[detail.lastProviderStatus] ?? detail.lastProviderStatus
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Enviado em</p>
                  <p className="text-gray-800">{formatDate(detail.createdAt)}</p>
                </div>
                {detail.deliveredAt && (
                  <div>
                    <p className="text-xs text-gray-500">Entregue em</p>
                    <p className="text-gray-800">{formatDate(detail.deliveredAt)}</p>
                  </div>
                )}
                {detail.recipientUserId && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Usuário destinatário (user.id)</p>
                    <p className="text-gray-800 font-mono text-xs break-all">
                      {detail.recipientUserId}
                    </p>
                  </div>
                )}
                {detail.resentFromId && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Reenvio de</p>
                    <p className="text-gray-800 font-mono text-xs break-all">
                      {detail.resentFromId}
                    </p>
                  </div>
                )}
                {detail.lastProviderError && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Último erro</p>
                    <p className="text-red-700 text-xs">{detail.lastProviderError}</p>
                  </div>
                )}
              </section>

              <section>
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Assunto
                </h3>
                <p className="text-gray-900">{detail.subject}</p>
              </section>

              {Object.keys(detail.metadata).length > 0 && (
                <section>
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Metadados
                  </h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs font-mono">
                    {Object.entries(detail.metadata).map(([key, value]) => (
                      <div key={key} className="flex gap-2 py-0.5">
                        <span className="text-gray-500">{key}:</span>
                        <span className="text-gray-800 break-all">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Conteúdo (HTML)
                </h3>
                <iframe
                  title="Conteúdo do email"
                  sandbox=""
                  srcDoc={detail.htmlBody}
                  className="w-full h-96 border border-gray-200 rounded-lg bg-white"
                />
              </section>

              <section>
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Timeline de eventos
                </h3>
                {detail.events.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhum evento registrado ainda.</p>
                ) : (
                  <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg">
                    {detail.events.map((event) => (
                      <li key={event.id} className="px-3 py-2 text-sm flex justify-between">
                        <span className="text-gray-800">
                          {PROVIDER_STATUS_LABELS[event.normalizedStatus] ??
                            event.normalizedStatus}{' '}
                          <span className="text-xs text-gray-500">({event.rawStatus})</span>
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(event.occurredAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 px-6 py-4 flex items-center gap-3">
          {!showResendForm ? (
            <button
              type="button"
              onClick={() => setShowResendForm(true)}
              disabled={loading || !detail}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Reenviar
            </button>
          ) : (
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Motivo (opcional)"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {resending ? 'Reenviando...' : 'Confirmar reenvio'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowResendForm(false);
                  setReason('');
                  setResendError(null);
                }}
                className="px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancelar
              </button>
            </div>
          )}
          {resendError && (
            <div className="text-xs text-red-600">{resendError}</div>
          )}
        </div>
      </div>
    </div>
  );
}
