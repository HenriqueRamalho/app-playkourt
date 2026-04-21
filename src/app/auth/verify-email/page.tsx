import { redirect } from 'next/navigation';
import { auth } from '@/infrastructure/auth/better-auth.server';
import { headers } from 'next/headers';
import VerifyEmailView from './VerifyEmailView';

export default async function VerifyEmailPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if(session?.user) {
    redirect('/')
  }
  return <VerifyEmailView />;
}