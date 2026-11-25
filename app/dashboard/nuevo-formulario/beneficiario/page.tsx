// app/app/nuevo-formulario/beneficiario/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import FormularioBeneficiario, {
  type FormDataBeneficiario,
} from '@/components/FormularioBeneficiario';

export default function NuevoFormularioBeneficiarioPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  // Errores por campo del servidor: la ficha abre el paso del campo (E3)
  const [serverErrors, setServerErrors] = useState<Record<string, string[] | undefined>>();

  const handleSubmit = async (formData: FormDataBeneficiario) => {
    setIsLoading(true);
    setSubmitError('');
    setServerErrors(undefined);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      void user;
      const response = await fetch('/api/inscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'beneficiario',
          formData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.details) setServerErrors(result.details);
        throw new Error(result.error || 'Error al enviar el formulario');
      }

      router.push('/dashboard/mis-inscripciones?success=true');
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Ocurrió un error inesperado'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {submitError && (
        <div className="mx-auto max-w-2xl px-6 pt-4">
          <p role="alert" className="m-0 rounded-control bg-danger-soft px-4 py-3 text-sm font-bold text-danger">
            {submitError}
          </p>
        </div>
      )}
      <FormularioBeneficiario onSubmit={handleSubmit} isLoading={isLoading} serverErrors={serverErrors} />
    </div>
  );
}
