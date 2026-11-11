-- ============================================================================
-- seed.sql — datos semilla para el entorno LOCAL únicamente
-- Lo corre `supabase db reset` después de aplicar las migraciones.
--
-- NUNCA contiene datos reales, ni siquiera anonimizados. Todo lleva el prefijo
-- E2E_TEST_ para que el teardown de la suite pueda limpiarlo sin ambigüedad.
-- ============================================================================

-- Nota sobre usuarios: crear filas en auth.users a mano es frágil, porque
-- Supabase Auth espera columnas internas (contraseña cifrada, confirmaciones,
-- identidades) que cambian entre versiones. Los usuarios de prueba se crean
-- con la Admin API desde tests/e2e/utils/supabaseAdmin.ts, que ya existe.
--
-- Este seed solo prepara lo que SÍ es seguro declarar en SQL: el rol admin,
-- asociado por correo al usuario que la suite haya creado.

-- Asigna rol admin al usuario de prueba, si la suite ya lo creó.
-- Idempotente: no falla si el usuario todavía no existe.
insert into public.user_roles (user_id, role)
select u.id, 'admin'
from auth.users u
where u.email = 'e2e_test_admin@gruposcout1.local'
on conflict (user_id) do update set role = 'admin';

-- Verificación rápida tras `supabase db reset`:
--   select u.email, r.role from public.user_roles r
--   join auth.users u on u.id = r.user_id;
