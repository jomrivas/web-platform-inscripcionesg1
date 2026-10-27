// scripts/reset-admin-password.mjs
// Resetea la contraseña de un usuario vía Service Role (solo uso local).
// No contiene secretos: lee las keys de .env.local (gitignoreado).
//
// Uso (PowerShell — las variables no quedan guardadas en ningún archivo):
//   $env:ADMIN_RESET_EMAIL = "admin@correo.com"
//   $env:ADMIN_NEW_PASSWORD = "ClaveTemporal123!"
//   node scripts/reset-admin-password.mjs
//   # (opcional, si además hay que otorgar el rol)
//   $env:MAKE_ADMIN = "1"
//
// Limpieza posterior: cierra la terminal o ejecuta
//   Remove-Item Env:ADMIN_RESET_EMAIL, Env:ADMIN_NEW_PASSWORD, Env:MAKE_ADMIN

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// Parser mínimo de .env.local (sin dependencias)
const envText = fs.readFileSync(path.join(root, '.env.local'), 'utf8');
for (const line of envText.split('\n')) {
  const m = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
  if (m) {
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!(m[1] in process.env)) process.env[m[1]] = v;
  }
}

const email = process.env.ADMIN_RESET_EMAIL?.trim();
const newPassword = process.env.ADMIN_NEW_PASSWORD;
const makeAdmin = process.env.MAKE_ADMIN === '1';

if (!email || !newPassword) {
  console.error(
    'Faltan variables: define ADMIN_RESET_EMAIL y ADMIN_NEW_PASSWORD en el entorno.'
  );
  process.exit(1);
}
if (newPassword.length < 8) {
  console.error('La contraseña debe tener al menos 8 caracteres.');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// 1. Buscar el usuario por email (listado paginado)
let target = null;
let page = 1;
while (!target) {
  const { data, error } = await supabase.auth.admin.listUsers({
    page,
    perPage: 100,
  });
  if (error) throw new Error('listUsers: ' + error.message);
  target = data.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );
  if (target || data.users.length < 100) break;
  page += 1;
}

if (!target) {
  console.error(`No existe ningún usuario Auth con email ${email}.`);
  console.error(
    'Revisa en Supabase Dashboard > Authentication > Users el correo exacto.'
  );
  process.exit(1);
}
console.log(`Usuario encontrado: ${target.email} (id ${target.id})`);

// 2. Actualizar contraseña + confirmar email
const { error: updError } = await supabase.auth.admin.updateUserById(
  target.id,
  { password: newPassword, email_confirm: true }
);
if (updError) throw new Error('updateUserById: ' + updError.message);
console.log('Contraseña actualizada y email confirmado.');

// 3. Revisar / otorgar rol admin
const { data: roleData } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', target.id)
  .single();

if (roleData) {
  console.log(`Rol actual en user_roles: ${roleData.role}`);
  if (roleData.role !== 'admin' && makeAdmin) {
    const { error } = await supabase
      .from('user_roles')
      .update({ role: 'admin' })
      .eq('user_id', target.id);
    if (error) throw new Error('update rol: ' + error.message);
    console.log('Rol actualizado a admin.');
  }
} else if (makeAdmin) {
  const { error } = await supabase
    .from('user_roles')
    .insert([{ user_id: target.id, role: 'admin' }]);
  if (error) throw new Error('insert rol: ' + error.message);
  console.log('Rol admin otorgado.');
} else {
  console.log('Sin fila en user_roles (rol user por defecto).');
}

console.log('Listo. Inicia sesión con el nuevo password y cámbialo luego.');
