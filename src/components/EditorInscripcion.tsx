// components/EditorInscripcion.tsx
// Revisión admin (tablero 8 · Revisión de ficha): estado y aprobación
// arriba, motivo de rechazo en el panel lateral y la ficha editable por
// secciones (pasos). El historial del tablero queda fuera de alcance
// (spec 005, §11: depende de registrar al admin en audit_log).
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import FormularioAdulto from '@/components/FormularioAdulto';
import FormularioBeneficiario from '@/components/FormularioBeneficiario';
import { Button } from '@/components/ui/Button';
import { RamaChip, StatusChip } from '@/components/ui/Chips';
import { Field, Textarea } from '@/components/ui/Field';

interface EditorInscripcionProps {
  inscription: {
    id: string;
    type: string;
    inscription_year: number;
    status: string;
    rejection_reason?: string | null;
    submitted_at?: string | null;
    created_at?: string | null;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialForm: Record<string, any>;
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Borrador',
  submitted: 'En revisión',
  approved: 'Aprobada',
  rejected: 'Rechazada',
};

export default function EditorInscripcion({ inscription, initialForm }: EditorInscripcionProps) {
  const router = useRouter();
  const supabase = createClient();
  const [status, setStatus] = useState(inscription.status);
  const [rejectionReason, setRejectionReason] = useState(inscription.rejection_reason || '');
  const [reasonError, setReasonError] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const esAdulto = inscription.type === 'adulto';
  const nombre: string = initialForm.nombre_completo || 'Sin nombre';
  const rama: string | undefined = esAdulto ? initialForm.rama : initialForm.rama_inscripcion;
  const fecha = inscription.submitted_at || inscription.created_at;

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
      if (!rejectionReason.trim()) {
        setReasonError('Escribe el motivo para la familia antes de rechazar');
        document.getElementById('motivo')?.focus();
        return;
      }
      rejection_reason = rejectionReason.trim();
    }
    if (!window.confirm(`¿Cambiar estado a "${STATUS_LABEL[next]}"?`)) return;
    const res = await fetch(`/api/inscriptions/${inscription.id}`, {
      method: 'PATCH',
      headers: await authHeaders(),
      body: JSON.stringify({ status: next, rejection_reason }),
    });
    if (!res.ok) {
      const r = await res.json().catch(() => ({}));
      setMessage({ ok: false, text: 'Error: ' + (r.error || 'no se pudo actualizar') });
      return;
    }
    setStatus(next);
    setMessage({ ok: true, text: `Estado actualizado a "${STATUS_LABEL[next]}".` });
    router.refresh();
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const saveForm = async (formData: any) => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/inscriptions/${inscription.id}`, {
        method: 'PUT',
        headers: await authHeaders(),
        body: JSON.stringify({ formData }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || 'Error al guardar');
      setMessage({ ok: true, text: '✓ Ficha actualizada correctamente.' });
    } catch (e: unknown) {
      setMessage({ ok: false, text: 'Error: ' + (e instanceof Error ? e.message : 'no se pudo guardar') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex max-w-6xl flex-col gap-6">
      <nav aria-label="Ruta" className="flex items-center gap-2 text-sm font-bold">
        <Link href="/admin/listados" className="inline-flex min-h-11 items-center text-brand no-underline hover:underline">
          Inscripciones
        </Link>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-muted">
          <path d="M9 6l6 6-6 6" />
        </svg>
        <span aria-current="page" className="truncate text-muted">
          {nombre}
        </span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-2.5">
          <h1 className="m-0 text-[28px] font-extrabold tracking-tight">{nombre}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-ink-soft">
            <span className="font-bold">{esAdulto ? 'Adulto Voluntario' : 'Beneficiario'}</span>
            {rama && <RamaChip value={rama} />}
            <StatusChip status={status} />
            <span className="text-muted">
              {inscription.inscription_year}
              {fecha && ` · Enviada el ${new Date(fecha).toLocaleDateString('es-SV', { day: 'numeric', month: 'short' })}`}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {status !== 'rejected' && (
            <Button variant="secondary" onClick={() => changeStatus('rejected')} className="text-danger">
              Rechazar
            </Button>
          )}
          {status === 'rejected' && (
            <Button variant="secondary" onClick={() => changeStatus('submitted')}>
              Reabrir
            </Button>
          )}
          {status !== 'approved' && (
            <Button onClick={() => changeStatus('approved')} className="bg-ok hover:bg-ok hover:opacity-90">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12l5 5 9-10" />
              </svg>
              Aprobar
            </Button>
          )}
        </div>
      </div>

      {message && (
        <p
          role={message.ok ? 'status' : 'alert'}
          className={
            message.ok
              ? 'm-0 rounded-control bg-ok-soft px-4 py-3 text-sm font-bold text-ok'
              : 'm-0 rounded-control bg-danger-soft px-4 py-3 text-sm font-bold text-danger'
          }
        >
          {message.text}
        </p>
      )}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          {esAdulto ? (
            <FormularioAdulto initialData={initialForm} onSubmit={saveForm} isLoading={saving} variant="admin" />
          ) : (
            <FormularioBeneficiario initialData={initialForm} onSubmit={saveForm} isLoading={saving} variant="admin" />
          )}
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
          <div className="flex flex-col gap-3 rounded-card bg-surface p-5 shadow-card">
            <span className="text-[13px] font-extrabold tracking-wider text-muted uppercase">
              {status === 'rejected' ? 'Motivo del rechazo' : 'Si la rechazas'}
            </span>
            <Field
              label="Motivo para la familia"
              id="motivo"
              hint="La familia lo verá en sus inscripciones para corregir la ficha."
              error={reasonError}
            >
              {(a) => (
                <Textarea
                  name="rejection_reason"
                  rows={4}
                  placeholder="Ej.: falta el carnet de vacunación"
                  value={rejectionReason}
                  onChange={(e) => {
                    setRejectionReason(e.target.value);
                    if (reasonError) setReasonError('');
                  }}
                  {...a}
                />
              )}
            </Field>
          </div>
          <p className="m-0 px-1 text-xs break-all text-muted">ID: {inscription.id}</p>
        </aside>
      </div>
    </div>
  );
}
