// src/components/familia/InscripcionesList.tsx
// Lista de inscripciones de la familia en tarjetas (tablero 2 · Inicio).
// Semántica de tabla (role=table/row/cell): en móvil se ve como tarjetas,
// pero un lector de pantalla —y las pruebas E2E— la leen como tabla.
import { RamaChip, StatusChip } from '@/components/ui/Chips';

export type InscripcionItem = {
  id: string;
  type: string;
  status: string;
  inscription_year: number | null;
  rejection_reason: string | null;
  created_at: string;
  nombre: string | null;
  rama: string | null;
};

type FormRef = { nombre_completo?: string | null; rama?: string | null; rama_inscripcion?: string | null };
type Row = Omit<InscripcionItem, 'nombre' | 'rama'> & {
  adult_forms?: FormRef | FormRef[] | null;
  beneficiary_forms?: FormRef | FormRef[] | null;
};

const one = (v: FormRef | FormRef[] | null | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;

/** Columnas a pedir a Supabase para armar la lista. */
export const INSCRIPCION_SELECT = `
  id, type, inscription_year, status, rejection_reason, created_at,
  adult_forms ( nombre_completo, rama ),
  beneficiary_forms ( nombre_completo, rama_inscripcion )
`;

export function toItems(rows: Row[] | null | undefined): InscripcionItem[] {
  return (rows ?? []).map(({ adult_forms, beneficiary_forms, ...r }) => {
    const f = r.type === 'adulto' ? one(adult_forms) : one(beneficiary_forms);
    return {
      ...r,
      nombre: f?.nombre_completo ?? null,
      rama: (r.type === 'adulto' ? f?.rama : f?.rama_inscripcion) ?? null,
    };
  });
}

export function InscripcionesList({ items, label }: { items: InscripcionItem[]; label: string }) {
  return (
    <div role="table" aria-label={label} className="flex flex-col gap-3">
      <div role="row" className="sr-only">
        <span role="columnheader">Nombre</span>
        <span role="columnheader">Tipo</span>
        <span role="columnheader">Fecha</span>
        <span role="columnheader">Estado</span>
        <span role="columnheader">Rama</span>
      </div>
      {items.map((ins) => (
        <div
          role="row"
          key={ins.id}
          className="flex flex-col gap-2.5 rounded-card bg-surface p-4 shadow-card"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span role="cell" className="truncate text-base font-extrabold">
                {ins.nombre || 'Sin nombre'}
              </span>
              <div className="flex flex-wrap items-center gap-x-1.5 text-sm text-muted">
                <span role="cell">{ins.type === 'adulto' ? 'Adulto Voluntario' : 'Beneficiario'}</span>
                <span aria-hidden="true">·</span>
                <span role="cell">
                  {new Date(ins.created_at).toLocaleDateString('es-SV', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
            <span role="cell" className="flex-none">
              <StatusChip status={ins.status} />
            </span>
          </div>
          {/* La celda de rama siempre existe para que cada fila tenga las mismas columnas */}
          <span role="cell" className={ins.rama ? undefined : 'sr-only'}>
            {ins.rama ? <RamaChip value={ins.rama} /> : 'Sin rama'}
          </span>
          {ins.status === 'rejected' && ins.rejection_reason && (
            <p className="m-0 rounded-control bg-danger-soft px-3 py-2 text-[13px] font-bold text-danger">
              Motivo: {ins.rejection_reason}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
