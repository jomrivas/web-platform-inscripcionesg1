---
name: web-platform-inscripciones
description: Plataforma web de inscripciones del Grupo Scout No. 1 "Los Intrépidos" (Next.js + Supabase + Vercel) — fichas digitales de Adulto Voluntario y Beneficiario con firma digital, panel administrativo con filtros y exportación, y autenticación por roles.
version: 1.0.0
author: Mauricio Rivas
repository: https://github.com/jomrivas/web-platform-inscripcionesg1
deployment: https://web-platform-inscripcionesg1.vercel.app/
stack: [nextjs, supabase, vercel, typescript, tailwindcss, resend]
status: en desarrollo activo
---

# Skill: Sistema de Inscripciones — Grupo Scout No. 1 "Los Intrépidos"

## 1. Propósito

Digitalizar el proceso de afiliación anual del **Grupo Scout No. 1 "Los
Intrépidos"**, reemplazando las fichas físicas en papel por un flujo web
que permite a familias y voluntarios registrarse, completar su ficha con
firma digital y darle seguimiento al estado de su inscripción, mientras el
equipo administrativo gestiona, filtra y exporta los registros.

### Alcance aclarado

- El sistema cubre **las cuatro ramas del grupo**: Manada (7-10 años),
  Scouts (11-14 años), Caminantes (15-17 años) y **Clan Maya/Rovers**
  (18-21 años con 364 días) — más los **adultos voluntarios** (dirigentes, comité,
  responsables).
- El **Clan Maya** es específicamente la rama Rover, no el nombre del
  proyecto. El nombre oficial en toda la UI, emails y metadata es
  **"Grupo Scout No. 1 'Los Intrépidos'"**.
- El landing page del Clan Maya es un **proyecto aparte**, sin relación
  técnica con esta plataforma.

### Restricción de negocio clave

- Uso estacional: período de inscripción **ordinario marzo-abril** (pico de
  tráfico), uso esporádico el resto del año.
- Volumen estimado: **80-95 usuarios/año** (admins + adultos +
  beneficiarios).
- Mínimo **2 administradores** para control y mantenimiento.
- **Presupuesto: $0** — toda la arquitectura se diseñó sobre free tier.

---

## 2. Arquitectura técnica

```
┌─────────────────────────────────────────┐
│          VERCEL (Hosting)               │
│  Next.js 14+ App Router                 │
│  ├─ (auth): /login, /signup             │
│  ├─ (dashboard): /dashboard/*           │
│  ├─ (admin): /admin/*                   │
│  └─ api/: Route Handlers                │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│   SUPABASE (PostgreSQL + Auth + Storage)│
│  inscriptions · adult_forms ·            │
│  beneficiary_forms · user_roles ·        │
│  audit_log · vista inscriptions_summary  │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│   RESEND (Email transaccional)          │
│  Confirmación de inscripción            │
└─────────────────────────────────────────┘
```

### Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js (App Router) + React + TypeScript + Tailwind CSS |
| Backend | Next.js API Routes (Route Handlers) |
| Base de datos | PostgreSQL vía Supabase |
| Autenticación | Supabase Auth (JWT, cookies vía `@supabase/ssr`) |
| Autorización | Row-Level Security (RLS) + tabla `user_roles` |
| Email | Resend (confirmaciones de inscripción) |
| Hosting | Vercel |
| Firma digital | HTML5 Canvas (dibujo a mano) o carga de imagen |
| Costo operativo | $0/año (free tier en los 3 servicios) |

### Costos estimados (free tier)

| Servicio | Límite | Uso real estimado |
|---|---|---|
| Supabase DB | 500 MB + 1 GB storage | ~120 MB (datos + firmas) |
| Vercel | 100 GB bandwidth | ~10 GB |
| Resend | 100 emails/mes | ~95 (concentrados en mar-abr) |

---

## 3. Modelo de datos

### Tablas principales

- **`user_roles`** — vincula `user_id` (Supabase Auth) a `role`
  (`'user' | 'admin'`). Es la fuente de verdad para autorización.
- **`inscriptions`** — registro central: `user_id`, `type`
  (`'adulto' | 'beneficiario'`), `inscription_year`, `status`
  (`'draft' | 'submitted' | 'rejected'`), `rejection_reason`,
  `submitted_at`.
- **`adult_forms`** — ficha de Adulto Voluntario (1:1 con `inscriptions`
  vía `inscription_id`). ~50 columnas: datos personales, grupo familiar
  (JSONB), seguro médico, consideraciones médicas, historial scout,
  formación, referencias, checklist de documentos, 4 firmas (Responsable
  de Grupo, Presidente de Comité, Dirigente, Responsable de Rama).
- **`beneficiary_forms`** — ficha de Beneficiario (1:1 con
  `inscriptions`). ~70 columnas: rama de inscripción, datos personales,
  datos de madre/tutora y padre/tutor, hermanos (JSONB), escolaridad,
  seguro médico, datos médicos generales, vacunas (JSONB), proceso de
  inducción (nuevos ingresos), 3 firmas (Padre, Madre, Beneficiario).
- **`audit_log`** — registro de cambios administrativos (trigger
  automático en `inscriptions`): `admin_id`, `action`, `old_values`,
  `new_values`, `timestamp`.

### Vista

- **`inscriptions_summary`** — join de `inscriptions` con `adult_forms`/
  `beneficiary_forms` para listar nombre, identificación y contacto sin
  importar el tipo. Creada con `SECURITY INVOKER` (respeta RLS del usuario
  que consulta, no del creador de la vista).

### Seguridad a nivel de base de datos

- RLS habilitado en todas las tablas.
- Un usuario regular solo ve/edita sus propias filas (`auth.uid() =
  user_id`).
- Un admin (verificado vía `user_roles`) ve todo.
- Cascada: borrar una `inscription` elimina automáticamente su
  `adult_form`/`beneficiary_form` asociado (`ON DELETE CASCADE`).

---

## 4. Roles y autenticación

| Rol | Cómo se asigna | Acceso |
|---|---|---|
| **user** (default) | Automático al hacer signup | `/dashboard/*` únicamente |
| **admin** | Insert manual en `user_roles` (`role='admin'`) | `/dashboard/*` + `/admin/*` |

### Proxy (`proxy.ts`)

Se ejecuta en cada request y resuelve 3 reglas:

1. Sin sesión + ruta no pública (`/`, `/login`, `/signup`) → redirige a
   `/login`.
2. Con sesión + intenta ir a `/login` o `/signup` → redirige a
   `/dashboard`.
3. Con sesión + ruta `/admin/*` + rol ≠ `admin` → redirige a `/dashboard`.

El layout de `/admin` repite esta verificación server-side como segunda
capa de defensa.

---

## 5. Flujos funcionales

### 5.1 Flujo de usuario regular

```
Landing (/) 
  → Signup (/signup) → confirmación por correo (Supabase Auth)
  → Login (/login) 
  → Dashboard (/dashboard): selector "Nuevo Formulario" | "Mis Inscripciones"
  
  Nuevo Formulario (/dashboard/nuevo-formulario)
    → selecciona Adulto o Beneficiario
    → llena ficha por pestañas (Datos Personales, Médicos, Firma, etc.)
    → firma digital (dibujar en canvas o subir imagen)
    → Enviar
      → POST /api/inscriptions
        → crea fila en `inscriptions` (status: submitted)
        → crea fila en `adult_forms` o `beneficiary_forms`
        → envía email de confirmación (Resend)
      → redirige a /dashboard/mis-inscripciones?success=true
  
  Mis Inscripciones (/dashboard/mis-inscripciones)
    → tabla: Tipo, Año, Estado, Fecha (ordenada por más reciente)
```

### 5.2 Flujo de administrador

```
Login → Dashboard → link "Panel Admin" (solo visible si role=admin)

Admin Dashboard (/admin)
  → KPIs del año actual: Total, Adultos, Beneficiarios, Pendientes

Listados (/admin/listados)
  → filtros: Año, Tipo (Adulto/Beneficiario), Estado
  → búsqueda por nombre/DUI/email
  → exportación: CSV, Excel, PDF, SQL (backup)
    → GET /api/export?format=X&year=Y&type=Z&status=W
      (requiere Authorization: Bearer <token>, valida sesión activa)
```

### 5.3 Validaciones de negocio por formulario

**Adulto Voluntario** — campos requeridos: nombre completo, DUI (formato
`XXXXXXXX-X`), email válido, fecha de nacimiento, teléfono celular.

**Beneficiario** — campos requeridos: nombre completo, fecha de
nacimiento, dirección, **y al menos un tutor** (nombre de madre o padre).
Cada tutor registrado lleva **su correo, obligatorio y válido** (spec 005,
R9): si hay madre, su correo; si hay padre, el suyo. Validado en
`lib/validators.ts` y reflejado en el formulario.

---

## 6. Estructura de archivos (App Router)

```
app/
├── page.tsx                              Portada pública (pantalla partida)
├── layout.tsx                            Layout raíz: Nunito (next/font) + metadata
├── globals.css                           Tokens de diseño (@theme) y estilos base
├── icon.png · apple-icon.png · favicon.ico   Íconos desde el isotipo
├── login/page.tsx                        Ingreso (AuthShell)
├── signup/page.tsx                       Registro (AuthShell)
├── dashboard/
│   ├── layout.tsx                        Sesión + FamilyFrame (encabezado, navegación)
│   ├── page.tsx                          Inicio: nueva inscripción + tus inscripciones
│   ├── nuevo-formulario/
│   │   ├── page.tsx · TipoSelector.tsx   ¿Quién se inscribe? (beneficiario / adulto)
│   │   ├── adulto/page.tsx               Ficha por pasos + errores del servidor
│   │   └── beneficiario/page.tsx
│   └── mis-inscripciones/page.tsx        Lista + confirmación de envío (?success=true)
├── admin/
│   ├── layout.tsx                        Rol admin + AdminSidebar
│   ├── page.tsx                          Resumen con KPIs
│   ├── listados/page.tsx                 Tabla filtrable, acciones y exportación
│   └── inscripciones/[id]/page.tsx       Revisión: estado, motivo y ficha editable
└── api/
    ├── inscriptions/route.ts             POST — crear inscripción + email
    ├── inscriptions/[id]/route.ts        PATCH estado · PUT ficha (admin)
    └── export/route.ts                   GET — exportar CSV/Excel/PDF/SQL

src/components/
├── ui/                                   Componentes base (spec 005): Button,
│                                         Field/Input/Select/Textarea, Chips
│                                         (estado y rama), Stepper, Card,
│                                         BrandLogo, BottomNav, AdminSidebar
├── ficha/FichaShell.tsx                  Armazón de fichas por pasos (familia/admin)
├── familia/                              AuthShell, FamilyFrame, InscripcionesList,
│                                         textos.ts (textos fijos del producto)
├── FormularioAdulto.tsx                  Ficha de Adulto Voluntario (7 pasos)
├── FormularioBeneficiario.tsx            Ficha de Beneficiario (5 pasos)
├── EditorInscripcion.tsx                 Revisión admin
├── SignaturePad.tsx                      Firma (dibujar o subir imagen)
└── LogoutButton.tsx

lib/
├── supabase.ts                           Cliente Supabase (browser)
├── supabase-server.ts                    Cliente Supabase (server components)
├── validators.ts                         Validación Zod server-side (C5)
└── ramas.ts                              Etiquetas visibles de rama (R5)

public/brand/                             Logo, isotipo y stickers (SVG y PNG)
proxy.ts                                  Protección de rutas + refresco de sesión
```

---

## 7. Decisiones de diseño relevantes

- **`@supabase/ssr`** en vez de solo `@supabase/supabase-js`: necesario
  para manejar cookies de sesión correctamente en Server Components y
  Route Handlers del App Router.
- **Etiquetas asociadas con `htmlFor`/`id`** (spec 005): cada `<label>` está
  ligado a su control, y el `id` sale del `name`. El `name` sigue siendo
  1:1 con la columna de la base y el selector estable de las pruebas (C8);
  nunca se renombra.
- **Identidad visual** (decisión 0004): azul de la pañoleta `#0E1754`,
  blanco y Nunito; colores de rama solo como punto + tinte, nunca como
  color de texto. Todo color, radio y sombra vive en `app/globals.css`
  (`@theme`); los componentes usan las clases que genera Tailwind. Los
  estilos base van en `@layer base` para que las utilidades los puedan
  sobrescribir. Única excepción: el HTML del correo de confirmación, que
  necesita colores en línea.
- **Fichas por pasos, no pestañas**: cada pestaña anterior es un paso, en el
  mismo orden. El indicador de pasos es clicable y cada paso conserva el
  nombre exacto de la pestaña (`Datos Personales`, `Firmas`…): las pruebas
  navegan por esos nombres. "Siguiente" valida el paso actual (E1); el
  envío valida todo y los errores del servidor abren el paso del campo
  (E3). Sin `required` nativo: la validación la hacen la app y el servidor.
- **Mis inscripciones en tarjetas con semántica de tabla** (`role=table/row/
  cell`): en móvil se ven como tarjetas, pero se leen como tabla.
- **Sin "guardar borrador"**: la ficha se llena, firma y envía en una sola
  sesión (decisión de Mauricio, spec 005 §4).
- **Desarrollo desde el teléfono**: `allowedDevOrigins` en `next.config.ts`
  (solo afecta `next dev`). Para probar en la red local, arrancar con
  `NEXT_PUBLIC_SUPABASE_URL=http://<IP-de-la-laptop>:55321`. Ingreso y
  registro llevan `method="post"`: si el JavaScript no carga, las
  credenciales no viajan en la URL.
- **Vista con `SECURITY INVOKER`**: corregido explícitamente porque
  Supabase marca `SECURITY DEFINER` (default de Postgres) como riesgo de
  seguridad — con `INVOKER`, la vista respeta el RLS del usuario que
  consulta, no del creador.
- **Email transaccional server-side**: el envío de confirmación ocurre en
  el Route Handler (`app/api/inscriptions/route.ts`), no en el cliente —
  implica que no se puede interceptar/mockear desde pruebas E2E basadas en
  navegador sin modificar el código de la app.

---

## 8. Testing

Suite E2E con **Playwright + Page Object Model** (preferencia estándar del
autor para proyectos de automatización).

- `tests/e2e/pages/` — Page Objects por pantalla/flujo.
- `tests/e2e/specs/{public,user,admin}/` — specs organizados por nivel de
  autenticación requerido (usa `storageState` pre-generado para evitar
  loguearse en cada test).
- `tests/e2e/global-setup.ts` / `global-teardown.ts` — crea usuarios y
  datos semilla vía Supabase Admin API antes de correr, limpia todo dato
  prefijado `E2E_TEST_` al finalizar.
- Cobertura actual: proxy/redirecciones, login/signup, ambos
  formularios (validaciones + firma + envío), Mis Inscripciones, panel
  admin (KPIs, filtros, búsqueda, exportación CSV/SQL).
- Correo obligatorio por tutor (spec 005, A13):
  `specs/user/correo-tutor.spec.ts`, en cliente y directo contra la API.
- Pendiente de cobertura: acciones de aceptar/rechazar inscripción (no
  implementadas aún en la UI), exportación Excel/PDF, edición de
  inscripciones en estado `draft`.

**Recomendación activa sin resolver**: correr la suite contra un proyecto
Supabase separado dedicado a pruebas (free tier adicional, $0) para evitar
tocar datos reales o consumir cuota de Resend de producción.

---

## 9. Estado actual y pendientes conocidos

### Resuelto
- Schema SQL corregido (sintaxis MySQL `INDEX` → `CREATE INDEX` separado).
- Vista `inscriptions_summary` corregida a `SECURITY INVOKER`.
- Nombre del proyecto corregido de "Clan Maya G1" a "Grupo Scout No. 1
  'Los Intrépidos'" en toda la UI, emails y metadata.
- Páginas faltantes de `/dashboard` (layout + page raíz) tras una
  reorganización de carpetas que rompió la ruta post-login.
- Suite de pruebas E2E inicial entregada.

### Pendiente / no implementado todavía
- Acción de aceptar/rechazar inscripción desde el panel admin (el estado
  `rejected` y `rejection_reason` existen en el schema, pero no hay UI que
  los escriba).
- Edición de una inscripción en estado `draft`.
- Subida de foto reciente (campo booleano existe, sin UI de carga real).
- Gestión de administradores adicionales desde la UI (alta se hace
  manualmente vía SQL).
- Exportación en formato Excel real (actualmente CSV con `Content-Type`
  de Excel) y PDF real (actualmente HTML imprimible).
- Confirmación/recuperación de contraseña personalizada.
- Remitente de email en Resend: pendiente de definir dominio verificado
  definitivo (placeholder actual: `inscripciones@gruposcout1.sv`).

---

## 10. Contexto de desarrollo

- Desarrollado por Mauricio Rivas desde su laptop personal (no el equipo
  de trabajo).
- Repositorio: `github.com/jomrivas/web-platform-inscripcionesg1`.
- Desplegado en: `https://web-platform-inscripcionesg1.vercel.app/`.


# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.


<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
