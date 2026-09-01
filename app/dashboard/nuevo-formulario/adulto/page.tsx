// app/app/nuevo-formulario/adulto/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import FormularioAdulto from '@/components/FormularioAdulto';

export default function NuevoFormularioAdultoPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (formData: any) => {
    setIsLoading(true);
    setSubmitError('');

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/inscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'adulto',
          formData,
          userId: user.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al enviar el formulario');
      }

      router.push('/dashboard/mis-inscripciones?success=true');
    } catch (error: any) {
      setSubmitError(error.message || 'Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {submitError && (
        <div className="max-w-4xl mx-auto mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {submitError}
        </div>
      )}
      <FormularioAdulto onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}
