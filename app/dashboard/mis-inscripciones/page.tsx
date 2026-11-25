// app/dashboard/mis-inscripciones/page.tsx
// Lista de fichas de la familia. Con ?success=true muestra la confirmación
// de envío (tablero 6 · Inscripción enviada).
import React from 'react';
import { InscripcionesList, INSCRIPCION_SELECT, toItems } from '@/components/familia/InscripcionesList';
import { ButtonLink } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase-server';

function Enviada() {
  const pasos = [
    { titulo: 'Enviada', detalle: 'Hoy', estado: 'hecho' },
    { titulo: 'En revisión', detalle: 'El equipo del grupo valida los datos', estado: 'actual' },
    { titulo: 'Aprobada', detalle: 'Lo verás aquí, en tus inscripciones', estado: 'pendiente' },
  ] as const;
  return (
    <section aria-labelledby="enviada-titulo" className="flex flex-col gap-5 rounded-panel bg-surface p-6 shadow-raised">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-ok-soft text-ok">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12l5 5 9-10" />
          </svg>
        </span>
        <h1 id="enviada-titulo" className="m-0 text-2xl font-black">¡Inscripción enviada!</h1>
        <p role="status" className="m-0 text-[15px] leading-normal text-muted">
          ¡Formulario enviado correctamente! Recibirás una confirmación en tu correo.
        </p>
      </div>
      <ol className="m-0 flex list-none flex-col p-0">
        {pasos.map((p, i) => (
          <li key={p.titulo} className="flex gap-3.5">
            <div className="flex flex-col items-center">
              <span
                className={
                  p.estado === 'hecho'
                    ? 'flex size-6 items-center justify-center rounded-full bg-ok text-on-brand'
                    : p.estado === 'actual'
                      ? 'flex size-6 items-center justify-center rounded-full bg-warn-soft ring-2 ring-inset ring-warn'
                      : 'size-6 rounded-full bg-canvas ring-2 ring-inset ring-line'
                }
              >
                {p.estado === 'hecho' && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12l5 5 9-10" />
                  </svg>
                )}
              </span>
              {i < pasos.length - 1 && <span aria-hidden="true" className="w-0.5 flex-1 bg-line" />}
            </div>
            <div className="flex flex-col gap-0.5 pb-5">
              <span className="text-[15px] font-extrabold">{p.titulo}</span>
              <span className="text-sm text-muted">{p.detalle}</span>
            </div>
          </li>
        ))}
      </ol>
      <ButtonLink href="/dashboard/nuevo-formulario" variant="secondary" size="lg" fullWidth>
        Inscribir a otra persona
      </ButtonLink>
    </section>
  );
}

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

  const { data: rows, error } = await supabase
    .from('inscriptions')
    .select(INSCRIPCION_SELECT)
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false });
  const items = toItems(rows);
  const enviada = params.success === 'true';

  return (
    <div className="flex flex-col gap-6">
      {enviada && <Enviada />}

      <div className="flex items-center justify-between gap-3">
        {enviada ? (
          <h2 className="m-0 text-xl font-extrabold">Mis inscripciones</h2>
        ) : (
          <h1 className="m-0 text-2xl font-extrabold">Mis inscripciones</h1>
        )}
        {!enviada && (
          <ButtonLink href="/dashboard/nuevo-formulario" className="h-11 px-4 text-sm">
            + Nueva
          </ButtonLink>
        )}
      </div>

      {error && <p role="alert" className="m-0 text-sm font-bold text-danger">Error al cargar inscripciones.</p>}

      {!error && items.length === 0 && (
        <p className="m-0 rounded-card bg-surface p-6 text-center text-[15px] text-muted shadow-card">
          Aún no tienes inscripciones registradas.
        </p>
      )}

      {items.length > 0 && <InscripcionesList items={items} label="Mis inscripciones" />}
    </div>
  );
}
