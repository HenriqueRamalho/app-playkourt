'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authClient } from '@/infrastructure/auth/better-auth.client';
import { generateFakeRegisterForm } from './register-fake-data';

type PageState = 'form' | 'awaiting-verification';

export default function RegisterPage() {
  const [pageState, setPageState] = useState<PageState>('form');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAutofill = () => {
    setError(null);
    setFormData(generateFakeRegisterForm());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    setLoading(true);
    setError(null);
    const { error: signUpError } = await authClient.signUp.email({
      name: formData.name,
      email: formData.email,
      password: formData.password,
    });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message ?? 'Erro ao criar conta');
      return;
    }
    setRegisteredEmail(formData.email);
    setPageState('awaiting-verification');
  };

  if (pageState === 'awaiting-verification') {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-16 bg-gray-50">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <span className="text-4xl">🏐</span>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
            <div className="text-4xl mb-4">📬</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Confirme seu email</h1>
            <p className="text-sm text-gray-500 mb-2">
              Enviamos um link de verificação para:
            </p>
            <p className="text-sm font-semibold text-gray-800 mb-6 break-all">
              {registeredEmail}
            </p>
            <p className="text-xs text-gray-400 mb-6">
              Clique no link do email para ativar sua conta. O link expira em 24 horas.
              Verifique também a pasta de spam.
            </p>
            <Link
              href="/auth/verify-email"
              className="text-green-600 font-medium text-sm hover:text-green-700 underline"
            >
              Não recebi o email — reenviar
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16 bg-gray-50">
      <div className="w-full max-w-lg min-w-md">
        <div className="text-center mb-8">
          <span className="text-4xl">🏐</span>
          <h1 className="mt-3 text-2xl font-bold text-gray-900">Criar conta</h1>
          <p className="mt-1 text-sm text-gray-500">
            Já tem conta?{' '}
            <Link href="/auth/login" className="text-green-600 font-medium hover:text-green-700">
              Entrar
            </Link>
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={handleAutofill}
              className="text-xs font-medium text-gray-500 border border-dashed border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-100 transition-colors"
            >
              Preencher automaticamente
            </button>
          </div>

          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input
                id="name" name="name" type="text" autoComplete="name" required
                value={formData.name} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                id="email" name="email" type="email" autoComplete="email" required
                value={formData.email} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <input
                id="password" name="password" type="password" autoComplete="new-password" required minLength={8}
                value={formData.password} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirmar senha</label>
              <input
                id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required
                value={formData.confirmPassword} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-2 px-4 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
