// app/app/nuevo-formulario/page.tsx
import React from 'react';

export default function SeleccionarTipoFormularioPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Nuevo Formulario de Inscripción
      </h2>
      <p className="text-gray-600 mb-8">Selecciona el tipo de ficha a llenar:</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <a
          href="/dashboard/nuevo-formulario/beneficiario"
          className="bg-white border-2 border-purple-200 hover:border-purple-500 rounded-xl p-8 text-center transition-colors shadow-sm hover:shadow-md"
        >
          <div className="text-5xl mb-4">🧑‍🎓</div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Beneficiario
          </h3>
          <p className="text-gray-600 text-sm">
            Manada, Scouts, Caminantes o Rovers (7 a 21 años)
          </p>
        </a>

        <a
          href="/dashboard/nuevo-formulario/adulto"
          className="bg-white border-2 border-orange-200 hover:border-orange-500 rounded-xl p-8 text-center transition-colors shadow-sm hover:shadow-md"
        >
          <div className="text-5xl mb-4">🧑‍🏫</div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Adulto Voluntario
          </h3>
          <p className="text-gray-600 text-sm">
            Dirigentes, comité y adultos en el movimiento scout
          </p>
        </a>
      </div>
    </div>
  );
}
