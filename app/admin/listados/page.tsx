// app/admin/listados/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

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

const RAMA_LABELS: Record<string, string> = {
  manada_7_10: 'Manada (7-10)',
  scouts_11_14: 'Scouts (11-14)',
  caminantes_15_17: 'Caminantes (15-17)',
  rovers_18_21: 'Rovers (18-21)',
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Borrador', cls: 'bg-gray-100 text-gray-700' },
  submitted: { label: 'Pendiente', cls: 'bg-yellow-100 text-yellow-800' },
  approved: { label: 'Aprobado', cls: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rechazado', cls: 'bg-red-100 text-red-700' },
};

const ramaLabel = (rama: string) => RAMA_LABELS[rama] || rama || '-';

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

  const selectCls = 'px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900';

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Listado de Inscripciones
      </h2>

      {/* Filtros */}
      <div className="bg-white border rounded-lg p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Año
          </label>
          <select
            value={filterYear}
            onChange={(e) => {
              setLoading(true);
              setFilterYear(e.target.value);
            }}
            className={selectCls}
          >
            <option value="all">Todos</option>
            {Array.from(
              { length: 4 },
              (_, i) => new Date().getFullYear() - i
            ).map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Tipo
          </label>
          <select
            value={filterType}
            onChange={(e) => {
              setLoading(true);
              setFilterType(e.target.value);
            }}
            className={selectCls}
          >
            <option value="all">Todos</option>
            <option value="adulto">Adulto</option>
            <option value="beneficiario">Beneficiario</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Rama
          </label>
          <select
            value={filterRama}
            onChange={(e) => setFilterRama(e.target.value)}
            className={selectCls}
          >
            <option value="all">Todas</option>
            {ramaOptions.map((r) => (
              <option key={r} value={r}>
                {ramaLabel(r)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Estado
          </label>
          <select
            value={filterStatus}
            onChange={(e) => {
              setLoading(true);
              setFilterStatus(e.target.value);
            }}
            className={selectCls}
          >
            <option value="all">Todos</option>
            <option value="draft">Borrador</option>
            <option value="submitted">Pendiente</option>
            <option value="approved">Aprobado</option>
            <option value="rejected">Rechazado</option>
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Buscar
          </label>
          <input
            type="text"
            placeholder="Nombre, DUI o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900"
          />
        </div>
      </div>

      {/* Botones de exportación */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => handleExport('csv')}
          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
        >
          📊 CSV
        </button>
        <button
          onClick={() => handleExport('excel')}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"
        >
          📈 Excel
        </button>
        <button
          onClick={() => handleExport('pdf')}
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
        >
          📄 PDF
        </button>
        <button
          onClick={() => handleExport('sql')}
          className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-800"
        >
          🗄️ SQL Backup
        </button>
      </div>

      {/* Tabla */}
      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <div className="bg-white border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Identificación</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Rama</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tipo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Año</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const meta = STATUS_META[row.status] || {
                  label: row.status,
                  cls: 'bg-gray-100 text-gray-700',
                };
                return (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="px-4 py-3">{row.nombre || '-'}</td>
                    <td className="px-4 py-3">{row.identificacion || '-'}</td>
                    <td className="px-4 py-3">{row.email_contacto || '-'}</td>
                    <td className="px-4 py-3">{ramaLabel(row.rama)}</td>
                    <td className="px-4 py-3">
                      {row.type === 'adulto' ? 'Adulto' : 'Beneficiario'}
                    </td>
                    <td className="px-4 py-3">{row.inscription_year}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${meta.cls}`}
                      >
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <a
                        href={`/admin/inscripciones/${row.id}`}
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 mr-1 inline-block"
                      >
                        Editar
                      </a>
                      {row.status === 'submitted' && (
                        <button
                          onClick={() => handleStatusChange(row.id, 'approved')}
                          className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 mr-1"
                        >
                          Aprobar
                        </button>
                      )}
                      {row.status !== 'rejected' ? (
                        <button
                          onClick={() => handleStatusChange(row.id, 'rejected')}
                          className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          Rechazar
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(row.id, 'submitted')}
                          className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                        >
                          Reabrir
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    No hay registros con estos filtros
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
