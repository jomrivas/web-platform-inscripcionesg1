// src/components/ui/Chips.tsx
// Chips de estado y de rama (spec 005, E6): siempre punto + texto,
// el color nunca es la única señal.
import { RAMAS, ramaLabel, type RamaId } from '@/lib/ramas';
import { cx } from './cx';

const chip =
  'inline-flex h-6.5 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[13px] font-bold';

export type InscriptionStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

const STATUS: Record<InscriptionStatus, { label: string; chip: string; dot: string }> = {
  draft: { label: 'Borrador', chip: 'bg-canvas text-muted', dot: 'bg-muted' },
  submitted: { label: 'En revisión', chip: 'bg-warn-soft text-warn', dot: 'bg-warn' },
  approved: { label: 'Aprobada', chip: 'bg-ok-soft text-ok', dot: 'bg-ok' },
  rejected: { label: 'Rechazada', chip: 'bg-danger-soft text-danger', dot: 'bg-danger' },
};

export function StatusChip({ status, className }: { status: string; className?: string }) {
  const s = STATUS[status as InscriptionStatus] ?? STATUS.draft;
  return (
    <span className={cx(chip, s.chip, className)}>
      <span aria-hidden="true" className={cx('size-1.5 rounded-full', s.dot)} />
      {s.label}
    </span>
  );
}

const RAMA_TONE: Record<RamaId, { chip: string; dot: string }> = {
  manada: { chip: 'bg-manada-soft', dot: 'bg-manada-dot' },
  unidad: { chip: 'bg-unidad-soft', dot: 'bg-unidad' },
  caminantes: { chip: 'bg-caminantes-soft', dot: 'bg-caminantes' },
  rover: { chip: 'bg-rover-soft', dot: 'bg-rover' },
};

/** Chip de rama a partir del valor guardado (p. ej. `scouts_11_14`).
 *  Un valor que no es rama conocida se muestra como texto simple. */
export function RamaChip({ value, className }: { value: string | null | undefined; className?: string }) {
  const rama = value ? RAMAS[value] : undefined;
  if (!rama) {
    return <span className={cx('text-ink-soft', className)}>{ramaLabel(value)}</span>;
  }
  const tone = RAMA_TONE[rama.id];
  return (
    <span className={cx(chip, 'text-ink', tone.chip, className)}>
      <span aria-hidden="true" className={cx('size-2 rounded-full', tone.dot)} />
      {rama.label}
    </span>
  );
}
