// scripts/seed-users.mjs
// Crea los usuarios de prueba del entorno LOCAL (Supabase en Docker).
// `supabase db reset` borra auth.users junto con todo lo demás, y crear filas
// en auth.users por SQL es frágil entre versiones de Supabase Auth, así que
// los usuarios se crean con la Admin API, que es la vía soportada.
//
// Uso:
//   npm run db:reset        (reset + este script)
//   node scripts/seed-users.mjs   (solo los usuarios)
//
// Idempotente: si el usuario existe, le restablece la contraseña y el rol.
// SEGURIDAD: se niega a correr si .env.local no apunta a localhost.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// ── Parser mínimo de .env.local (sin dependencias) ─────────────────────────
const env = {};
for (const line of fs.readFileSync(path.join(root, '.env.local'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('✖ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}

// ── Guardia: nunca contra producción ───────────────────────────────────────
const host = new URL(url).hostname;
if (!['127.0.0.1', 'localhost'].includes(host)) {
  console.error(`✖ .env.local apunta a ${host}, no a la base local.`);
  console.error('  Este script crea usuarios con contraseñas conocidas: solo corre contra Docker.');
  process.exit(1);
}

// ── Usuarios de prueba ─────────────────────────────────────────────────────
// El de rol "user" coincide con tests/e2e/utils/testData.ts, para que la
// suite E2E y el entorno manual usen las mismas credenciales.
const USERS = [
  { email: 'e2e.admin@gruposcout1.test',       password: 'E2eAdmin123!', role: 'admin', nombre: 'E2E_TEST_ Admin' },
  { email: 'e2e.formularios@gruposcout1.test', password: 'E2eTest123!',  role: 'user',  nombre: 'E2E_TEST_ Usuario' },
];

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(email) {
  // listUsers pagina; en local hay pocos usuarios, una página alcanza.
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  return data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

async function ensureUser({ email, password, role, nombre }) {
  let user = await findUserByEmail(email);

  if (user) {
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
      user_metadata: { nombre },
    });
    if (error) throw error;
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nombre },
    });
    if (error) throw error;
    user = data.user;
  }

  const { error: roleError } = await supabase
    .from('user_roles')
    .upsert({ user_id: user.id, role }, { onConflict: 'user_id' });
  if (roleError) throw roleError;

  return user;
}

console.log(`Sembrando usuarios en ${url}\n`);
let fallos = 0;
for (const u of USERS) {
  try {
    await ensureUser(u);
    console.log(`  ✔ ${u.role.padEnd(5)}  ${u.email.padEnd(36)} ${u.password}`);
  } catch (e) {
    fallos++;
    console.error(`  ✖ ${u.email}: ${e.message}`);
  }
}
console.log(fallos ? `\n${fallos} usuario(s) con error.` : '\nListo.');
process.exit(fallos ? 1 : 0);
