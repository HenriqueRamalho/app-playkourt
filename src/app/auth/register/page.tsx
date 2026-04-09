'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/infrastructure/frontend-services/supabase';

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-16 bg-gray-50">
        <div className="w-full max-w-sm bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
          <span className="text-4xl">📬</span>
          <h2 className="mt-4 text-xl font-bold text-gray-900">Verifique seu email</h2>
          <p className="mt-2 text-sm text-gray-500">
            Enviamos um link de confirmação para <strong>{formData.email}</strong>
          </p>
          <Link href="/auth/login" className="mt-5 inline-block text-sm text-green-600 font-medium hover:text-green-700">
            Voltar para o login →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16 bg-gray-50">
      <div className="w-full max-w-sm">
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
          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
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
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <input
                id="password" name="password" type="password" autoComplete="new-password" required
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
