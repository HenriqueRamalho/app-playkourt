import Link from 'next/link';
import { Search, SlidersHorizontal, CalendarDays, User } from 'lucide-react';

const navItems = [
  { href: '/go', label: 'Explorar', icon: Search },
  { href: '/go/advanced-search', label: 'Busca avançada', icon: SlidersHorizontal },
  { href: '/go/reservations', label: 'Minhas reservas', icon: CalendarDays },
  { href: '/go/profile', label: 'Perfil', icon: User },
];

export default function GoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <aside className="w-56 bg-green-900 flex flex-col shrink-0">
        <div className="px-5 py-4 border-b border-green-700">
          <Link href="/go" className="text-white font-bold text-lg tracking-tight">
            🎾 Playkourt
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-green-100 hover:bg-green-700 hover:text-white transition-colors text-sm"
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
