import { Suspense } from 'react';
import Link from 'next/link';
import ResetPasswordForm from './ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16 bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-4xl">🏐</span>
          <p className="mt-3 text-sm text-gray-500">
            <Link href="/auth/login" className="text-green-600 font-medium hover:text-green-700">
              Voltar ao login
            </Link>
          </p>
        </div>

        <Suspense
          fallback={(
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center text-sm text-gray-500">
              Carregando…
            </div>
          )}
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
