import Link from 'next/link';
import { User, Bell, Shield, CreditCard, LogOut } from 'lucide-react';

const navItems = [
  { href: '/accounts/profile', label: 'Perfil', icon: User },
  { href: '/accounts/notifications', label: 'Notificações', icon: Bell },
  { href: '/accounts/security', label: 'Segurança', icon: Shield },
  { href: '/accounts/billing', label: 'Assinatura', icon: CreditCard },
];

export default function AccountsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <aside className="w-56 bg-gray-900 flex flex-col shrink-0">
        <div className="px-5 py-4 border-b border-gray-700">
          <Link href="/accounts/profile" className="text-white font-bold text-lg tracking-tight">
            ⚙️ Minha conta
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
        <div className="px-3 py-4 border-t border-gray-700">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-colors text-sm"
          >
            <LogOut size={16} />
            Voltar ao início
          </Link>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
