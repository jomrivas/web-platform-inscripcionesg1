// src/components/ui/BrandLogo.tsx
// Logo del Grupo Scout No. 1 desde public/brand/ (spec 005, A10).
import Image from 'next/image';

const LOGOS = {
  /** Logo completo a color, sobre fondo claro */
  main: { src: '/brand/SVG/Main.svg', w: 2827, h: 1055 },
  /** Logo completo en blanco, sobre el azul de marca */
  'main-negative': { src: '/brand/SVG/Main%20negative.svg', w: 2822, h: 1053 },
  /** Isotipo a color */
  isotipo: { src: '/brand/SVG/isotipo.svg', w: 1024, h: 1031 },
  /** Isotipo en blanco */
  'isotipo-blanco': { src: '/brand/SVG/isotipo_blanco.svg', w: 1024, h: 1031 },
} as const;

export type LogoVariant = keyof typeof LOGOS;

export function BrandLogo({
  variant = 'main',
  width,
  className,
  priority,
  decorative,
}: {
  variant?: LogoVariant;
  /** Ancho en px; el alto se calcula con la proporción del archivo. */
  width: number;
  className?: string;
  priority?: boolean;
  /** true cuando el nombre del grupo ya está escrito al lado. */
  decorative?: boolean;
}) {
  const logo = LOGOS[variant];
  return (
    <Image
      src={logo.src}
      width={width}
      height={Math.round((width * logo.h) / logo.w)}
      alt={decorative ? '' : 'Grupo Scout No. 1 Los Intrépidos'}
      className={className}
      priority={priority}
      unoptimized
    />
  );
}
