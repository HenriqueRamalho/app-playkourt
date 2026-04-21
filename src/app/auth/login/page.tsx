'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authClient } from '@/infrastructure/auth/better-auth.client';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('reset') !== 'success') return;
    queueMicrotask(() => {
      setPasswordResetSuccess(true);
      const url = new URL(window.location.href);
      url.searchParams.delete('reset');
      window.history.replaceState({}, '', `${url.pathname}${url.search}`);
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setUnverifiedEmail(null);
    setResendSent(false);

    const { data, error: signInError } = await authClient.signIn.email({
      email: formData.email,
      password: formData.password,
    });
    setLoading(false);

    if (signInError) {
      if (signInError.code === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(formData.email);
      } else {
        setError(signInError.message ?? 'Erro ao fazer login');
      }
      return;
    }

    if (data) {
      router.push('/');
      router.refresh();
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    setResendLoading(true);
    const { error: resendError } = await authClient.sendVerificationEmail({
      email: unverifiedEmail,
      callbackURL: '/auth/verify-email',
    });
    setResendLoading(false);
    if (resendError) {
      setError(resendError.message ?? 'Não foi possível reenviar o email.');
      setUnverifiedEmail(null);
    } else {
      setResendSent(true);
    }
  };

  const handleGoogleSignIn = async () => {
    const { error: googleError } = await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/',
    });
    if (googleError) setError(googleError.message ?? 'Erro ao entrar com Google');
  };

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16 bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-4xl">🏐</span>
          <h1 className="mt-3 text-2xl font-bold text-gray-900">Bem-vindo de volta</h1>
          <p className="mt-1 text-sm text-gray-500">
            Não tem conta?{' '}
            <Link href="/auth/register" className="text-green-600 font-medium hover:text-green-700">
              Criar conta
            </Link>
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
          {passwordResetSuccess && (
            <div className="mb-5 bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3 rounded-lg">
              Senha redefinida com sucesso. Faça login com sua nova senha.
            </div>
          )}

          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {unverifiedEmail && !resendSent && (
            <div className="mb-5 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm px-4 py-3 rounded-lg">
              <p className="mb-2 font-medium">Email ainda não verificado.</p>
              <p className="mb-3">Você precisa confirmar seu email antes de entrar. Clique abaixo para reenviar o link de verificação para <strong>{unverifiedEmail}</strong>.</p>
              <button
                onClick={handleResendVerification}
                disabled={resendLoading}
                className="underline font-medium hover:text-yellow-900 disabled:opacity-50"
              >
                {resendLoading ? 'Enviando…' : 'Reenviar link de verificação'}
              </button>
            </div>
          )}

          {resendSent && (
            <div className="mb-5 bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3 rounded-lg">
              Link reenviado! Verifique sua caixa de entrada (e o spam).
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                id="email" name="email" type="email" autoComplete="email" required
                value={formData.email} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Senha</label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-green-600 font-medium hover:text-green-700 whitespace-nowrap"
                >
                  Esqueci minha senha
                </Link>
              </div>
              <input
                id="password" name="password" type="password" autoComplete="current-password" required
                value={formData.password} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-2 px-4 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-5 relative flex items-center gap-3">
            <div className="flex-1 border-t border-gray-200" />
            <span className="text-xs text-gray-400">ou</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          <button
            onClick={handleGoogleSignIn}
            className="mt-4 w-full py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            Entrar com Google
          </button>
        </div>
      </div>
    </div>
  );
}
