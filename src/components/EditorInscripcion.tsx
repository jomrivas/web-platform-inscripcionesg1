// components/EditorInscripcion.tsx
// Editor admin: estado/aprobación + ficha completa editable.
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import FormularioAdulto from '@/components/FormularioAdulto';
import FormularioBeneficiario from '@/components/FormularioBeneficiario';

interface EditorInscripcionProps {
  inscription: {
    id: string;
    type: string;
    inscription_year: number;
    status: string;
    rejection_reason?: string | null;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialForm: Record<string, any>;
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Borrador',
  submitted: 'Pendiente de revisión',
  approved: 'Aprobado',
  rejected: 'Rechazado',
};

export default function EditorInscripcion({
  inscription,
  initialForm,
}: EditorInscripcionProps) {
  const router = useRouter();
  const supabase = createClient();
  const [status, setStatus] = useState(inscription.status);
  const [rejectionReason, setRejectionReason] = useState(
    inscription.rejection_reason || ''
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const authHeaders = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`,
    };
  };

  const changeStatus = async (next: string) => {
    let rejection_reason: string | undefined;
    if (next === 'rejected') {
      const input = prompt(
        'Motivo del rechazo:',
        rejectionReason || ''
      );
      if (!input?.trim()) return;
      rejection_reason = input.trim();
    }
    if (!window.confirm(`¿Cambiar estado a "${STATUS_LABEL[next]}"?`)) return;
    const res = await fetch(`/api/inscriptions/${inscription.id}`, {
      method: 'PATCH',
      headers: await authHeaders(),
      body: JSON.stringify({ status: next, rejection_reason }),
    });
    if (!res.ok) {
      const r = await res.json().catch(() => ({}));
      setMessage('Error: ' + (r.error || 'no se pudo actualizar'));
      return;
    }
    setStatus(next);
    if (rejection_reason !== undefined) setRejectionReason(rejection_reason);
    setMessage(`Estado actualizado a "${STATUS_LABEL[next]}".`);
    router.refresh();
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const saveForm = async (formData: any) => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(`/api/inscriptions/${inscription.id}`, {
        method: 'PUT',
        headers: await authHeaders(),
        body: JSON.stringify({ formData }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || 'Error al guardar');
      setMessage('✓ Ficha actualizada correctamente.');
    } catch (e: unknown) {
      setMessage(
        'Error: ' + (e instanceof Error ? e.message : 'no se pudo guardar')
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <a
        href="/admin/listados"
        className="text-sm text-blue-600 hover:underline"
      >
        ← Volver al listado
      </a>
      <h2 className="text-2xl font-bold text-gray-900 mt-2 mb-1">
        {inscription.type === 'adulto' ? 'Adulto Voluntario' : 'Beneficiario'} —{' '}
        {inscription.inscription_year}
      </h2>
      <p className="text-sm text-gray-500 mb-6">ID: {inscription.id}</p>

      {/* Estado y aprobación */}
      <div className="bg-white border rounded-lg p-4 mb-6 flex flex-wrap items-center gap-3">
        <span className="text-sm text-gray-600">
          Estado actual:{' '}
          <strong>{STATUS_LABEL[status] || status}</strong>
        </span>
        {status === 'rejected' && rejectionReason && (
          <span className="text-sm text-red-600">
            Motivo: {rejectionReason}
          </span>
        )}
        <div className="flex gap-2 ml-auto">
          {status !== 'approved' && (
            <button
              onClick={() => changeStatus('approved')}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              Aprobar
            </button>
          )}
          {status !== 'rejected' && (
            <button
              onClick={() => changeStatus('rejected')}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              Rechazar
            </button>
          )}
          {status === 'rejected' && (
            <button
              onClick={() => changeStatus('submitted')}
              className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Reabrir
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 rounded-lg text-sm">
          {message}
        </div>
      )}

      {/* Ficha editable */}
      <div className="bg-white border rounded-lg">
        {inscription.type === 'adulto' ? (
          <FormularioAdulto
            initialData={initialForm}
            onSubmit={saveForm}
            isLoading={saving}
          />
        ) : (
          <FormularioBeneficiario
            initialData={initialForm}
            onSubmit={saveForm}
            isLoading={saving}
          />
        )}
      </div>
    </div>
  );
}
