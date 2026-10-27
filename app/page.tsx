// app/page.tsx
import React from 'react';
import bgLogin from '@/bg_login_wpg1.jpeg';

export default function HomePage() {
  return (
    <div
      className="relative min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat px-4"
      style={{ backgroundImage: `url(${bgLogin.src})` }}
    >
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
      <div className="relative z-10 max-w-lg w-full bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Grupo Scout No. 1 &quot;Los Intrépidos&quot;
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
