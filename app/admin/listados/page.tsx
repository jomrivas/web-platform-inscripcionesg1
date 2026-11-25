// app/admin/listados/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { RamaChip, StatusChip } from '@/components/ui/Chips';
import { cx } from '@/components/ui/cx';
import { ramaLabel as etiquetaRama } from '@/lib/ramas';

interface InscriptionRow {
  id: string;
  type: string;
  inscription_year: number;
  status: string;
  nombre: string;
  identificacion: string;
  email_contacto: string;
  rama: string;
  created_at: string;
}

const ramaLabel = (rama: string) => etiquetaRama(rama) || '-';

function mapInscriptions(
  data: Array<Record<string, unknown>>
): InscriptionRow[] {
  return data.map((r) => {
    const adult = (
      Array.isArray(r.adult_forms) ? r.adult_forms[0] : r.adult_forms
    ) as Record<string, string> | null;
    const ben = (
      Array.isArray(r.beneficiary_forms)
        ? r.beneficiary_forms[0]
        : r.beneficiary_forms
    ) as Record<string, string> | null;
    const form = adult || ben || {};
    return {
      id: String(r.id),
      type: String(r.type),
      inscription_year: Number(r.inscription_year),
      status: String(r.status),
      nombre: String(form.nombre_completo || '-'),
      identificacion: String(form.dui || form.dui_numero || '-'),
      email_contacto: String(
        form.email || form.madre_email || form.padre_email || '-'
      ),
      rama: String(form.rama || form.rama_inscripcion || ''),
      created_at: String(r.created_at),
    };
  });
}

export default function ListadosAdminPage() {
  const supabase = createClient();
  const [rows, setRows] = useState<InscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterYear, setFilterYear] = useState(
    new Date().getFullYear().toString()
  );
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRama, setFilterRama] = useState('all');
  const [search, setSearch] = useState('');

  const buildQuery = () => {
    let query = supabase
      .from('inscriptions')
      .select(
        `
        id, type, inscription_year, status, created_at,
        adult_forms ( nombre_completo, dui, email, rama ),
        beneficiary_forms ( nombre_completo, dui_numero, email, madre_email, padre_email, rama_inscripcion )
      `
      )
      .order('created_at', { ascending: false });

    if (filterYear !== 'all') {
      query = query.eq('inscription_year', parseInt(filterYear));
    }
    if (filterType !== 'all') {
      query = query.eq('type', filterType);
    }
    if (filterStatus !== 'all') {
      query = query.eq('status', filterStatus);
    }
    return query;
  };

  const loadData = async () => {
    const { data, error } = await buildQuery();
    if (!error && data) {
      setRows(mapInscriptions(data as Array<Record<string, unknown>>));
    }
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data, error } = await buildQuery();
      if (cancelled) return;
      if (!error && data) {
        setRows(mapInscriptions(data as Array<Record<string, unknown>>));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterYear, filterType, filterStatus]);

  const ramaOptions = Array.from(
    new Set(rows.map((r) => r.rama).filter(Boolean))
  ).sort();

  const filteredRows = rows.filter((row) => {
    if (filterRama !== 'all' && row.rama !== filterRama) return false;
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      row.nombre?.toLowerCase().includes(term) ||
      row.identificacion?.toLowerCase().includes(term) ||
      row.email_contacto?.toLowerCase().includes(term)
    );
  });

  const authHeaders = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`,
    };
  };

  const handleStatusChange = async (
    id: string,
    status: 'submitted' | 'approved' | 'rejected' | 'draft'
  ) => {
    let rejection_reason: string | undefined;
    if (status === 'rejected') {
      const input = prompt('Motivo del rechazo:');
      if (!input?.trim()) return;
      rejection_reason = input.trim();
    }
    const confirmMsg =
      status === 'approved'
        ? '¿Aprobar esta inscripción?'
        : status === 'rejected'
          ? '¿Rechazar esta inscripción?'
          : '¿Cambiar el estado de esta inscripción?';
    if (!window.confirm(confirmMsg)) return;

    const response = await fetch(`/api/inscriptions/${id}`, {
      method: 'PATCH',
      headers: await authHeaders(),
      body: JSON.stringify({ status, rejection_reason }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      alert(
        result.error === 'Estado inválido'
          ? 'La base de datos aún no acepta ese estado. Aplica la migración supabase/migrations/0002_approved_status.sql en Supabase.'
          : 'Error al actualizar estado: ' + (result.error || '')
      );
      return;
    }
    await loadData();
  };

  const handleExport = async (format: string) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const params = new URLSearchParams({
      format,
      year: filterYear,
      type: filterType,
      status: filterStatus,
    });

    const response = await fetch(`/api/export?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
      },
    });

    if (!response.ok) {
      alert('Error al exportar');
      return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const ext =
      format === 'excel' ? 'xlsx' : format === 'pdf' ? 'pdf' : format;
    a.download = `gs1-inscripciones-${filterYear}.${ext}`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const selectCls =
    'h-11 rounded-xl border-[1.5px] border-line bg-surface px-3 text-sm font-bold text-ink-soft';

  const total = filteredRows.length;
  const kpis = [
    { label: 'Total', value: total },
    { label: 'Beneficiarios', value: filteredRows.filter((r) => r.type === 'beneficiario').length },
    { label: 'Adultos', value: filteredRows.filter((r) => r.type === 'adulto').length },
    { label: 'Por revisar', value: filteredRows.filter((r) => r.status === 'submitted').length, warn: true },
  ];

  const tipoBtn = (value: string, label: string) => (
    <button
      type="button"
      aria-pressed={filterType === value}
      onClick={() => {
        setLoading(true);
        setFilterType(value);
      }}
      className={cx(
        'h-11 rounded-[10px] px-3.5 text-sm',
        filterType === value ? 'bg-surface font-extrabold text-brand shadow-card' : 'font-bold text-ink-soft hover:text-ink',
      )}
    >
      {label}
    </button>
  );

  const accion =
    'inline-flex min-h-11 items-center rounded-lg px-2.5 text-[13px] font-extrabold transition-colors';

  return (
    <div className="flex max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-bold text-muted">
            {filterYear === 'all' ? 'Todos los años' : `Año de inscripción ${filterYear}`}
          </span>
          <h1 className="m-0 text-[28px] font-extrabold tracking-tight">Inscripciones</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Exportar">
          <span className="text-sm font-bold text-muted">Exportar</span>
          {[
            ['csv', 'CSV'],
            ['excel', 'Excel'],
            ['pdf', 'PDF'],
            ['sql', 'Respaldo SQL'],
          ].map(([f, l]) => (
            <Button key={f} variant="secondary" className="h-11 px-4 text-sm" onClick={() => handleExport(f)}>
              {l}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className={cx('flex flex-col gap-1.5 rounded-card p-5', k.warn ? 'bg-warn-soft' : 'bg-surface shadow-card')}>
            <span className={cx('text-sm font-bold', k.warn ? 'text-warn' : 'text-muted')}>{k.label}</span>
            <span className={cx('text-[32px] font-extrabold tracking-tight', k.warn && 'text-warn-strong')}>{k.value}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col overflow-hidden rounded-card bg-surface shadow-card">
        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
          <div className="relative flex min-w-60 flex-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="pointer-events-none absolute top-3.5 left-3.5 text-muted">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-4-4" />
            </svg>
            <input
              type="search"
              aria-label="Buscar por nombre, DUI o correo"
              placeholder="Buscar por nombre, DUI o correo"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full rounded-xl border-[1.5px] border-line bg-surface pr-3.5 pl-10.5 text-[15px] text-ink focus:border-brand"
            />
          </div>
          <div className="flex gap-1 rounded-xl bg-canvas p-1" role="group" aria-label="Tipo">
            {tipoBtn('all', 'Todos')}
            {tipoBtn('beneficiario', 'Beneficiarios')}
            {tipoBtn('adulto', 'Adultos')}
          </div>
          <select
            aria-label="Estado"
            value={filterStatus}
            onChange={(e) => {
              setLoading(true);
              setFilterStatus(e.target.value);
            }}
            className={selectCls}
          >
            <option value="all">Todos los estados</option>
            <option value="draft">Borrador</option>
            <option value="submitted">En revisión</option>
            <option value="approved">Aprobada</option>
            <option value="rejected">Rechazada</option>
          </select>
          <select aria-label="Rama" value={filterRama} onChange={(e) => setFilterRama(e.target.value)} className={selectCls}>
            <option value="all">Todas las ramas</option>
            {ramaOptions.map((r) => (
              <option key={r} value={r}>
                {ramaLabel(r)}
              </option>
            ))}
          </select>
          <select
            aria-label="Año"
            value={filterYear}
            onChange={(e) => {
              setLoading(true);
              setFilterYear(e.target.value);
            }}
            className={selectCls}
          >
            <option value="all">Todos los años</option>
            {Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - i).map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Tabla: se desplaza dentro de su caja en pantallas angostas (E5) */}
        {loading ? (
          <p role="status" className="m-0 px-5 py-8 text-center text-muted">
            Cargando...
          </p>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-240 border-collapse text-[15px]">
              <thead>
                <tr className="text-left text-[13px] tracking-wide text-muted uppercase">
                  <th className="px-5 py-3.5 font-extrabold">Nombre</th>
                  <th className="px-3 py-3.5 font-extrabold">Tipo</th>
                  <th className="px-3 py-3.5 font-extrabold">Rama</th>
                  <th className="px-3 py-3.5 font-extrabold">Estado</th>
                  <th className="px-3 py-3.5 font-extrabold">Identificación</th>
                  <th className="px-3 py-3.5 font-extrabold">Correo</th>
                  <th className="px-3 py-3.5 font-extrabold">Enviada</th>
                  <th className="relative px-5 py-3.5">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id} className="border-t border-line-soft align-middle">
                    <td className="min-w-44 px-5 py-3.5 font-extrabold">{row.nombre || '-'}</td>
                    <td className="px-3 py-3.5 text-ink-soft">{row.type === 'adulto' ? 'Adulto' : 'Beneficiario'}</td>
                    <td className="px-3 py-3.5">{row.rama ? <RamaChip value={row.rama} /> : <span className="text-muted">-</span>}</td>
                    <td className="px-3 py-3.5">
                      <StatusChip status={row.status} />
                    </td>
                    <td className="px-3 py-3.5 text-ink-soft">{row.identificacion || '-'}</td>
                    <td className="max-w-56 truncate px-3 py-3.5 text-ink-soft" title={row.email_contacto}>
                      {row.email_contacto || '-'}
                    </td>
                    <td className="px-3 py-3.5 whitespace-nowrap text-ink-soft">
                      {new Date(row.created_at).toLocaleDateString('es-SV', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-nowrap justify-end gap-1">
                        <Link href={`/admin/inscripciones/${row.id}`} className={cx(accion, 'text-brand hover:bg-brand-soft')}>
                          {row.status === 'submitted' ? 'Revisar' : 'Ver'}
                        </Link>
                        {row.status === 'submitted' && (
                          <button type="button" onClick={() => handleStatusChange(row.id, 'approved')} className={cx(accion, 'text-ok hover:bg-ok-soft')}>
                            Aprobar
                          </button>
                        )}
                        {row.status !== 'rejected' ? (
                          <button type="button" onClick={() => handleStatusChange(row.id, 'rejected')} className={cx(accion, 'text-danger hover:bg-danger-soft')}>
                            Rechazar
                          </button>
                        ) : (
                          <button type="button" onClick={() => handleStatusChange(row.id, 'submitted')} className={cx(accion, 'text-warn hover:bg-warn-soft')}>
                            Reabrir
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-muted">
                      No hay registros con estos filtros
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
