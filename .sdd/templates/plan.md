---
spec: NNN
estado: borrador          # borrador | revisado
fecha: YYYY-MM-DD
---

# NNN — Plan de implementación

> Este documento responde **cómo**. Si algo aquí contradice la spec, la spec
> gana: se enmienda el plan, no la spec.

## 1. Enfoque elegido

Una o dos frases. Si hubo alternativas, van en §7.

## 2. Impacto en la base de datos

### Migración
`supabase/migrations/NNNN_descripcion.sql`

```sql
-- …
```

### Reversión
Cómo se deshace si falla. Si no es reversible, decirlo explícitamente.

### RLS
| Tabla | Política | Cambio |
|---|---|---|
| | | nueva / modificada / sin cambio |

*Si esta spec crea una tabla y esta sección está vacía, el plan está incompleto (C2).*

## 3. Archivos a tocar

| Archivo | Acción | Qué cambia |
|---|---|---|
| `app/…` | nuevo / editar / borrar | |
| `src/components/…` | | |
| `lib/validators.ts` | | |

## 4. Contratos de API

### `MÉTODO /api/ruta`

**Autorización:** sesión requerida · rol requerido

**Request**
```json
{}
```

**Respuestas**
| Código | Cuándo | Cuerpo |
|---|---|---|
| 200 | | |
| 400 | | |
| 401 | | |
| 403 | | |

## 5. Validaciones

| Campo | Regla | Dónde vive |
|---|---|---|
| | | `lib/validators.ts` (servidor) + reflejo en cliente |

## 6. Pruebas

| Criterio de aceptación | Spec E2E | Page Object |
|---|---|---|
| A1 | `tests/e2e/specs/…` | |

Datos semilla necesarios, prefijados `E2E_TEST_`:
- …

## 7. Alternativas consideradas

| Opción | A favor | En contra | Veredicto |
|---|---|---|---|
| | | | elegida / descartada |

## 8. Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|

## 9. Verificación contra la constitución

| Artículo | Aplica | Cómo se cumple |
|---|---|---|
| C1 presupuesto $0 | | |
| C2 datos de menores | | |
| C3 doble capa de autorización | | |
| C5 validación server-side | | |
| C6 auditoría | | |
| C10 documentación | | |

## 10. Actualización de documentación

Qué secciones de `AGENTS.md` y de `baseline/inventario.md` cambian al cerrar.
