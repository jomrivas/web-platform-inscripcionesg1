// src/components/familia/AuthShell.tsx
// Pantalla partida de la portada (spec 005, §3): panel de marca a la
// izquierda en escritorio; arriba, compacto, en móvil. Ingreso y registro
// la reutilizan.
import type { ReactNode } from 'react';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { cx } from '@/components/ui/cx';
import { PERIODO, SUBTITULO_PORTADA } from './textos';

function Lema({ as: Tag, className }: { as: 'h1' | 'p'; className?: string }) {
  return (
    <Tag className={cx('m-0 font-black tracking-tight text-manada', className)}>
      ¡Siempre listos
      <br />
      para servir!
    </Tag>
  );
}

export function AuthShell({
  children,
  /** En la portada el lema es el h1 y también se muestra en móvil. */
  portada = false,
}: {
  children: ReactNode;
  portada?: boolean;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas lg:flex-row">
      <section className="relative flex flex-col items-center justify-center gap-4.5 overflow-hidden bg-brand px-6 pt-11 pb-12 text-center lg:min-h-dvh lg:flex-1 lg:gap-7 lg:px-12 lg:pt-16 lg:pb-24">
        <BrandLogo variant="main-negative" width={380} priority className="h-auto w-62.5 lg:w-[min(380px,80%)]" />
        <span className="inline-flex h-7.5 items-center rounded-full bg-surface px-3.5 text-[11px] font-black tracking-[1.8px] text-brand uppercase lg:h-8.5 lg:px-4.5 lg:text-[13px] lg:tracking-[2px]">
          {PERIODO}
        </span>
        <Lema
          as={portada ? 'h1' : 'p'}
          className={cx('text-[32px] leading-[1.08] lg:block lg:text-[54px] lg:leading-[1.05]', !portada && 'hidden')}
        />
        <p className="m-0 hidden max-w-110 text-lg leading-relaxed text-on-brand-muted lg:block">{SUBTITULO_PORTADA}</p>
        <div aria-hidden="true" className="franja-ramas absolute inset-x-0 bottom-0 h-2.5 lg:h-3" />
      </section>

      <main className="flex flex-1 justify-center px-6 py-7 lg:items-center lg:px-8 lg:py-16">
        <div className="flex w-full max-w-105 flex-col gap-6 lg:gap-7">{children}</div>
      </main>
    </div>
  );
}
