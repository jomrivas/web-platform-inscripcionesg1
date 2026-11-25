'use client';
// src/components/ui/BottomNav.tsx
// Navegación inferior del flujo de familias (móvil).
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { cx } from './cx';

export type NavItem = { href: string; label: string; icon: ReactNode; exact?: boolean };

export function isActive(pathname: string, item: Pick<NavItem, 'href' | 'exact'>) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + '/');
}

export function BottomNav({ items, className }: { items: NavItem[]; className?: string }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navegación principal"
      className={cx(
        'flex justify-around border-t border-line bg-surface px-3 pt-2.5 pb-[max(1.25rem,env(safe-area-inset-bottom))]',
        className,
      )}
    >
      {items.map((item) => {
        const active = isActive(pathname, item);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cx(
              'flex min-h-11 min-w-18 flex-col items-center justify-center gap-1 rounded-control text-xs',
              active ? 'font-extrabold text-brand' : 'font-bold text-muted hover:text-ink',
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
