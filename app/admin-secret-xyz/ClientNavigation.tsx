'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Package, Settings, Megaphone } from 'lucide-react';

const menuItems = [
  {
    href: '/admin-secret-xyz',
    label: 'Dashboard',
    icon: LayoutGrid,
  },
  {
    href: '/admin-secret-xyz/produtos',
    label: 'Produtos',
    icon: Package,
  },
  {
    href: '/admin-secret-xyz/banners',
    label: 'Banners',
    icon: Megaphone,
  },
  {
    href: '/admin-secret-xyz/configuracoes',
    label: 'Configurações',
    icon: Settings,
  },
];

export default function ClientNavigation() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1 px-3">
      {menuItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        const iconClass = isActive
          ? 'w-5 h-5 text-blue-600'
          : 'w-5 h-5 text-foreground/80 group-hover:text-foreground';

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={`relative group flex items-center gap-3 pl-4 pr-3 py-2 rounded-xl text-sm font-medium transition-colors border focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 ${
              isActive
                ? 'bg-gradient-to-r from-blue-500/10 to-blue-500/0 border-blue-500/20 text-foreground'
                : 'border-transparent text-foreground/75 hover:text-foreground hover:bg-foreground/[0.04] dark:hover:bg-white/5 hover:border-border'
            }`}
          >
            {isActive && (
              <span className="absolute left-1 top-1/2 -translate-y-1/2 h-5 w-1.5 rounded-full bg-gradient-to-b from-blue-400 to-blue-600 shadow-sm" />
            )}
            <Icon className={iconClass} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}