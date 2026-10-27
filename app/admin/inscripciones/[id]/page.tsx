// app/admin/inscripciones/[id]/page.tsx
// Detalle y edición de una inscripción (solo admin; el layout ya lo verifica).
import React from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import EditorInscripcion from '@/components/EditorInscripcion';

export default async function EditarInscripcionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: inscription } = await supabase
    .from('inscriptions')
    .select('id, user_id, type, inscription_year, status, rejection_reason')
    .eq('id', id)
    .single();

  if (!inscription) notFound();

  const table =
    (inscription as { type: string }).type === 'adulto'
      ? 'adult_forms'
      : 'beneficiary_forms';
  const { data: form } = await supabase
    .from(table)
    .select('*')
    .eq('inscription_id', id)
    .single();

  return (
    <EditorInscripcion
      inscription={
        inscription as {
          id: string;
          type: string;
          inscription_year: number;
          status: string;
          rejection_reason?: string | null;
        }
      }
      initialForm={(form as Record<string, unknown>) ?? {}}
    />
  );
}
