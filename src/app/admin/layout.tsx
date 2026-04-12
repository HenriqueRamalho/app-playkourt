import Link from 'next/link';
import { LayoutDashboard, MapPin, Settings } from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Início', icon: LayoutDashboard },
  { href: '/admin/venues', label: 'Meus locais', icon: MapPin },
  { href: '/admin/settings', label: 'Configurações', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <aside className="w-56 bg-gray-900 flex flex-col shrink-0">
        <div className="px-5 py-4 border-b border-gray-700">
          <Link href="/admin" className="text-white font-bold text-lg tracking-tight">
            🏟️ Minha área
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
