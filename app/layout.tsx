// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Grupo Scout No. 1 "Los Intrépidos" - Inscripciones',
  description:
    'Plataforma de inscripciones - Grupo Scout No. 1 "Los Intrépidos" (Manada, Scouts, Caminantes y Clan Maya/Rovers)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
