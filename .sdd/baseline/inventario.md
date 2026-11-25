# Inventario verificado del repositorio

**Auditoría:** 2026-11-01 · verificada contra el árbol de archivos, no contra documentación.
**Alcance de esta auditoría:** estructura de archivos, dependencias y migraciones.
**No verificado todavía:** contenido de los componentes, lógica de los route handlers,
estado real de la base de datos en Supabase, historial git.

## Versiones reales

| Paquete | Versión en `package.json` |
|---|---|
| next | 16.3.3 |
| react / react-dom | 19.2.8 |
| @supabase/ssr | ^0.12.5 |
| @supabase/supabase-js | ^2.112.4 |
| tailwindcss | ^4 |
| zod | ^3.25.76 |
| resend | ^6.25.0 |
| exceljs | ^4.4.0 |
| pdf-lib | ^1.17.1 |
| @playwright/test | ^1.64.1 |

`AGENTS.md` dice "Next.js 14+". El repo corre **Next 16 + React 19** (ver C11).

## Árbol real

```
app/
├── layout.tsx · page.tsx · globals.css · favicon.ico
├── login/page.tsx
├── signup/page.tsx
├── dashboard/
│   ├── layout.tsx · page.tsx
│   ├── nuevo-formulario/page.tsx
│   ├── nuevo-formulario/adulto/page.tsx
│   ├── nuevo-formulario/beneficiario/page.tsx
│   └── mis-inscripciones/page.tsx
├── admin/
│   ├── layout.tsx · page.tsx
│   ├── listados/page.tsx                    (15 KB)
│   └── inscripciones/[id]/page.tsx          ← NO documentado en AGENTS.md
└── api/
    ├── inscriptions/route.ts
    ├── inscriptions/[id]/route.ts           ← NO documentado en AGENTS.md
    └── export/route.ts                      (10 KB)

src/
├── bg_login_wpg1.jpeg                       (151 KB — ubicación dudosa)
└── components/
    ├── FormularioAdulto.tsx                 (32 KB)
    ├── FormularioBeneficiario.tsx           (22 KB)
    ├── SignaturePad.tsx
    ├── EditorInscripcion.tsx                ← NO documentado en AGENTS.md
    └── LogoutButton.tsx

components/                                  ← VACÍO (directorio muerto)

lib/
├── supabase.ts · supabase-server.ts
└── validators.ts                            (7.5 KB — NO documentado)

supabase/migrations/
├── 0001_schema.sql                          (9.8 KB)
├── 0002_approved_status.sql
├── 0003_adult_rama_roles.sql
├── 0004_fix_adult_form_constraints.sql
└── 0005_fix_beneficiary_form_constraints.sql

tests/e2e/
├── auth.setup.ts · fixtures.ts · global-teardown.ts
├── .auth/user.json
├── pages/ → DashboardPage · LoginPage · FormularioAdultoPage
│            FormularioBeneficiarioPage · SignaturePad
├── specs/user/ → formulario-adulto.spec.ts · formulario-beneficiario.spec.ts
└── utils/ → env.ts · supabaseAdmin.ts · testData.ts

.agents/skills/web-design-guidelines/SKILL.md
proxy.ts · playwright.config.ts · skills-lock.json
```

## Estado funcional por módulo

| Módulo | Archivos presentes | Documentado como | Veredicto |
|---|---|---|---|
| Auth (login/signup) | Sí | implementado | coincide |
| Proxy de rutas | `proxy.ts` | implementado | coincide |
| Dashboard usuario | Sí | implementado | coincide |
| Ficha Adulto | `FormularioAdulto.tsx` | implementado | coincide |
| Ficha Beneficiario | `FormularioBeneficiario.tsx` | implementado | coincide |
| Firma digital | `SignaturePad.tsx` | implementado | coincide |
| Mis Inscripciones | Sí | implementado | coincide |
| Admin KPIs | `admin/page.tsx` | implementado | coincide |
| Admin listados + export | Sí | implementado | coincide |
| **Detalle de inscripción (admin)** | `admin/inscripciones/[id]` | **pendiente** | **doc desactualizada** |
| **Aprobar / rechazar** | `api/inscriptions/[id]/route.ts` | **pendiente** | **doc desactualizada — verificar** |
| **Edición de inscripción** | `EditorInscripcion.tsx` | **pendiente** | **doc desactualizada — verificar** |
| **Estado `approved`** | migración `0002` | status: draft/submitted/rejected | **doc desactualizada** |
| Validadores server-side | `lib/validators.ts` | no mencionado | doc incompleta |
| Subida de foto | — | pendiente | pendiente real |
| Gestión de admins en UI | — | pendiente | pendiente real |
| Export Excel real | `exceljs` instalado | "CSV disfrazado" | **verificar si ya se usa** |
| Export PDF real | `pdf-lib` instalado | "HTML imprimible" | **verificar si ya se usa** |
| Recuperación de contraseña | — | pendiente | pendiente real |
| Dominio verificado en Resend | — | pendiente | pendiente real |

## Cobertura E2E real

`AGENTS.md` §8 afirma cobertura de: proxy/redirecciones, login/signup, ambos
formularios, Mis Inscripciones y panel admin completo.

**En el repo hay 2 specs**, ambas bajo `specs/user/`:
`formulario-adulto.spec.ts` y `formulario-beneficiario.spec.ts`.

No existen `specs/public/` ni `specs/admin/`. No existe `global-setup.ts`
(solo `auth.setup.ts` y `global-teardown.ts`). La cobertura declarada es
mucho mayor que la real.

## Actualización 2026-11-24 — spec 005 (rediseño UX/UI)

Verificado contra el árbol y con tsc, lint, build y E2E locales.

**Nuevo en el árbol**

```
app/icon.png · app/apple-icon.png            íconos desde el isotipo
app/dashboard/nuevo-formulario/TipoSelector.tsx
lib/ramas.ts                                  etiquetas visibles de rama (R5)
src/components/ui/                            componentes base (9 archivos + index)
src/components/ficha/FichaShell.tsx           fichas por pasos
src/components/familia/                       AuthShell, AuthFooter, FamilyFrame,
                                              InscripcionesList, textos.ts
tests/e2e/specs/user/correo-tutor.spec.ts     A13
public/brand/  ·  design/brand/               logo (publicado) y fuentes editables
```

**Cambia de estado**

| Módulo | Antes | Ahora |
|---|---|---|
| Identidad visual | estilos por defecto de Tailwind | tokens (decisión 0004), Nunito, logo |
| Fichas | pestañas | pasos con E1/E2/E3 |
| Etiquetas de campos | sin `htmlFor` | asociadas (A8) |
| Correo del tutor | opcional | obligatorio por tutor registrado (R9) |
| Errores del servidor | solo "Datos inválidos" | se muestran en el campo y su paso |
| Aprobar / rechazar | `prompt()` en la revisión | motivo en un campo del panel lateral; el listado conserva `prompt()` |

**E2E:** 12 pruebas; 11 pasan. Falla `envía la ficha con tipo de ficha, rama
y traslado de emergencia` por `[PENDIENTE-1]` (UNIQUE(dui) global; dos
pruebas usan el mismo DUI). Las pruebas de envío fallan también si la cuenta
de prueba tiene fichas previas (datos residuales).

**Sin usar:** `src/bg_login_wpg1.jpeg` (la portada ya no usa foto de fondo).
Candidato a la limpieza de la spec 004.

