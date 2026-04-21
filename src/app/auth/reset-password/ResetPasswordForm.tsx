'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authClient } from '@/infrastructure/auth/better-auth.client';

const MIN_LEN = 8;

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const urlError = searchParams.get('error');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setFormError(null);

    if (newPassword.length < MIN_LEN) {
      setFormError(`A senha deve ter pelo menos ${MIN_LEN} caracteres.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    const { error } = await authClient.resetPassword({
      newPassword,
      token,
    });
    setLoading(false);

    if (error) {
      setFormError(error.message ?? 'Não foi possível redefinir a senha. Solicite um novo link.');
      return;
    }

    router.push('/auth/login?reset=success');
    router.refresh();
  };

  if (urlError === 'INVALID_TOKEN') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
        <div className="text-4xl mb-4">⏱️</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Link inválido ou expirado</h1>
        <p className="text-sm text-gray-500 mb-6">
          Solicite um novo link de redefinição de senha.
        </p>
        <Link
          href="/auth/forgot-password"
          className="text-green-600 font-medium text-sm hover:text-green-700 underline"
        >
          Esqueci minha senha
        </Link>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
        <p className="text-sm text-gray-600 mb-4">Abra o link enviado por email para redefinir sua senha.</p>
        <Link href="/auth/forgot-password" className="text-green-600 font-medium text-sm hover:text-green-700 underline">
          Solicitar novo link
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
      <h1 className="text-xl font-bold text-gray-900 mb-1 text-center">Nova senha</h1>
      <p className="text-xs text-gray-500 mb-6 text-center">Mínimo de {MIN_LEN} caracteres.</p>

      {formError && (
        <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {formError}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Nova senha
          </label>
          <input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={MIN_LEN}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirmar senha
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={MIN_LEN}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Salvando…' : 'Redefinir senha'}
        </button>
      </form>
    </div>
  );
}
