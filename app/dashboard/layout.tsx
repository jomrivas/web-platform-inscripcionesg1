// app/dashboard/layout.tsx
// Layout compartido para todas las páginas del dashboard de usuario (/dashboard/*)

import React from 'react';
import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Verificar si es admin para mostrar el link al panel admin
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  const isAdmin = roleData?.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="font-bold text-gray-900">
              Grupo Scout No. 1 "Los Intrépidos"
            </h1>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <a
                href="/admin"
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                Panel Admin
              </a>
            )}
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
