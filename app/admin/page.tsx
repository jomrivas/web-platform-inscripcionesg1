// app/admin/page.tsx
import React from 'react';
import { createClient } from '@/lib/supabase-server';

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const currentYear = new Date().getFullYear();

  const { data: inscriptions } = await supabase
    .from('inscriptions')
    .select('type, status, inscription_year')
    .eq('inscription_year', currentYear);

  const total = inscriptions?.length || 0;
  const adultos = inscriptions?.filter((i) => i.type === 'adulto').length || 0;
  const beneficiarios =
    inscriptions?.filter((i) => i.type === 'beneficiario').length || 0;
  const pendientes =
    inscriptions?.filter((i) => i.status === 'submitted').length || 0;

  const cards = [
    { label: 'Total Inscripciones', value: total, color: 'bg-blue-50 text-blue-700' },
    { label: 'Adultos Voluntarios', value: adultos, color: 'bg-orange-50 text-orange-700' },
    { label: 'Beneficiarios', value: beneficiarios, color: 'bg-purple-50 text-purple-700' },
    { label: 'Pendientes de Revisión', value: pendientes, color: 'bg-yellow-50 text-yellow-700' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Dashboard - Año {currentYear}
      </h2>
      <p className="text-gray-600 mb-8">Resumen general de inscripciones</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className={`rounded-xl p-6 ${card.color}`}>
            <p className="text-3xl font-bold">{card.value}</p>
            <p className="text-sm font-medium mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <a
        href="/admin/listados"
        className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        Ver Listado Completo →
      </a>
    </div>
  );
}
