// app/dashboard/page.tsx — Inicio de la familia (tablero 2 · Inicio familia)
import Link from 'next/link';
import React from 'react';
import { InscripcionesList, INSCRIPCION_SELECT, toItems } from '@/components/familia/InscripcionesList';
import { PERIODO } from '@/components/familia/textos';
import { createClient } from '@/lib/supabase-server';

const RECIENTES = 3;

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: roleData } = user
    ? await supabase.from('user_roles').select('role').eq('user_id', user.id).single()
    : { data: null };
  const isAdmin = roleData?.role === 'admin';

  const { data: rows, error } = await supabase
    .from('inscriptions')
    .select(INSCRIPCION_SELECT)
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false });
  const items = toItems(rows);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm text-muted">{PERIODO}</span>
        <h1 className="m-0 text-2xl font-extrabold">¡Bienvenido!</h1>
      </div>

      <Link
        href="/dashboard/nuevo-formulario"
        className="flex items-center gap-4 rounded-panel bg-brand p-5 text-on-brand no-underline transition-colors hover:bg-brand-hover"
      >
        <span className="flex size-12 flex-none items-center justify-center rounded-control bg-on-brand/15">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
        <span className="flex flex-1 flex-col gap-0.5">
          <span className="text-[17px] font-extrabold">Nueva inscripción</span>
          <span className="text-sm text-on-brand-muted">Un beneficiario o un adulto voluntario</span>
        </span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </Link>

      {isAdmin && (
        <Link
          href="/admin"
          className="flex items-center justify-between gap-3 rounded-card bg-brand-soft p-4 text-brand no-underline hover:bg-line"
        >
          <span className="flex flex-col gap-0.5">
            <span className="text-base font-extrabold">Panel administrativo</span>
            <span className="text-sm text-ink-soft">Revisar, aprobar y exportar las fichas del grupo</span>
          </span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </Link>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="m-0 text-[17px] font-extrabold">Tus inscripciones</h2>
          {items.length > 0 && <span className="text-sm text-muted">{items.length}</span>}
        </div>

        {error && <p role="alert" className="m-0 text-sm font-bold text-danger">Error al cargar inscripciones.</p>}

        {!error && items.length === 0 && (
          <p className="m-0 rounded-card bg-surface p-6 text-center text-[15px] text-muted shadow-card">
            Aún no tienes inscripciones. Empieza con «Nueva inscripción».
          </p>
        )}

        {items.length > 0 && <InscripcionesList items={items.slice(0, RECIENTES)} label="Tus inscripciones recientes" />}

        {items.length > RECIENTES && (
          <Link href="/dashboard/mis-inscripciones" className="flex min-h-11 items-center justify-center rounded-control text-sm font-extrabold text-brand hover:bg-brand-soft">
            Ver todas ({items.length})
          </Link>
        )}
      </section>
    </div>
  );
}
