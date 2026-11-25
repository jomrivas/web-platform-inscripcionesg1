'use client';
// src/components/ficha/FichaShell.tsx
// Armazón de las fichas por pasos (spec 005, §6 y E1–E3): barra superior,
// indicador de pasos, contenido del paso y barra de acciones abajo.
import Link from 'next/link';
import { useEffect, useRef, type ReactNode } from 'react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Stepper } from '@/components/ui/Stepper';

export type FichaStep = { id: string; label: string; description?: string };

/** `familia`: pantalla completa con barra de salida (tablero 4).
 *  `admin`: embebida en la revisión del panel; guarda en vez de enviar. */
export type FichaVariant = 'familia' | 'admin';

/** Primer paso que contiene alguno de los errores. */
export function firstStepWithError(
  steps: readonly FichaStep[],
  stepKeys: Record<string, readonly string[]>,
  errors: Record<string, string>,
): string | undefined {
  return steps.find((s) => (stepKeys[s.id] ?? []).some((k) => errors[k]))?.id;
}

export function FichaShell({
  title,
  steps,
  current,
  onStepChange,
  onNext,
  isLoading,
  focusKey,
  exitHref = '/dashboard',
  backHref = '/dashboard/nuevo-formulario',
  variant = 'familia',
  children,
}: {
  title: string;
  steps: readonly FichaStep[];
  current: string;
  onStepChange: (id: string) => void;
  /** Valida el paso actual y avanza. */
  onNext: () => void;
  isLoading?: boolean;
  /** Cambia cada vez que hay que llevar el foco al primer error (E1). */
  focusKey?: number;
  exitHref?: string;
  /** Destino de "Atrás" en el primer paso. */
  backHref?: string;
  variant?: FichaVariant;
  children: ReactNode;
}) {
  const index = Math.max(0, steps.findIndex((s) => s.id === current));
  const step = steps[index];
  const isLast = index === steps.length - 1;
  const rootRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  // Al cambiar de paso, volver arriba y anunciar el título del paso.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (variant === 'familia') window.scrollTo({ top: 0 });
    else rootRef.current?.scrollIntoView({ block: 'start' });
    rootRef.current?.querySelector<HTMLElement>('[data-step-title]')?.focus({ preventScroll: true });
  }, [current, variant]);

  // Foco al primer campo con error, o al primer mensaje de error del paso.
  useEffect(() => {
    if (!focusKey) return;
    const id = requestAnimationFrame(() => {
      const root = rootRef.current;
      const target =
        root?.querySelector<HTMLElement>('[aria-invalid="true"]') ??
        root?.querySelector<HTMLElement>('[data-ficha-error]');
      target?.scrollIntoView({ block: 'center' });
      target?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(id);
  }, [focusKey]);

  return (
    <div
      ref={rootRef}
      className={
        variant === 'familia'
          ? 'mx-auto flex min-h-dvh w-full max-w-2xl flex-col bg-surface'
          : 'flex w-full scroll-mt-6 flex-col overflow-clip rounded-card bg-surface shadow-card'
      }
    >
      {variant === 'admin' ? (
        <div className="px-6 pt-5">
          <h2 className="m-0 text-[13px] font-extrabold tracking-wider text-muted uppercase">{title}</h2>
        </div>
      ) : (
      <div className="flex items-center justify-between gap-2 px-3 pt-4">
        <Link
          href={exitHref}
          aria-label="Salir de la ficha"
          className="flex size-11 items-center justify-center rounded-xl text-ink hover:bg-canvas"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </Link>
        <h1 className="text-center text-[15px] font-extrabold">{title}</h1>
        <span aria-hidden="true" className="size-11" />
      </div>
      )}

      <Stepper
        steps={steps.map((s) => s.label)}
        current={index}
        onSelect={(i) => onStepChange(steps[i].id)}
        className="px-6 pt-3"
      />

      <div className="flex flex-1 flex-col gap-5 px-6 pt-5 pb-8">
        <div className="flex flex-col gap-1">
          {variant === 'admin' ? (
            <h3 data-step-title tabIndex={-1} className="m-0 text-xl font-extrabold tracking-tight outline-none">
              {step.label}
            </h3>
          ) : (
            <h2 data-step-title tabIndex={-1} className="text-2xl font-extrabold tracking-tight outline-none">
              {step.label}
            </h2>
          )}
          {step.description && <p className="text-[15px] leading-normal text-muted">{step.description}</p>}
        </div>
        {children}
      </div>

      <div className="sticky bottom-0 grid grid-cols-[1fr_2fr] gap-3 border-t border-line bg-surface px-6 pt-3.5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {index === 0 && variant === 'admin' ? (
          <Button variant="secondary" size="lg" disabled>
            Atrás
          </Button>
        ) : index === 0 ? (
          <ButtonLink href={backHref} variant="secondary" size="lg">
            Atrás
          </ButtonLink>
        ) : (
          <Button variant="secondary" size="lg" onClick={() => onStepChange(steps[index - 1].id)}>
            Atrás
          </Button>
        )}
        {isLast ? (
          <Button type="submit" size="lg" disabled={isLoading}>
            {variant === 'admin'
              ? isLoading
                ? 'Guardando...'
                : 'Guardar cambios'
              : isLoading
                ? 'Enviando...'
                : 'Enviar Formulario'}
          </Button>
        ) : (
          <Button size="lg" onClick={onNext}>
            Siguiente
          </Button>
        )}
      </div>
    </div>
  );
}

/** Mensaje de error de un paso que no pertenece a un solo campo
 *  (p. ej. "al menos un tutor"). Recibe el foco en E1/E3. */
export function StepError({ children }: { children: ReactNode }) {
  return (
    <p
      data-ficha-error
      tabIndex={-1}
      role="alert"
      className="rounded-control bg-danger-soft px-4 py-3 text-sm font-bold text-danger outline-none"
    >
      {children}
    </p>
  );
}

/** Bloque con título dentro de un paso (p. ej. "Madre o tutora"). */
export function FichaSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-4">
      <legend className="mb-4 text-[13px] font-extrabold tracking-wider text-muted uppercase">{title}</legend>
      {children}
    </fieldset>
  );
}
