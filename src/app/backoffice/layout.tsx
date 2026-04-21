import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { LayoutDashboard, Building2, CalendarDays, Users, Mail, BarChart2, Settings } from 'lucide-react';
import { auth } from '@/infrastructure/auth/better-auth.server';
import { BackofficeAccessService } from '@/infrastructure/services/backoffice-access.service';

const navItems = [
  { href: '/backoffice', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/backoffice/venues', label: 'Venues', icon: Building2 },
  { href: '/backoffice/reservations', label: 'Reservas', icon: CalendarDays },
  { href: '/backoffice/users', label: 'Usuários', icon: Users },
  { href: '/backoffice/emails', label: 'Emails', icon: Mail },
  { href: '/backoffice/reports', label: 'Relatórios', icon: BarChart2 },
  { href: '/backoffice/settings', label: 'Configurações', icon: Settings },
];

export default async function BackofficeLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect('/auth/login');
  if (!BackofficeAccessService.hasAccess(session.user.email)) redirect('/');

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <aside className="w-56 bg-gray-900 flex flex-col shrink-0">
        <div className="px-5 py-4 border-b border-gray-700">
          <Link href="/backoffice" className="text-white font-bold text-lg tracking-tight">
            🎾 Backoffice
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors text-sm"
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
