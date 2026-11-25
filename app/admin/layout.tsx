// app/admin/layout.tsx
import React from 'react';
import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';
import { AdminSidebar } from '@/components/ui/AdminSidebar';
import type { NavItem } from '@/components/ui/BottomNav';

const icon = (d: React.ReactNode) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);

const NAV: NavItem[] = [
  {
    href: '/admin',
    label: 'Resumen',
    exact: true,
    icon: icon(<><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>),
  },
  {
    href: '/admin/listados',
    label: 'Inscripciones',
    also: ['/admin/inscripciones/'],
    icon: icon(<><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" /></>),
  },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!roleData || roleData.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-dvh flex-col bg-canvas lg:flex-row">
      <AdminSidebar
        items={NAV}
        footer={
          <div className="flex flex-row flex-wrap gap-1 lg:flex-col">
            <Link
              href="/dashboard"
              className="flex min-h-11 items-center rounded-xl px-3 text-sm font-bold text-ink-soft hover:bg-canvas"
            >
              Vista familia
            </Link>
            <LogoutButton />
          </div>
        }
      />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
    </div>
  );
}
