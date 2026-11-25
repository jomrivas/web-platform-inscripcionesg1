// app/dashboard/layout.tsx
// Layout compartido para todas las páginas del dashboard de usuario (/dashboard/*)

import React from 'react';
import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { FamilyFrame } from '@/components/familia/FamilyFrame';

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
    <FamilyFrame email={user.email ?? ''} isAdmin={isAdmin}>
      {children}
    </FamilyFrame>
  );
}
