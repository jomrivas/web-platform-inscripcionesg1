// app/signup/page.tsx
'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';
import { AuthFooter } from '@/components/familia/AuthFooter';
import { AuthShell } from '@/components/familia/AuthShell';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';

export default function SignupPage() {
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    setSuccess(true);
  };

  if (success) {
    return (
      <AuthShell>
        <div className="flex flex-col items-center gap-4 rounded-panel bg-surface p-8 text-center shadow-raised">
          <span className="flex size-16 items-center justify-center rounded-full bg-ok-soft text-ok">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12l5 5 9-10" />
            </svg>
          </span>
          <h1 className="m-0 text-2xl font-black">¡Cuenta creada!</h1>
          <p className="m-0 text-[15px] leading-normal text-muted">
            Revisa tu correo para confirmar tu cuenta antes de iniciar sesión.
          </p>
          <ButtonLink href="/login" size="lg" fullWidth>
            Ir a Iniciar Sesión
          </ButtonLink>
        </div>
        <AuthFooter />
      </AuthShell>
    );
  }

  const campo = (
    id: string,
    label: string,
    props: React.ComponentProps<'input'>,
    hint?: string,
  ) => (
    <Field label={label} id={id} hint={hint}>
      {(a) => <Input required {...props} {...a} />}
    </Field>
  );

  return (
    <AuthShell>
      <div className="flex flex-col gap-1">
        <h1 className="m-0 text-[22px] font-extrabold lg:text-3xl lg:font-black lg:tracking-tight">Crea tu cuenta</h1>
        <p className="m-0 text-[15px] leading-normal text-muted">
          Con tu correo y una contraseña podrás llenar las fichas de tu familia.
        </p>
      </div>

      <form onSubmit={handleSignup} method="post" className="flex flex-col gap-5">
        {campo('email', 'Correo electrónico', {
          type: 'email',
          name: 'email',
          autoComplete: 'email',
          value: email,
          onChange: (e) => setEmail(e.target.value),
          placeholder: 'tu@correo.com',
        })}
        {campo(
          'new-password',
          'Contraseña',
          {
            type: 'password',
            name: 'new-password',
            autoComplete: 'new-password',
            value: password,
            onChange: (e) => setPassword(e.target.value),
          },
          'Mínimo 6 caracteres',
        )}
        {campo('confirm-password', 'Confirmar contraseña', {
          type: 'password',
          name: 'confirm-password',
          autoComplete: 'new-password',
          value: confirmPassword,
          onChange: (e) => setConfirmPassword(e.target.value),
        })}

        {error && (
          <p role="alert" className="m-0 rounded-control bg-danger-soft px-4 py-3 text-sm font-bold text-danger">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" fullWidth disabled={loading}>
          {loading ? 'Creando cuenta...' : 'Registrarme'}
        </Button>
      </form>

      <p className="m-0 text-center text-[15px] text-muted">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="inline-flex min-h-11 items-center font-extrabold text-brand no-underline hover:underline">
          Inicia sesión
        </Link>
      </p>
      <AuthFooter />
    </AuthShell>
  );
}
