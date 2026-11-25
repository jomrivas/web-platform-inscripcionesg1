// app/admin/page.tsx — Resumen del panel admin
import Link from 'next/link';
import React from 'react';
import { createClient } from '@/lib/supabase-server';
import { cx } from '@/components/ui/cx';

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const currentYear = new Date().getFullYear();

  const { data: inscriptions } = await supabase
    .from('inscriptions')
    .select('type, status, inscription_year')
    .eq('inscription_year', currentYear);

  const total = inscriptions?.length || 0;
  const adultos = inscriptions?.filter((i) => i.type === 'adulto').length || 0;
  const beneficiarios = inscriptions?.filter((i) => i.type === 'beneficiario').length || 0;
  const pendientes = inscriptions?.filter((i) => i.status === 'submitted').length || 0;
  const aprobados = inscriptions?.filter((i) => i.status === 'approved').length || 0;

  const cards = [
    { label: 'Total', value: total },
    { label: 'Beneficiarios', value: beneficiarios },
    { label: 'Adultos voluntarios', value: adultos },
    { label: 'Por revisar', value: pendientes, tone: 'warn' as const },
    { label: 'Aprobadas', value: aprobados, tone: 'ok' as const },
  ];

  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-bold text-muted">Año de inscripción {currentYear}</span>
        <h1 className="m-0 text-[28px] font-extrabold tracking-tight">Resumen</h1>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className={cx(
              'flex flex-col gap-1.5 rounded-card p-5',
              c.tone === 'warn' ? 'bg-warn-soft' : c.tone === 'ok' ? 'bg-ok-soft' : 'bg-surface shadow-card',
            )}
          >
            <span className={cx('text-sm font-bold', c.tone === 'warn' ? 'text-warn' : c.tone === 'ok' ? 'text-ok' : 'text-muted')}>
              {c.label}
            </span>
            <span className={cx('text-[32px] font-extrabold tracking-tight', c.tone === 'warn' && 'text-warn-strong', c.tone === 'ok' && 'text-ok')}>
              {c.value}
            </span>
          </div>
        ))}
      </div>

      <Link
        href="/admin/listados"
        className="flex items-center justify-between gap-4 rounded-panel bg-brand p-5 text-on-brand no-underline hover:bg-brand-hover"
      >
        <span className="flex flex-col gap-0.5">
          <span className="text-[17px] font-extrabold">Revisar inscripciones</span>
          <span className="text-sm text-on-brand-muted">
            {pendientes > 0 ? `${pendientes} por revisar` : 'Listado completo, filtros y exportación'}
          </span>
        </span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </Link>
    </div>
  );
}
