'use client';
// src/components/ui/AdminSidebar.tsx
// Barra lateral del panel admin. En pantallas angostas se apila arriba
// (spec 005, E5).
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { BrandLogo } from './BrandLogo';
import { isActive, type NavItem } from './BottomNav';
import { cx } from './cx';

export function AdminSidebar({
  items,
  footer,
  className,
}: {
  items: NavItem[];
  /** Contenido al pie: p. ej. el botón de cerrar sesión. */
  footer?: ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  return (
    <aside
      className={cx(
        'flex flex-col gap-6 border-b border-line bg-surface px-4 py-5 lg:min-h-screen lg:w-58 lg:flex-none lg:gap-7 lg:border-r lg:border-b-0 lg:py-6',
        className,
      )}
    >
      <div className="flex flex-col gap-2 px-2">
        <BrandLogo variant="main" width={184} priority />
        <span className="text-xs font-extrabold tracking-wider text-muted uppercase">Administración</span>
      </div>
      <nav aria-label="Secciones" className="flex flex-row flex-wrap gap-1 lg:flex-col">
        {items.map((item) => {
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cx(
                'flex h-11 items-center gap-3 rounded-xl px-3 text-[15px]',
                active ? 'bg-brand-soft font-extrabold text-brand' : 'font-bold text-ink-soft hover:bg-canvas',
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>
      {footer && <div className="px-2 lg:mt-auto">{footer}</div>}
    </aside>
  );
}
