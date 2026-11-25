// app/login/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';
import { AuthFooter } from '@/components/familia/AuthFooter';
import { AuthShell } from '@/components/familia/AuthShell';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setLoading(false);
      setError(
        signInError.message === 'Invalid login credentials'
          ? 'Correo o contraseña incorrectos'
          : signInError.message
      );
      return;
    }

    // Los administradores aterrizan directo en su dashboard
    let destination = '/dashboard';
    if (data.user) {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .single();
      if (roleData?.role === 'admin') destination = '/admin';
    }

    setLoading(false);
    router.push(destination);
    router.refresh();
  };

  return (
    <AuthShell>
      <div className="flex flex-col gap-1">
        <h1 className="m-0 text-[22px] font-extrabold lg:text-3xl lg:font-black lg:tracking-tight">Bienvenida, familia</h1>
        <p className="m-0 text-[15px] leading-normal text-muted">
          Ingresa para llenar o revisar tus fichas de inscripción.
        </p>
      </div>

      <form onSubmit={handleLogin} method="post" className="flex flex-col gap-5">
        <Field label="Correo electrónico" id="email">
          {(a) => (
            <Input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              {...a}
            />
          )}
        </Field>

        <Field label="Contraseña" id="password">
          {(a) => (
            <div className="relative flex">
              <Input
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                className="pr-13"
                {...a}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={showPassword}
                className="absolute top-1 right-1 flex size-11 items-center justify-center rounded-[10px] text-muted hover:bg-canvas"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                  <circle cx="12" cy="12" r="3" />
                  {showPassword && <path d="M4 4l16 16" />}
                </svg>
              </button>
            </div>
          )}
        </Field>

        {error && (
          <p role="alert" className="m-0 rounded-control bg-danger-soft px-4 py-3 text-sm font-bold text-danger">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" fullWidth disabled={loading}>
          {loading ? 'Ingresando...' : 'Iniciar Sesión'}
        </Button>
      </form>

      <p className="m-0 text-center text-[15px] text-muted">
        ¿Primera vez aquí?{' '}
        <Link href="/signup" className="inline-flex min-h-11 items-center font-extrabold text-brand no-underline hover:underline">
          Crea tu cuenta
        </Link>
      </p>
      <AuthFooter />
    </AuthShell>
  );
}
