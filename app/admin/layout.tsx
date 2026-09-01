// app/admin/layout.tsx
import React from 'react';
import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';

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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="font-bold">Panel Administrativo</h1>
            <p className="text-xs text-gray-400">
              Grupo Scout No. 1 "Los Intrépidos"
            </p>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            <a href="/admin" className="hover:text-blue-400">
              Dashboard
            </a>
            <a href="/admin/listados" className="hover:text-blue-400">
              Listados
            </a>
            <a href="/dashboard" className="hover:text-blue-400">
              Vista Usuario
            </a>
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
