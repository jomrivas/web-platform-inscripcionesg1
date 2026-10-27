// app/dashboard/page.tsx
import React from 'react';
import { createClient } from '@/lib/supabase-server';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: roleData } = user
    ? await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()
    : { data: null };
  const isAdmin = roleData?.role === 'admin';

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Bienvenido!</h2>
      <p className="text-gray-600 mb-8">¿Qué deseas hacer hoy?</p>

      {isAdmin && (
        <a
          href="/admin"
          className="block bg-gray-900 text-white rounded-xl p-6 mb-6 hover:bg-gray-800 transition-colors shadow-sm"
        >
          <div className="text-3xl mb-2">🛡️</div>
          <h3 className="text-lg font-bold mb-1">Panel Administrativo</h3>
          <p className="text-gray-300 text-sm">
            Ver todos los inscritos, filtrar por año y rama, editar registros
            y aprobar inscripciones →
          </p>
        </a>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <a
          href="/dashboard/nuevo-formulario"
          className="bg-white border-2 border-blue-200 hover:border-blue-500 rounded-xl p-8 text-center transition-colors shadow-sm hover:shadow-md"
        >
          <div className="text-5xl mb-4">📝</div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Nuevo Formulario
          </h3>
          <p className="text-gray-600 text-sm">
            Llena una nueva ficha de inscripción (Adulto o Beneficiario)
          </p>
        </a>

        <a
          href="/dashboard/mis-inscripciones"
          className="bg-white border-2 border-green-200 hover:border-green-500 rounded-xl p-8 text-center transition-colors shadow-sm hover:shadow-md"
        >
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Mis Inscripciones
          </h3>
          <p className="text-gray-600 text-sm">
            Consulta el estado de tus fichas ya enviadas
          </p>
        </a>
      </div>
    </div>
  );
}
