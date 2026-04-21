'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authClient } from '@/infrastructure/auth/better-auth.client';

type PageState = 'verifying' | 'success' | 'error' | 'resend';

export default function VerifyEmailView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email') ?? '';

  const [state, setState] = useState<PageState>(token ? 'verifying' : 'resend');
  const [errorMsg, setErrorMsg] = useState('');
  const [resendEmail, setResendEmail] = useState(email);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  useEffect(() => {
    if (!token) return;

    authClient.verifyEmail({ query: { token } }).then(({ error }) => {
      if (error) {
        setErrorMsg(error.message ?? 'Link inválido ou expirado.');
        setState('error');
      } else {
        setState('success');
        setTimeout(() => router.push('/'), 2500);
      }
    });
  }, [token, router]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendLoading(true);
    const { error } = await authClient.sendVerificationEmail({
      email: resendEmail,
      callbackURL: '/auth/verify-email',
    });
    setResendLoading(false);
    if (error) {
      setErrorMsg(error.message ?? 'Não foi possível reenviar o email.');
    } else {
      setResendSent(true);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16 bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-4xl">🏐</span>
        </div>

        {state === 'verifying' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-sm text-gray-600">Verificando seu email…</p>
          </div>
        )}

        {state === 'success' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
            <div className="text-4xl mb-4">✅</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Email verificado!</h1>
            <p className="text-sm text-gray-500">Redirecionando você para a plataforma…</p>
          </div>
        )}

        {state === 'error' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
            <div className="text-4xl mb-4">❌</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Link inválido</h1>
            <p className="text-sm text-gray-500 mb-6">{errorMsg}</p>
            <button
              onClick={() => { setErrorMsg(''); setState('resend'); }}
              className="text-green-600 font-medium text-sm hover:text-green-700 underline"
            >
              Solicitar novo link de verificação
            </button>
          </div>
        )}

        {state === 'resend' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
            <h1 className="text-xl font-bold text-gray-900 mb-2 text-center">Verificação de email</h1>

            {resendSent ? (
              <div className="mt-4 bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3 rounded-lg text-center">
                Email reenviado! Verifique sua caixa de entrada (e o spam).
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-6 text-center">
                  Informe seu email para receber um novo link de verificação.
                </p>

                {errorMsg && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleResend} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={resendLoading}
                    className="w-full py-2 px-4 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resendLoading ? 'Enviando…' : 'Enviar link'}
                  </button>
                </form>
              </>
            )}

            <p className="mt-5 text-center text-xs text-gray-400">
              Lembrou a senha?{' '}
              <Link href="/auth/login" className="text-green-600 font-medium hover:text-green-700">
                Fazer login
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
