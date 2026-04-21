'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { accountService } from '@/infrastructure/frontend-services/api/account.service';

const MIN_PASSWORD = 8;

export default function AccountSecurityPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [statusLoading, setStatusLoading] = useState(true);
  const [hasPasswordCredential, setHasPasswordCredential] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [revokeOtherSessions, setRevokeOtherSessions] = useState(true);

  const [initialNewPassword, setInitialNewPassword] = useState('');
  const [initialConfirmPassword, setInitialConfirmPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/auth/login');
      return;
    }

    let cancelled = false;
    accountService
      .getSecurityStatus()
      .then((s) => {
        if (!cancelled) {
          setHasPasswordCredential(s.hasPasswordCredential);
        }
      })
      .catch(() => {
        if (!cancelled) setError('Não foi possível carregar as informações de segurança.');
      })
      .finally(() => {
        if (!cancelled) setStatusLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, router]);

  const resetChangeForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setRevokeOtherSessions(true);
  };

  const resetSetForm = () => {
    setInitialNewPassword('');
    setInitialConfirmPassword('');
  };

  const validateChangeClient = (): string | null => {
    if (!currentPassword.trim()) return 'Informe a senha atual.';
    if (newPassword.length < MIN_PASSWORD) return `A nova senha deve ter pelo menos ${MIN_PASSWORD} caracteres.`;
    if (newPassword !== confirmNewPassword) return 'A confirmação da nova senha não confere.';
    if (newPassword === currentPassword) return 'A nova senha deve ser diferente da senha atual.';
    return null;
  };

  const validateSetClient = (): string | null => {
    if (initialNewPassword.length < MIN_PASSWORD) return `A senha deve ter pelo menos ${MIN_PASSWORD} caracteres.`;
    if (initialNewPassword !== initialConfirmPassword) return 'A confirmação da senha não confere.';
    return null;
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const clientErr = validateChangeClient();
    if (clientErr) {
      setError(clientErr);
      return;
    }
    setSubmitting(true);
    try {
      await accountService.changePassword({
        currentPassword,
        newPassword,
        confirmNewPassword,
        revokeOtherSessions,
      });
      setSuccess('Senha atualizada com sucesso.');
      resetChangeForm();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar senha');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetInitialPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const clientErr = validateSetClient();
    if (clientErr) {
      setError(clientErr);
      return;
    }
    setSubmitting(true);
    try {
      await accountService.setInitialPassword({
        newPassword: initialNewPassword,
        confirmNewPassword: initialConfirmPassword,
      });
      setSuccess('Senha criada com sucesso. Você já pode usar email e senha para entrar.');
      resetSetForm();
      setHasPasswordCredential(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao definir senha');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user) return null;

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent';

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Segurança</h1>
      <p className="text-gray-500 text-sm mb-8">Gerencie a senha da sua conta.</p>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 max-w-lg">
        {statusLoading ? (
          <p className="text-sm text-gray-500">Carregando…</p>
        ) : hasPasswordCredential ? (
          <form onSubmit={handleChangePassword} className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Alterar senha</h2>
              <p className="text-xs text-gray-500 mb-4">
                Mínimo de {MIN_PASSWORD} caracteres. Use uma senha forte e exclusiva para o Playkourt.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">
                {success}
              </div>
            )}

            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Senha atual <span className="text-red-500">*</span>
              </label>
              <input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Nova senha <span className="text-red-500">*</span>
              </label>
              <input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={MIN_PASSWORD}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar nova senha <span className="text-red-500">*</span>
              </label>
              <input
                id="confirmNewPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={MIN_PASSWORD}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className={inputClass}
              />
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={revokeOtherSessions}
                onChange={(e) => setRevokeOtherSessions(e.target.checked)}
                className="mt-1 rounded border-gray-300 text-gray-800 focus:ring-gray-500"
              />
              <span className="text-sm text-gray-700">
                Desconectar outros dispositivos após a troca (recomendado). A sessão atual permanece ativa.
              </span>
            </label>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 text-sm font-medium text-white bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Salvando…' : 'Atualizar senha'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              <p className="font-medium mb-1">Conta vinculada ao Google</p>
              <p>
                Você entrou com o Google e ainda não definiu uma senha local no Playkourt. Crie uma senha abaixo para
                poder acessar também com email e senha, ou continue usando apenas o Google em{' '}
                <Link href="/auth/login" className="underline font-medium">
                  entrar
                </Link>
                .
              </p>
            </div>

            <form onSubmit={handleSetInitialPassword} className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Definir senha</h2>
                <p className="text-xs text-gray-500 mb-4">Mínimo de {MIN_PASSWORD} caracteres.</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">
                  {success}
                </div>
              )}

              <div>
                <label htmlFor="setNewPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Nova senha <span className="text-red-500">*</span>
                </label>
                <input
                  id="setNewPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={MIN_PASSWORD}
                  value={initialNewPassword}
                  onChange={(e) => setInitialNewPassword(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="setConfirmNewPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar senha <span className="text-red-500">*</span>
                </label>
                <input
                  id="setConfirmNewPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={MIN_PASSWORD}
                  value={initialConfirmPassword}
                  onChange={(e) => setInitialConfirmPassword(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 text-sm font-medium text-white bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Salvando…' : 'Criar senha'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
