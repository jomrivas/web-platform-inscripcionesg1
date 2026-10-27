// tests/e2e/utils/supabaseAdmin.ts
// Cliente Supabase con service_role para crear/limpiar datos de prueba.

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import './env';
import { E2E_PREFIX, TEST_USER } from './testData';

export function adminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno'
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function findUserByEmail(
  supabase: SupabaseClient,
  email: string
) {
  const perPage = 100;
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const found = data.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );
    if (found) return found;
    if (data.users.length < perPage) return null;
  }
  return null;
}

export async function ensureTestUser(
  supabase: SupabaseClient,
  email: string,
  password: string
): Promise<string> {
  const existing = await findUserByEmail(supabase, email);
  if (existing) {
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
    });
    if (error) throw error;
    return existing.id;
  }
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  return data.user!.id;
}

export async function deleteTestUser(
  supabase: SupabaseClient,
  email: string
): Promise<void> {
  const user = await findUserByEmail(supabase, email);
  if (!user) return;
  // Borra inscripciones del usuario (las fichas caen por ON DELETE CASCADE)
  await supabase.from('inscriptions').delete().eq('user_id', user.id);
  await supabase.auth.admin.deleteUser(user.id);
}

// Detecta si la migración 0004 (constraints de adult_forms) ya fue aplicada:
// intenta insertar una ficha con los valores extendidos (tipo_ficha/rama/
// estado_civil/emergencia_trasladar_a). Devuelve false si la base aún los
// rechaza por CHECK constraint.
export async function adultConstraintsAllowExtended(): Promise<boolean> {
  const supabase = adminClient();
  const user = await findUserByEmail(supabase, TEST_USER.email);
  if (!user) return false;

  const { data: ins, error: insError } = await supabase
    .from('inscriptions')
    .insert({
      user_id: user.id,
      type: 'adulto',
      inscription_year: new Date().getFullYear(),
      status: 'submitted',
    })
    .select()
    .single();
  if (insError || !ins) return false;

  const { error } = await supabase.from('adult_forms').insert({
    inscription_id: ins.id,
    nombre_completo: `${E2E_PREFIX}probe`,
    dui: '00000000-0',
    email: 'probe@probe.test',
    fecha_nacimiento: '1990-01-01',
    telefono_celular: '0000-0000',
    tipo_ficha: 'nueva',
    rama: 'Manada',
    estado_civil: 'soltero',
    emergencia_trasladar_a: 'Hospital Nacional',
  });

  await supabase.from('inscriptions').delete().eq('id', ins.id);
  return !error;
}
