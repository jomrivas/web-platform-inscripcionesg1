// app/layout.tsx
import type { Metadata } from 'next';
import { Nunito } from 'next/font/google';
import './globals.css';

// Nunito autoalojada por next/font: se descarga en el build y se sirve
// desde el mismo dominio, sin peticiones a Google en el navegador.
const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-nunito',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Grupo Scout No. 1 "Los Intrépidos" - Inscripciones',
  description:
    'Plataforma de inscripciones - Grupo Scout No. 1 "Los Intrépidos" (Manada, Unidad Scout, Comunidad de Caminantes y Clan Rover)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={nunito.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
