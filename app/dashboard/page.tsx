// app/dashboard/page.tsx
import React from 'react';

export default function DashboardPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Bienvenido!</h2>
      <p className="text-gray-600 mb-8">¿Qué deseas hacer hoy?</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <a
          href="/dashboard/nuevo-formulario"
          className="bg-white border-2 border-blue-200 hover:border-blue-500 rounded-xl p-8 text-center transition-colors shadow-sm hover:shadow-md"
        >
          <div className="text-5xl mb-4">📝</div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Nuevo Formulario
          </h3>
          <p className="text-gray-600 text-sm">
            Llena una nueva ficha de inscripción (Adulto o Beneficiario)
          </p>
        </a>

        <a
          href="/dashboard/mis-inscripciones"
          className="bg-white border-2 border-green-200 hover:border-green-500 rounded-xl p-8 text-center transition-colors shadow-sm hover:shadow-md"
        >
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Mis Inscripciones
          </h3>
          <p className="text-gray-600 text-sm">
            Consulta el estado de tus fichas ya enviadas
          </p>
        </a>
      </div>
    </div>
  );
}
