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
  created_at: string;
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
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterYear, filterType, filterStatus]);

  const loadData = async () => {
    setLoading(true);

    let query = supabase
      .from('inscriptions_summary')
      .select('*')
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

    const { data, error } = await query;

    if (!error && data) {
      setRows(data as InscriptionRow[]);
    }
    setLoading(false);
  };

  const filteredRows = rows.filter((row) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      row.nombre?.toLowerCase().includes(term) ||
      row.identificacion?.toLowerCase().includes(term) ||
      row.email_contacto?.toLowerCase().includes(term)
    );
  });

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
    a.download = `clan-maya-export.${format === 'excel' ? 'csv' : format === 'pdf' ? 'html' : format}`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

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
            onChange={(e) => setFilterYear(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">Todos</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Tipo
          </label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">Todos</option>
            <option value="adulto">Adulto</option>
            <option value="beneficiario">Beneficiario</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Estado
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">Todos</option>
            <option value="draft">Borrador</option>
            <option value="submitted">Enviado</option>
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
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
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tipo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Año</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="px-4 py-3">{row.nombre || '-'}</td>
                  <td className="px-4 py-3">{row.identificacion || '-'}</td>
                  <td className="px-4 py-3">{row.email_contacto || '-'}</td>
                  <td className="px-4 py-3">
                    {row.type === 'adulto' ? 'Adulto' : 'Beneficiario'}
                  </td>
                  <td className="px-4 py-3">{row.inscription_year}</td>
                  <td className="px-4 py-3">{row.status}</td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
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
