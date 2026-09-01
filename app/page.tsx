// app/page.tsx
import React from 'react';

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 px-4">
      <div className="max-w-lg w-full text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Grupo Scout No. 1 "Los Intrépidos"
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Sistema de Inscripciones
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/login"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Iniciar Sesión
          </a>
          <a
            href="/signup"
            className="bg-white text-blue-600 border-2 border-blue-600 px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors font-medium"
          >
            Crear Cuenta
          </a>
        </div>
      </div>
    </div>
  );
}
