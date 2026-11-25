// src/components/ui/Stepper.tsx
// Indicador de pasos de las fichas (spec 005, §6).
// Con `onSelect`, cada paso es un botón para saltar a él; su nombre
// accesible es el nombre del paso, el mismo que tenía la pestaña.
import { cx } from './cx';

export function Stepper({
  steps,
  current,
  onSelect,
  className,
}: {
  /** Nombres de los pasos, en orden. */
  steps: string[];
  /** Índice del paso actual, desde 0. */
  current: number;
  onSelect?: (index: number) => void;
  className?: string;
}) {
  const last = steps.length - 1;
  return (
    <nav aria-label="Progreso de la ficha" className={cx('flex flex-col gap-2.5', className)}>
      <ol className="flex items-center gap-1.5">
        {steps.map((name, i) => {
          const done = i < current;
          const active = i === current;
          const bubble = cx(
            'relative flex size-6 flex-none items-center justify-center rounded-full text-xs font-extrabold',
            done && 'bg-brand text-on-brand',
            active && 'bg-surface text-brand ring-2 ring-inset ring-brand',
            !done && !active && 'bg-canvas font-bold text-muted',
          );
          const content = done ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12l5 5 9-10" />
            </svg>
          ) : (
            <span aria-hidden="true">{i + 1}</span>
          );
          return (
            <li key={name} className={cx('flex items-center gap-1.5', i < last && 'flex-1')}>
              {onSelect ? (
                <button
                  type="button"
                  aria-label={name}
                  aria-current={active ? 'step' : undefined}
                  onClick={() => onSelect(i)}
                  // Área tocable de 44 px alrededor del círculo de 24 px (R4)
                  className={cx(bubble, 'cursor-pointer after:absolute after:-inset-2.5 after:content-[""]')}
                >
                  {content}
                </button>
              ) : (
                <span aria-current={active ? 'step' : undefined} className={bubble}>
                  {content}
                  <span className="sr-only">{` ${name}${done ? ' (completado)' : ''}`}</span>
                </span>
              )}
              {i < last && (
                <span aria-hidden="true" className={cx('h-0.75 flex-1 rounded-full', done ? 'bg-brand' : 'bg-line')} />
              )}
            </li>
          );
        })}
      </ol>
      <p className="text-[13px] font-bold text-muted">
        Paso {current + 1} de {steps.length}
        {current === last ? ' · Último paso' : ''}
      </p>
    </nav>
  );
}
