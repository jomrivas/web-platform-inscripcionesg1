-- ============================================================================
-- 0000_baseline.sql — Grupo Scout No. 1 "Los Intrépidos"
-- Línea base única y verificable del schema. Spec 002.
--
-- Reemplaza a 0001-0005 (archivadas en _archivo/). Reproduce el schema real de
-- producción extraído el 2026-11-11, con las correcciones marcadas [FIX-n].
-- Cada [FIX-n] está justificado en .sdd/specs/002-baseline-limpio/plan.md
--
-- Idempotente: puede correrse sobre una base vacía o reaplicarse.
-- Postgres 17. Aplicar SIEMPRE por migración, nunca por el editor SQL.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ============================================================================
-- TABLAS
-- ============================================================================

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  role text not null default 'user',
  created_at timestamp without time zone default now(),
  updated_at timestamp without time zone default now(),
  constraint user_roles_role_check check (role in ('user', 'admin'))
);

create table if not exists public.inscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  inscription_year integer not null,
  status text not null default 'draft',
  rejection_reason text,
  submitted_at timestamp without time zone,
  created_at timestamp without time zone default now(),
  updated_at timestamp without time zone default now(),
  constraint inscriptions_type_check check (type in ('adulto', 'beneficiario')),
  -- [FIX-1] 'approved' no existía en produccion, pero la app lo usa:
  -- app/api/inscriptions/[id]/route.ts linea 56 y lib/validators.ts linea 226.
  -- Sin esto, aprobar una inscripcion falla con violacion de check.
  constraint inscriptions_status_check
    check (status in ('draft', 'submitted', 'approved', 'rejected'))
);

-- ── audit_log ───────────────────────────────────────────────────────────────
-- [FIX-2] admin_id pasa a ser NULLABLE. En produccion es NOT NULL, lo que
-- impide registrar cualquier accion hecha con service_role (donde auth.uid()
-- es NULL) — es decir, todas las que hace la app desde sus route handlers.
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users (id),
  action text not null,
  record_type text not null,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  "timestamp" timestamp without time zone default now()
);

create table if not exists public.adult_forms (
  id uuid primary key default gen_random_uuid(),
  inscription_id uuid not null unique references public.inscriptions (id) on delete cascade,
  fecha_ficha date,
  tipo_ficha text,
  rama text,
  responsable character varying(255),
  asistente character varying(255),
  comite_grupo character varying(255),
  cargo character varying(255),
  nombre_completo character varying(255) not null,
  direccion text,
  ciudad character varying(100),
  departamento character varying(100),
  lugar_nacimiento character varying(255),
  fecha_nacimiento date not null,
  dui character varying(20) not null,
  nis character varying(20),
  sexo text,
  telefono_casa character varying(20),
  telefono_oficina character varying(20),
  telefono_celular character varying(20),
  religion character varying(100),
  estado_civil text,
  profesion character varying(100),
  lugar_trabajo text,
  email character varying(255) not null,
  tipo_sangre text,
  grupo_familiar jsonb default '[]'::jsonb,
  aseguradora_nombre character varying(255),
  aseguradora_afiliacion character varying(100),
  seguro_vigencia date,
  seguro_suma_asegurada numeric(10,2),
  seguro_cobertura_internacional boolean default false,
  emergencia_avisar_a character varying(255),
  emergencia_telefono character varying(20),
  medicamentos_permanentes text,
  tratamiento_actual text,
  hipertenso boolean default false,
  diabetico_insulina boolean default false,
  enfermedad_pulmonar_asma boolean default false,
  alergico_a text,
  del_corazon boolean default false,
  convulsion boolean default false,
  discapacidad text,
  emergencia_trasladar_a text,
  regimen_alimenticio_especial text,
  es_propenso_a text,
  ha_padecido_de text,
  operado_ultimo_ano boolean default false,
  operado_que text,
  observaciones_adicionales text,
  grupos_previos jsonb default '[]'::jsonb,
  formacion_scout jsonb default '[]'::jsonb,
  referencias jsonb default '[]'::jsonb,
  foto_reciente boolean default false,
  primeros_auxilios boolean default false,
  fotocopia_dui boolean default false,
  uniforme boolean default false,
  evaluacion_psicologica boolean default false,
  constancia_pnc boolean default false,
  curriculum_vitae boolean default false,
  ficha_medica_ases boolean default false,
  firma_responsable_grupo text,
  firma_tipo_responsable_grupo text,
  firma_presidente_comite text,
  firma_tipo_presidente_comite text,
  firma_dirigente text,
  firma_tipo_dirigente text,
  firma_responsable_rama text,
  firma_tipo_responsable_rama text,
  created_at timestamp without time zone default now(),
  updated_at timestamp without time zone default now(),
  responsable_rama boolean not null default false,
  asistente_rama boolean not null default false,

  constraint adult_forms_sexo_check
    check (sexo in ('masculino', 'femenino')),
  constraint adult_forms_tipo_sangre_check
    check (tipo_sangre in ('O+','O-','A+','A-','B+','B-','AB+','AB-')),
  constraint adult_forms_firma_tipo_responsable_grupo_check
    check (firma_tipo_responsable_grupo in ('image','canvas')),
  constraint adult_forms_firma_tipo_presidente_comite_check
    check (firma_tipo_presidente_comite in ('image','canvas')),
  constraint adult_forms_firma_tipo_dirigente_check
    check (firma_tipo_dirigente in ('image','canvas')),
  constraint adult_forms_firma_tipo_responsable_rama_check
    check (firma_tipo_responsable_rama in ('image','canvas')),

  -- [FIX-3] tipo_ficha. Produccion acepta 'reubicacion','renovacion','aspirante';
  -- el <select> del formulario (FormularioAdulto.tsx:368-371) ofrece
  -- 'nueva','reingreso','actualizacion'. CERO coincidencia: hoy no se puede
  -- guardar una ficha de adulto con tipo de ficha seleccionado.
  constraint adult_forms_tipo_ficha_check
    check (tipo_ficha is null or tipo_ficha in ('nueva','reingreso','actualizacion')),

  -- [FIX-4] estado_civil. El formulario ofrece 'union_libre' y produccion no lo
  -- acepta.
  constraint adult_forms_estado_civil_check
    check (estado_civil is null
           or estado_civil in ('soltero','casado','divorciado','viudo','union_libre'))

  -- [FIX-5] adult_forms_rama_check: ELIMINADO. 'rama' es un <input type="text">
  -- con datalist de sugerencias (FormularioAdulto.tsx:378-386), no un enum.
  -- Produccion lo restringe a 4 valores y rechaza cualquier otro texto.

  -- [FIX-6] adult_forms_emergencia_trasladar_a_check: ELIMINADO. Es un
  -- <input type="text"> libre (FormularioAdulto.tsx:798-803); produccion solo
  -- acepta 'privado','publico','isss' y rechaza cualquier hospital o clinica.
);

create table if not exists public.beneficiary_forms (
  id uuid primary key default gen_random_uuid(),
  inscription_id uuid not null unique references public.inscriptions (id) on delete cascade,
  rama_inscripcion text not null,
  edad integer,
  fecha_llenado_ficha date,
  foto_reciente boolean default false,
  nombre_completo character varying(255) not null,
  dui_numero character varying(20),
  certificado_sfh boolean default false,
  fecha_nacimiento date not null,
  sexo text not null,
  lugar_nacimiento character varying(255),
  direccion text not null,
  ciudad character varying(100),
  departamento character varying(100),
  telefono_casa character varying(20),
  telefono_celular character varying(20),
  email character varying(255),
  religion character varying(100),
  tipo_sangre text,
  vive_con text,
  vive_con_especifique text,
  estado_civil_padres text,
  madre_nombre character varying(255),
  madre_dui character varying(20),
  madre_direccion text,
  madre_ciudad character varying(100),
  madre_departamento character varying(100),
  madre_profesion character varying(100),
  madre_lugar_trabajo character varying(255),
  madre_telefono_casa character varying(20),
  madre_telefono_trabajo character varying(20),
  madre_telefono_celular character varying(20),
  madre_email character varying(255),
  padre_nombre character varying(255),
  padre_documento character varying(20),
  padre_direccion text,
  padre_ciudad character varying(100),
  padre_departamento character varying(100),
  padre_profesion character varying(100),
  padre_lugar_trabajo character varying(255),
  padre_telefono_casa character varying(20),
  padre_telefono_trabajo character varying(20),
  padre_telefono_celular character varying(20),
  padre_email character varying(255),
  emergencia_contacto character varying(255),
  emergencia_telefono character varying(20),
  hermanos jsonb default '[]'::jsonb,
  escuela_nombre character varying(255),
  escuela_direccion text,
  escuela_ciudad character varying(100),
  escuela_departamento character varying(100),
  ano_escolar_actual character varying(50),
  deportes_practica text,
  sabe_nadar boolean default false,
  pasatiempos_habilidades text,
  segundo_idioma character varying(100),
  seguro_aseguradora character varying(255),
  seguro_afiliacion character varying(100),
  seguro_vigencia date,
  seguro_suma_asegurada numeric(10,2),
  seguro_cobertura_internacional boolean default false,
  medico_nombre character varying(255),
  medico_institucion character varying(255),
  clinica_telefono character varying(20),
  problemas_visuales boolean default false,
  usa_lentes boolean default false,
  problemas_oido boolean default false,
  alergias text,
  discapacidad text,
  medicamentos_permanentes text,
  tratamiento_actual text,
  dieta_normal boolean default true,
  zapato_ortopedico_pie_plano boolean default false,
  es_propenso_a text,
  ha_padecido_de text,
  emergencia_trasladar_a text,
  regimen_alimenticio_especial text,
  hospitalizado_6_meses_antes boolean default false,
  observaciones_adicionales text,
  vacunas jsonb default '[]'::jsonb,
  como_se_entero_grupo text,
  recomendado_por character varying(255),
  primera_ambientacion_unidad character varying(100),
  primera_ambientacion_fecha date,
  charla_induccion_fecha date,
  segunda_ambientacion_unidad character varying(100),
  segunda_ambientacion_fecha date,
  platica_responsable_unidad_fecha date,
  tercera_ambientacion_unidad character varying(100),
  tercera_ambientacion_fecha date,
  quiere_quedarse_grupo boolean,
  fecha_pago_inscripcion date,
  fecha_pago_cuota_primer_trimestre date,
  fecha_uniforme_completo date,
  fecha_investidura date,
  firma_padre_tutor text,
  firma_tipo_padre text,
  firma_madre_tutora text,
  firma_tipo_madre text,
  firma_beneficiario text,
  firma_tipo_beneficiario text,
  firma_responsable_grupo text,
  firma_presidente_grupo text,
  firma_responsable_rama text,
  entrega_dui_padre date,
  entrega_dui_madre date,
  vo_bo_tesoreria boolean default false,
  created_at timestamp without time zone default now(),
  updated_at timestamp without time zone default now(),

  constraint beneficiary_forms_rama_inscripcion_check
    check (rama_inscripcion in ('manada_7_10','scouts_11_14','caminantes_15_17','rovers_18_21')),
  constraint beneficiary_forms_sexo_check
    check (sexo in ('masculino','femenino')),
  constraint beneficiary_forms_tipo_sangre_check
    check (tipo_sangre in ('O+','O-','A+','A-','B+','B-','AB+','AB-')),
  constraint beneficiary_forms_vive_con_check
    check (vive_con is null or vive_con in ('ambos_padres','madre','padre','otros')),
  constraint beneficiary_forms_estado_civil_padres_check
    check (estado_civil_padres is null
           or estado_civil_padres in ('casados','divorciados','viudos','separados','union_libre')),
  constraint beneficiary_forms_firma_tipo_padre_check
    check (firma_tipo_padre in ('image','canvas')),
  constraint beneficiary_forms_firma_tipo_madre_check
    check (firma_tipo_madre in ('image','canvas')),
  constraint beneficiary_forms_firma_tipo_beneficiario_check
    check (firma_tipo_beneficiario in ('image','canvas'))

  -- [FIX-7] beneficiary_forms_emergencia_trasladar_a_check: ELIMINADO, por la
  -- misma razon que [FIX-6].
);

-- ── UNIQUE de adult_forms.dui ───────────────────────────────────────────────
-- [PENDIENTE-1] Se reproduce el UNIQUE global de produccion, pero es un
-- problema de modelo sin resolver: inscriptions.inscription_year implica
-- reinscripcion anual, y un UNIQUE global sobre dui impide que un mismo
-- voluntario se reinscriba al año siguiente — el segundo intento falla.
-- La correccion natural seria unicidad por (dui, año), pero el año vive en
-- inscriptions y un indice no puede consultar otra tabla, asi que exige un
-- cambio de modelo (columna denormalizada o constraint con trigger). Eso es
-- rediseño y queda fuera de esta spec por R1. Ver spec 004.
alter table public.adult_forms drop constraint if exists adult_forms_dui_key;
alter table public.adult_forms add constraint adult_forms_dui_key unique (dui);

-- ============================================================================
-- ÍNDICES
-- ============================================================================

create index if not exists idx_inscriptions_user_year      on public.inscriptions (user_id, inscription_year);
create index if not exists idx_inscriptions_type_year      on public.inscriptions (type, inscription_year);
create index if not exists idx_inscriptions_status         on public.inscriptions (status);
create index if not exists idx_adult_forms_inscription     on public.adult_forms (inscription_id);
create index if not exists idx_adult_forms_dui             on public.adult_forms (dui);
create index if not exists idx_beneficiary_forms_inscription on public.beneficiary_forms (inscription_id);
create index if not exists idx_beneficiary_forms_dui       on public.beneficiary_forms (dui_numero);
create index if not exists idx_beneficiary_forms_rama      on public.beneficiary_forms (rama_inscripcion);
create index if not exists idx_audit_log_admin             on public.audit_log (admin_id);
create index if not exists idx_audit_log_timestamp         on public.audit_log ("timestamp");

-- ============================================================================
-- FUNCIONES
-- [FIX-9] Ambas pasan a security definer con search_path fijo. En produccion
-- son security invoker con search_path mutable (advertencia del linter de
-- Supabase). Un trigger de auditoria debe poder escribir siempre, sin depender
-- de los permisos del llamante.
-- ============================================================================

create or replace function public.update_timestamp()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- [FIX-10] Se elimina el guard "IF admin_id IS NOT NULL THEN".
-- En produccion ese IF hace que NO se registre nada cuando la accion viene de
-- un route handler con service_role, donde auth.uid() es NULL — es decir,
-- siempre. Por eso audit_log esta vacio con una inscripcion submitted.
-- Ahora registra siempre; admin_id queda NULL si no hay usuario autenticado,
-- lo que distingue una accion del sistema de una de un admin. Incumplia C6.
create or replace function public.audit_inscription_changes()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.audit_log (admin_id, action, record_type, record_id, old_values, new_values)
  values (
    auth.uid(),
    tg_op,
    tg_table_name,
    coalesce(new.id, old.id),
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) else null end
  );
  return coalesce(new, old);
end;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

drop trigger if exists inscriptions_audit on public.inscriptions;
create trigger inscriptions_audit
  after insert or update or delete on public.inscriptions
  for each row execute function public.audit_inscription_changes();

drop trigger if exists update_inscriptions_timestamp on public.inscriptions;
create trigger update_inscriptions_timestamp
  before update on public.inscriptions
  for each row execute function public.update_timestamp();

drop trigger if exists update_adult_forms_timestamp on public.adult_forms;
create trigger update_adult_forms_timestamp
  before update on public.adult_forms
  for each row execute function public.update_timestamp();

drop trigger if exists update_beneficiary_forms_timestamp on public.beneficiary_forms;
create trigger update_beneficiary_forms_timestamp
  before update on public.beneficiary_forms
  for each row execute function public.update_timestamp();

-- ============================================================================
-- VISTA
-- ============================================================================

create or replace view public.inscriptions_summary
with (security_invoker = true) as
select
  i.id, i.user_id, i.type, i.inscription_year, i.status,
  i.rejection_reason, i.submitted_at, i.created_at,
  case i.type when 'adulto' then af.nombre_completo
              when 'beneficiario' then bf.nombre_completo end as nombre,
  case i.type when 'adulto' then af.dui
              when 'beneficiario' then bf.dui_numero end as identificacion,
  case i.type when 'adulto' then af.email
              when 'beneficiario' then coalesce(bf.madre_email, bf.padre_email) end as email_contacto,
  case i.type when 'adulto' then af.telefono_celular
              when 'beneficiario' then coalesce(bf.madre_telefono_celular, bf.padre_telefono_celular) end as telefono_contacto
from public.inscriptions i
left join public.adult_forms af on i.id = af.inscription_id
left join public.beneficiary_forms bf on i.id = bf.inscription_id;

-- ============================================================================
-- RLS
-- ============================================================================

alter table public.user_roles         enable row level security;
alter table public.inscriptions       enable row level security;
alter table public.adult_forms        enable row level security;
alter table public.beneficiary_forms  enable row level security;
alter table public.audit_log          enable row level security;

-- ── user_roles ──────────────────────────────────────────────────────────────
-- [FIX-11] LA CORRECCION MAS IMPORTANTE DE ESTE BASELINE.
-- En produccion user_roles tiene RLS activo y CERO politicas. Como todas las
-- demas politicas comprueban el rol con
--   (select role from user_roles where user_id = auth.uid()) = 'admin'
-- y esa subconsulta no devuelve nada sin politica de lectura, NINGUN admin es
-- reconocido jamas a nivel de base de datos. Toda la autorizacion quedaba
-- apoyada solo en la capa de aplicacion. Incumplia C2 y C3.
drop policy if exists users_read_own_role on public.user_roles;
create policy users_read_own_role on public.user_roles
  for select using (auth.uid() = user_id);
-- La escritura de roles sigue siendo exclusiva de service_role: no se crea
-- politica de insert/update/delete a proposito.

-- ── inscriptions ────────────────────────────────────────────────────────────
drop policy if exists users_see_own_inscriptions on public.inscriptions;
create policy users_see_own_inscriptions on public.inscriptions
  for select using (
    auth.uid() = user_id
    or (select r.role from public.user_roles r where r.user_id = auth.uid()) = 'admin'
  );

drop policy if exists users_create_own_inscriptions on public.inscriptions;
create policy users_create_own_inscriptions on public.inscriptions
  for insert with check (auth.uid() = user_id);

drop policy if exists users_update_own_inscriptions on public.inscriptions;
create policy users_update_own_inscriptions on public.inscriptions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- [FIX-12] Falta en produccion: sin esto un admin no puede cambiar el estado
-- de una inscripcion a nivel de base, solo via service_role. El panel de
-- aprobar/rechazar depende de esto para tener segunda capa (C3).
drop policy if exists admins_update_inscriptions on public.inscriptions;
create policy admins_update_inscriptions on public.inscriptions
  for update using (
    (select r.role from public.user_roles r where r.user_id = auth.uid()) = 'admin'
  ) with check (
    (select r.role from public.user_roles r where r.user_id = auth.uid()) = 'admin'
  );

drop policy if exists admins_delete_inscriptions on public.inscriptions;
create policy admins_delete_inscriptions on public.inscriptions
  for delete using (
    (select r.role from public.user_roles r where r.user_id = auth.uid()) = 'admin'
  );

-- ── adult_forms ─────────────────────────────────────────────────────────────
drop policy if exists users_see_own_adult_forms on public.adult_forms;
create policy users_see_own_adult_forms on public.adult_forms
  for select using (
    inscription_id in (
      select i.id from public.inscriptions i
      where i.user_id = auth.uid()
         or (select r.role from public.user_roles r where r.user_id = auth.uid()) = 'admin'
    )
  );

drop policy if exists users_create_own_adult_forms on public.adult_forms;
create policy users_create_own_adult_forms on public.adult_forms
  for insert with check (
    inscription_id in (select i.id from public.inscriptions i where i.user_id = auth.uid())
  );

drop policy if exists users_update_own_adult_forms on public.adult_forms;
create policy users_update_own_adult_forms on public.adult_forms
  for update using (
    inscription_id in (select i.id from public.inscriptions i where i.user_id = auth.uid())
  );

-- ── beneficiary_forms ───────────────────────────────────────────────────────
drop policy if exists users_see_own_beneficiary_forms on public.beneficiary_forms;
create policy users_see_own_beneficiary_forms on public.beneficiary_forms
  for select using (
    inscription_id in (
      select i.id from public.inscriptions i
      where i.user_id = auth.uid()
         or (select r.role from public.user_roles r where r.user_id = auth.uid()) = 'admin'
    )
  );

drop policy if exists users_create_own_beneficiary_forms on public.beneficiary_forms;
create policy users_create_own_beneficiary_forms on public.beneficiary_forms
  for insert with check (
    inscription_id in (select i.id from public.inscriptions i where i.user_id = auth.uid())
  );

drop policy if exists users_update_own_beneficiary_forms on public.beneficiary_forms;
create policy users_update_own_beneficiary_forms on public.beneficiary_forms
  for update using (
    inscription_id in (select i.id from public.inscriptions i where i.user_id = auth.uid())
  );

-- ── audit_log ───────────────────────────────────────────────────────────────
drop policy if exists admins_see_audit_log on public.audit_log;
create policy admins_see_audit_log on public.audit_log
  for select using (
    (select r.role from public.user_roles r where r.user_id = auth.uid()) = 'admin'
  );

drop policy if exists system_create_audit_log on public.audit_log;
create policy system_create_audit_log on public.audit_log
  for insert with check (true);

-- ============================================================================
-- Alta del primer admin (manual, con el UUID del usuario):
--   insert into public.user_roles (user_id, role) values ('<UUID>', 'admin')
--     on conflict (user_id) do update set role = 'admin';
-- ============================================================================
