'use client';
// src/components/familia/FamilyFrame.tsx
// Marco del flujo de familias (mobile first): encabezado arriba y
// navegación inferior en móvil. Dentro de una ficha se oculta todo: la
// ficha trae su propia barra (tablero 4 · Ficha paso a paso).
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import LogoutButton from '@/components/LogoutButton';
import { BottomNav, type NavItem } from '@/components/ui/BottomNav';
import { BrandLogo } from '@/components/ui/BrandLogo';

const icon = (d: ReactNode) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);

const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Inicio', exact: true, icon: icon(<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />) },
  { href: '/dashboard/nuevo-formulario', label: 'Inscribir', icon: icon(<><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></>) },
  { href: '/dashboard/mis-inscripciones', label: 'Fichas', icon: icon(<><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" /></>) },
];

const FICHA_PREFIX = ['/dashboard/nuevo-formulario/adulto', '/dashboard/nuevo-formulario/beneficiario'];

export function FamilyFrame({
  email,
  isAdmin,
  children,
}: {
  email: string;
  isAdmin: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  if (FICHA_PREFIX.some((p) => pathname.startsWith(p))) {
    return <div className="min-h-dvh bg-canvas">{children}</div>;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <Link href="/dashboard" className="flex min-h-11 min-w-0 items-center gap-3 rounded-xl no-underline">
            <BrandLogo variant="isotipo" width={40} decorative />
            <span className="flex min-w-0 flex-col">
              <span className="text-[15px] font-black text-ink">Grupo Scout No. 1</span>
              <span className="truncate text-xs text-muted">{email}</span>
            </span>
          </Link>
          <div className="flex flex-none items-center gap-1">
            {isAdmin && (
              <Link href="/admin" className="flex min-h-11 items-center rounded-xl px-3 text-sm font-extrabold text-brand hover:bg-brand-soft">
                Panel admin
              </Link>
            )}
            <LogoutButton />
          </div>
        </div>
        <nav aria-label="Secciones" className="mx-auto hidden w-full max-w-2xl gap-1 px-6 pb-2 md:flex">
          {NAV.map((n) => {
            const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? 'page' : undefined}
                className={
                  active
                    ? 'flex min-h-11 items-center rounded-xl bg-brand-soft px-3 text-sm font-extrabold text-brand'
                    : 'flex min-h-11 items-center rounded-xl px-3 text-sm font-bold text-ink-soft hover:bg-canvas'
                }
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 pt-6 pb-28 md:pb-12">{children}</main>

      <BottomNav items={NAV} className="fixed inset-x-0 bottom-0 z-10 md:hidden" />
    </div>
  );
}
