'use client';
// Selector de tipo de ficha (tablero 3 · ¿Quién se inscribe?)
import { useState } from 'react';
import { ButtonLink } from '@/components/ui/Button';
import { cx } from '@/components/ui/cx';

const RAMAS = [
  { label: 'Manada 7–10', dot: 'bg-manada-dot', tint: 'bg-manada-soft' },
  { label: 'Unidad Scout 11–14', dot: 'bg-unidad', tint: 'bg-unidad-soft' },
  { label: 'Caminantes 15–17', dot: 'bg-caminantes', tint: 'bg-caminantes-soft' },
  { label: 'Clan Rover 18–21', dot: 'bg-rover', tint: 'bg-rover-soft' },
];

const TIPOS = {
  beneficiario: { href: '/dashboard/nuevo-formulario/beneficiario', titulo: 'Beneficiario', detalle: 'Niños y jóvenes de 7 a 21 años' },
  adulto: { href: '/dashboard/nuevo-formulario/adulto', titulo: 'Adulto voluntario', detalle: 'Dirigentes, comité y responsables' },
} as const;
type Tipo = keyof typeof TIPOS;

const Icon = ({ tipo }: { tipo: Tipo }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {tipo === 'beneficiario' ? (
      <>
        <circle cx="12" cy="7" r="3.5" />
        <path d="M5.5 21c.8-4 3.3-6 6.5-6s5.7 2 6.5 6" />
      </>
    ) : (
      <>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20c.7-3.6 3.1-5.5 6.5-5.5s5.8 1.9 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18.5 14.8c1.7.7 2.7 2.4 3 5.2" />
      </>
    )}
  </svg>
);

export function TipoSelector() {
  const [tipo, setTipo] = useState<Tipo>('beneficiario');

  return (
    <div className="flex flex-col gap-5">
      <fieldset className="m-0 flex flex-col gap-3 border-none p-0">
        <legend className="sr-only">Tipo de ficha</legend>
        {(Object.keys(TIPOS) as Tipo[]).map((t) => {
          const checked = tipo === t;
          return (
            <label
              key={t}
              className={cx(
                'flex cursor-pointer flex-col gap-4 rounded-panel bg-surface p-5 transition-shadow',
                checked ? 'shadow-[inset_0_0_0_2px_var(--color-brand)]' : 'shadow-[inset_0_0_0_1.5px_var(--color-line)] hover:shadow-[inset_0_0_0_1.5px_var(--color-line-strong)]',
              )}
            >
              <span className="flex items-center gap-4">
                <span className={cx('flex size-12 flex-none items-center justify-center rounded-control', checked ? 'bg-brand text-on-brand' : 'bg-brand-soft text-brand')}>
                  <Icon tipo={t} />
                </span>
                <span className="flex flex-1 flex-col gap-0.5">
                  <span className="text-[17px] font-extrabold">{TIPOS[t].titulo}</span>
                  <span className="text-sm text-muted">{TIPOS[t].detalle}</span>
                </span>
                <input
                  type="radio"
                  name="tipo"
                  value={t}
                  checked={checked}
                  onChange={() => setTipo(t)}
                  className="size-5 flex-none accent-brand"
                />
              </span>
              {t === 'beneficiario' && (
                <span className="flex flex-wrap gap-2">
                  {RAMAS.map((r) => (
                    <span key={r.label} className={cx('inline-flex h-6.5 items-center gap-1.5 rounded-full px-2.5 text-xs font-bold text-ink', r.tint)}>
                      <span aria-hidden="true" className={cx('size-2 rounded-full', r.dot)} />
                      {r.label}
                    </span>
                  ))}
                </span>
              )}
            </label>
          );
        })}
      </fieldset>

      <div className="flex flex-col gap-2.5 rounded-card bg-canvas p-4">
        <span className="text-[13px] font-extrabold tracking-wider text-muted uppercase">Ten a mano antes de empezar</span>
        {['DUI de la madre, padre o tutor', 'Carnet de vacunación', 'Datos del seguro médico, si tiene'].map((t) => (
          <span key={t} className="flex items-center gap-2.5 text-[15px] text-ink-soft">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-none text-ok">
              <path d="M5 12l5 5 9-10" />
            </svg>
            {t}
          </span>
        ))}
      </div>

      <ButtonLink href={TIPOS[tipo].href} size="lg" fullWidth>
        Empezar ficha
      </ButtonLink>
    </div>
  );
}
