// app/page.tsx — Portada pública (spec 005, tableros 0 · Portada)
import { AuthShell } from '@/components/familia/AuthShell';
import { INSCRIPCION_ORDINARIA, LEMA } from '@/components/familia/textos';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { ButtonLink } from '@/components/ui/Button';

const PASOS = [
  { titulo: 'Crea tu cuenta', detalle: 'Con tu correo y una contraseña.' },
  { titulo: 'Llena y firma la ficha', detalle: 'Paso a paso, con firma desde la pantalla.' },
  { titulo: 'El grupo la revisa', detalle: 'Verás el estado en tus inscripciones.' },
];

export default function HomePage() {
  return (
    <AuthShell portada>
      <div className="hidden items-center gap-3 lg:flex">
        <BrandLogo variant="isotipo" width={48} decorative />
        <div className="flex flex-col">
          <span className="text-base font-black">Grupo Scout No. 1</span>
          <span className="text-xs font-extrabold tracking-[1.5px] text-muted uppercase">Los Intrépidos · Inscripciones</span>
        </div>
      </div>

      <div className="flex flex-col gap-1 lg:gap-1.5">
        <h2 className="m-0 text-[22px] font-black lg:text-3xl lg:tracking-tight">Así de simple</h2>
        <p className="m-0 text-[15px] text-muted lg:text-base">Todo desde tu celular, en una sola sesión.</p>
      </div>

      <ol className="m-0 flex list-none flex-col gap-3 p-0 lg:gap-4">
        {PASOS.map((p, i) => (
          <li key={p.titulo} className="flex items-start gap-3.5 lg:gap-4">
            <span className="flex size-8 flex-none items-center justify-center rounded-full bg-brand text-sm font-black text-on-brand lg:size-9 lg:text-[15px]">
              {i + 1}
            </span>
            <div className="flex flex-col gap-0.5 pt-1 lg:pt-1.5">
              <span className="text-[15px] font-extrabold lg:text-base">{p.titulo}</span>
              <span className="text-sm text-muted">{p.detalle}</span>
            </div>
          </li>
        ))}
      </ol>

      <div className="flex flex-col gap-3">
        <ButtonLink href="/signup" size="lg" fullWidth className="font-black">
          Crear cuenta
        </ButtonLink>
        <ButtonLink href="/login" size="lg" variant="secondary" fullWidth className="border-line-strong">
          Ya tengo cuenta
        </ButtonLink>
      </div>

      <div className="flex items-center gap-3 rounded-control bg-surface px-4 py-3.5 shadow-[inset_0_0_0_1px_var(--color-line)]">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-none text-brand">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
        <span className="text-sm text-ink-soft">
          Inscripción ordinaria: <strong className="text-ink">{INSCRIPCION_ORDINARIA}</strong>
        </span>
      </div>

      <p className="m-0 text-center text-[13px] text-muted">{LEMA} · Grupo Scout No. 1</p>
    </AuthShell>
  );
}
