-- 0001_schema.sql — línea base Grupo Scout No. 1 "Los Intrépidos"
-- Aplica en Supabase Dashboard > SQL Editor o con Supabase CLI.
-- Incluye: tablas, RLS, vista SECURITY INVOKER, trigger audit_log.

-- Extensión para gen_random_uuid()
create extension if not exists "pgcrypto";

-- ── user_roles: fuente de verdad para autorización ──────────────────────────
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- ── inscriptions: registro central ──────────────────────────────────────────
create table if not exists public.inscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  type text not null check (type in ('adulto', 'beneficiario')),
  inscription_year int not null,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'rejected')),
  rejection_reason text,
  submitted_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_inscriptions_user on public.inscriptions (user_id);
create index if not exists idx_inscriptions_year on public.inscriptions (inscription_year);
create index if not exists idx_inscriptions_status on public.inscriptions (status);

-- ── adult_forms (1:1 con inscriptions) ──────────────────────────────────────
create table if not exists public.adult_forms (
  id uuid primary key default gen_random_uuid(),
  inscription_id uuid not null unique references public.inscriptions (id) on delete cascade,
  fecha_ficha text,
  tipo_ficha text,
  rama text,
  responsable text,
  asistente text,
  comite_grupo text,
  cargo text,
  nombre_completo text not null,
  direccion text,
  ciudad text,
  departamento text,
  lugar_nacimiento text,
  fecha_nacimiento text not null,
  dui text not null,
  nis text,
  sexo text,
  telefono_casa text,
  telefono_oficina text,
  telefono_celular text not null,
  religion text,
  estado_civil text,
  profesion text,
  lugar_trabajo text,
  email text not null,
  tipo_sangre text,
  aseguradora_nombre text,
  seguro_vigencia text,
  seguro_suma_asegurada text,
  medicamentos_permanentes text,
  hipertenso boolean default false,
  diabetico_insulina boolean default false,
  alergico_a text,
  discapacidad text,
  observaciones_adicionales text,
  firma_responsable_grupo text,
  firma_tipo_responsable_grupo text,
  created_at timestamptz not null default now()
);

-- ── beneficiary_forms (1:1 con inscriptions) ────────────────────────────────
create table if not exists public.beneficiary_forms (
  id uuid primary key default gen_random_uuid(),
  inscription_id uuid not null unique references public.inscriptions (id) on delete cascade,
  rama_inscripcion text not null,
  fecha_llenado_ficha text,
  nombre_completo text not null,
  dui_numero text,
  fecha_nacimiento text not null,
  sexo text,
  lugar_nacimiento text,
  direccion text not null,
  ciudad text,
  departamento text,
  telefono_casa text,
  telefono_celular text,
  email text,
  religion text,
  tipo_sangre text,
  vive_con text,
  madre_nombre text,
  madre_dui text,
  madre_telefono_celular text,
  madre_email text,
  padre_nombre text,
  padre_documento text,
  padre_telefono_celular text,
  padre_email text,
  emergencia_contacto text,
  emergencia_telefono text,
  escuela_nombre text,
  ano_escolar_actual text,
  sabe_nadar boolean default false,
  alergias text,
  medicamentos_permanentes text,
  discapacidad text,
  observaciones_adicionales text,
  firma_padre_tutor text,
  firma_tipo_padre text,
  firma_madre_tutora text,
  firma_tipo_madre text,
  created_at timestamptz not null default now()
);

-- ── audit_log: cambios administrativos (trigger en inscriptions) ────────────
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  inscription_id uuid,
  admin_id uuid,
  action text not null,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.log_inscription_change()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.audit_log (inscription_id, action, old_values, new_values)
  values (
    coalesce(new.id, old.id),
    tg_op,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_inscriptions_audit on public.inscriptions;
create trigger trg_inscriptions_audit
  after insert or update or delete on public.inscriptions
  for each row execute function public.log_inscription_change();

-- ── Vista resumen (respeta RLS del consultante) ─────────────────────────────
create or replace view public.inscriptions_summary
with (security_invoker = true) as
select
  i.id,
  i.user_id,
  i.type,
  i.inscription_year,
  i.status,
  i.rejection_reason,
  i.submitted_at,
  i.created_at,
  coalesce(a.nombre_completo, b.nombre_completo) as nombre,
  coalesce(a.nombre_completo, b.nombre_completo) as nombre_completo,
  coalesce(a.dui, b.dui_numero) as identificacion,
  coalesce(a.dui, b.dui_numero) as dui,
  coalesce(a.email, b.email, b.madre_email, b.padre_email) as email_contacto,
  coalesce(a.email, b.email, b.madre_email, b.padre_email) as email
from public.inscriptions i
left join public.adult_forms a on a.inscription_id = i.id
left join public.beneficiary_forms b on b.inscription_id = i.id;

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.user_roles enable row level security;
alter table public.inscriptions enable row level security;
alter table public.adult_forms enable row level security;
alter table public.beneficiary_forms enable row level security;
alter table public.audit_log enable row level security;

-- user_roles: cada usuario lee su propio rol; escritura solo service_role
drop policy if exists "users_read_own_role" on public.user_roles;
create policy "users_read_own_role" on public.user_roles
  for select using (auth.uid() = user_id);

-- inscriptions: dueño ve/edita las suyas; admin ve todo (vía service_role o política)
drop policy if exists "users_own_inscriptions" on public.inscriptions;
create policy "users_own_inscriptions" on public.inscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "admins_all_inscriptions" on public.inscriptions;
create policy "admins_all_inscriptions" on public.inscriptions
  for all using (
    exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = 'admin')
  ) with check (
    exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = 'admin')
  );

-- Formularios: acceso vía dueño de la inscripción o admin
drop policy if exists "users_own_adult_forms" on public.adult_forms;
create policy "users_own_adult_forms" on public.adult_forms
  for all using (
    exists (select 1 from public.inscriptions i where i.id = inscription_id and i.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.inscriptions i where i.id = inscription_id and i.user_id = auth.uid())
  );

drop policy if exists "admins_all_adult_forms" on public.adult_forms;
create policy "admins_all_adult_forms" on public.adult_forms
  for all using (
    exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = 'admin')
  ) with check (
    exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = 'admin')
  );

drop policy if exists "users_own_beneficiary_forms" on public.beneficiary_forms;
create policy "users_own_beneficiary_forms" on public.beneficiary_forms
  for all using (
    exists (select 1 from public.inscriptions i where i.id = inscription_id and i.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.inscriptions i where i.id = inscription_id and i.user_id = auth.uid())
  );

drop policy if exists "admins_all_beneficiary_forms" on public.beneficiary_forms;
create policy "admins_all_beneficiary_forms" on public.beneficiary_forms
  for all using (
    exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = 'admin')
  ) with check (
    exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = 'admin')
  );

-- audit_log: solo lectura admin (escritura vía trigger service_role)
drop policy if exists "admins_read_audit" on public.audit_log;
create policy "admins_read_audit" on public.audit_log
  for select using (
    exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = 'admin')
  );

-- ── Alta manual de admin (ejecutar con el UUID del usuario) ─────────────────
-- insert into public.user_roles (user_id, role) values ('<USER_UUID>', 'admin')
--   on conflict (user_id) do update set role = 'admin';
