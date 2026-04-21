'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authClient } from '@/infrastructure/auth/better-auth.client';

const GENERIC_SUCCESS =
  'Se existir uma conta com este email, você receberá em instantes um link para redefinir a senha. Verifique também o spam.';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const redirectTo = `${origin}/auth/reset-password`;

    const { error: reqError } = await authClient.requestPasswordReset({
      email: email.trim(),
      redirectTo,
    });

    setLoading(false);

    if (reqError) {
      setError(reqError.message ?? 'Não foi possível enviar o email. Tente novamente.');
      return;
    }

    setSent(true);
  };

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16 bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-4xl">🏐</span>
          <h1 className="mt-3 text-2xl font-bold text-gray-900">Esqueci minha senha</h1>
          <p className="mt-1 text-sm text-gray-500">
            <Link href="/auth/login" className="text-green-600 font-medium hover:text-green-700">
              Voltar ao login
            </Link>
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
          <p className="text-xs text-gray-500 mb-5">
            Conta criada só com o Google? Use &quot;Entrar com Google&quot; ou defina uma senha em{' '}
            <Link href="/accounts/security" className="text-green-600 font-medium hover:text-green-700">
              Minha conta → Segurança
            </Link>
            .
          </p>

          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {sent ? (
            <div className="bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3 rounded-lg">
              {GENERIC_SUCCESS}
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Enviando…' : 'Enviar link'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
