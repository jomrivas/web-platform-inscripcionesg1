// app/app/mis-inscripciones/page.tsx
import React from 'react';
import { createClient } from '@/lib/supabase-server';

const statusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: 'Borrador', color: 'bg-gray-100 text-gray-700' },
  submitted: { label: 'Enviado para revisión', color: 'bg-blue-100 text-blue-700' },
  rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-700' },
};

export default async function MisInscripcionesPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: inscriptions, error } = await supabase
    .from('inscriptions')
    .select(
      `
      id,
      type,
      inscription_year,
      status,
      rejection_reason,
      submitted_at,
      created_at
    `
    )
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false });

  return (
    <div>
      {params.success === 'true' && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          ✅ ¡Formulario enviado correctamente! Recibirás un correo de confirmación.
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Mis Inscripciones</h2>
        <a
          href="/dashboard/nuevo-formulario"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          + Nueva Inscripción
        </a>
      </div>

      {error && (
        <p className="text-red-600">Error al cargar inscripciones.</p>
      )}

      {inscriptions && inscriptions.length === 0 && (
        <div className="bg-white border rounded-lg p-8 text-center">
          <p className="text-gray-600">
            Aún no tienes inscripciones registradas.
          </p>
        </div>
      )}

      {inscriptions && inscriptions.length > 0 && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Tipo
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Año
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Estado
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody>
              {inscriptions.map((ins) => (
                <tr key={ins.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    {ins.type === 'adulto' ? 'Adulto Voluntario' : 'Beneficiario'}
                  </td>
                  <td className="px-4 py-3">{ins.inscription_year}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        statusLabels[ins.status]?.color
                      }`}
                    >
                      {statusLabels[ins.status]?.label || ins.status}
                    </span>
                    {ins.status === 'rejected' && ins.rejection_reason && (
                      <p className="text-xs text-red-600 mt-1">
                        {ins.rejection_reason}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(ins.created_at).toLocaleDateString('es-SV')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
