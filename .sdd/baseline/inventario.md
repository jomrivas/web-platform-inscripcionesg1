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
