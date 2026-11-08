# Constitución del proyecto

Reglas que no se rompen sin una decisión explícita y documentada.
Toda spec y todo plan se evalúan contra esta lista.

## C1 — Presupuesto $0

La arquitectura se mantiene dentro del free tier de Supabase, Vercel y Resend.
Cualquier propuesta que implique costo recurrente se rechaza o se marca como
decisión pendiente de Mauricio. Se verifica contra las cuotas:
Supabase 500 MB DB + 1 GB storage · Vercel 100 GB bandwidth · Resend 100 emails/mes.

## C2 — Datos de menores de edad

El sistema almacena datos de beneficiarios de 7 a 17 años: nombre, fecha de
nacimiento, dirección, escolaridad, datos médicos y firmas. Consecuencias
obligatorias:

- RLS habilitado en toda tabla nueva, sin excepción. Una tabla sin RLS es un
  defecto bloqueante.
- Ninguna ruta, vista o endpoint expone datos de un beneficiario a un usuario
  que no sea su tutor registrado o un admin.
- Las vistas se crean con `SECURITY INVOKER`, nunca `SECURITY DEFINER`.
- No se registran datos médicos ni de menores en logs, mensajes de error,
  telemetría ni datos semilla de pruebas.

## C3 — Doble capa de autorización

Toda ruta protegida se valida en dos lugares: en `proxy.ts` y server-side en el
layout o el route handler. El proxy por sí solo no es suficiente como control
de acceso.

## C4 — Uso estacional

El pico de tráfico es marzo-abril, con 80-95 usuarios/año. No se optimiza para
escala que no existe, pero sí se protege la ventana de inscripción: ningún
cambio se despliega a producción durante el período ordinario sin haber pasado
la suite E2E.

## C5 — Integridad del dato sobre comodidad de UI

Una ficha incompleta se guarda como `draft`; nunca se envía parcial a
`submitted`. Las validaciones viven en el servidor (`lib/validators.ts`) y el
cliente solo las refleja. Una validación que solo existe en el cliente se
considera ausente.

## C6 — Trazabilidad administrativa

Toda acción de un admin que modifique el estado de una inscripción queda en
`audit_log`. Si una spec añade una acción administrativa, incluir su registro
en auditoría es parte del alcance, no un extra.

## C7 — Nomenclatura institucional

El nombre oficial en UI, emails y metadata es **Grupo Scout No. 1 "Los
Intrépidos"**. "Clan Maya" es exclusivamente la rama Rover (18-21 años), nunca
el nombre del sistema. El landing page del Clan Maya es un proyecto
independiente sin relación técnica con esta plataforma.

## C8 — Locators estables para pruebas

El atributo `name` de cada input coincide 1:1 con su columna en la base de
datos y es el identificador que usan las pruebas. Renombrar un `name` es un
cambio con impacto en pruebas y debe declararse en el plan.

## C9 — Page Object Model

Las pruebas E2E se escriben con Playwright y POM. Un spec que interactúa
directamente con selectores en vez de un Page Object es un defecto de la
prueba.

## C10 — La documentación es parte del entregable

Una spec no se cierra mientras `AGENTS.md` siga describiendo el estado
anterior. Documentación desincronizada es deuda, no detalle.

## C11 — Next.js 16 / React 19

El proyecto corre Next.js 16.3.3 y React 19.2.8. Las APIs difieren del
conocimiento preentrenado: antes de escribir código de framework se consulta
`node_modules/next/dist/docs/`. No se asume la API de Next 14/15.
