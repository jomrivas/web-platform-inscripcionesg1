// lib/validators.ts
// Validación server-side (y reutilizable en cliente) con Zod.
// Refleja 1:1 las columnas reales de Supabase (ver supabase/migrations/).

import { z } from 'zod';

const duiRegex = /^\d{8}-\d$/;

// Los campos opcionales vacíos se guardan como NULL (no como ""): así no
// chocan con NOT NULL / CHECK constraints de la base (p. ej. columnas con
// checks que solo admiten NULL o valores específicos).
const emptyToNull = (v: unknown) =>
  v === '' || v === null || v === undefined ? null : v;

// Texto opcional: "" → NULL
const optText = z.preprocess(emptyToNull, z.string().nullable());

// Fecha opcional (columnas date): "" → NULL
const optDate = z.preprocess(emptyToNull, z.string().nullable());

// Numérico opcional: ""/null → NULL, strings numéricos → Number
const optNumber = z.preprocess((v) => {
  const e = emptyToNull(v);
  if (e === null) return null;
  if (typeof e === 'number') return e;
  const n = Number(String(e).trim());
  return Number.isNaN(n) ? e : n;
}, z.number({ invalid_type_error: 'Debe ser un número' }).nullable());

const optBool = z.boolean().optional().default(false);

// Firma opcional (autoridades): ausente o data:image/*
const optSignature = z.preprocess(emptyToNull, z.string().nullable());

// JSONB (grupo_familiar, grupos_previos, formacion_scout, referencias):
// arreglo de strings (una línea del textarea = un elemento)
const strArray = z.array(z.string()).optional().default([]);

export const adultoSchema = z.object({
  // — Control de ficha —
  fecha_ficha: optDate,
  tipo_ficha: optText,
  rama: optText,
  responsable: optText,
  asistente: optText,
  comite_grupo: optText,
  cargo: optText,
  responsable_rama: optBool,
  asistente_rama: optBool,

  // — Datos personales (requeridos de negocio) —
  nombre_completo: z.string().trim().min(1, 'El nombre es requerido'),
  dui: z
    .string()
    .trim()
    .min(1, 'El DUI es requerido')
    .regex(duiRegex, 'Formato DUI inválido (XXXXXXXX-X)'),
  email: z
    .string()
    .trim()
    .min(1, 'El email es requerido')
    .email('Email inválido'),
  fecha_nacimiento: z.string().min(1, 'La fecha de nacimiento es requerida'),
  telefono_celular: z.string().trim().min(1, 'El teléfono es requerido'),

  // — Datos personales (opcionales) —
  direccion: optText,
  ciudad: optText,
  departamento: optText,
  lugar_nacimiento: optText,
  nis: optText,
  sexo: optText,
  telefono_casa: optText,
  telefono_oficina: optText,
  religion: optText,
  estado_civil: optText,
  profesion: optText,
  lugar_trabajo: optText,
  tipo_sangre: optText,
  grupo_familiar: strArray,

  // — Seguro médico / emergencia —
  aseguradora_nombre: optText,
  aseguradora_afiliacion: optText,
  seguro_vigencia: optDate,
  seguro_suma_asegurada: optNumber,
  seguro_cobertura_internacional: optBool,
  emergencia_avisar_a: optText,
  emergencia_telefono: optText,

  // — Datos médicos —
  medicamentos_permanentes: optText,
  tratamiento_actual: optText,
  hipertenso: optBool,
  diabetico_insulina: optBool,
  enfermedad_pulmonar_asma: optBool,
  alergico_a: optText,
  del_corazon: optBool,
  convulsion: optBool,
  discapacidad: optText,
  emergencia_trasladar_a: optText,
  regimen_alimenticio_especial: optText,
  es_propenso_a: optText,
  ha_padecido_de: optText,
  operado_ultimo_ano: optBool,
  operado_que: optText,
  observaciones_adicionales: optText,

  // — Trayectoria scout (JSONB) —
  grupos_previos: strArray,
  formacion_scout: strArray,
  referencias: strArray,

  // — Checklist de documentos —
  foto_reciente: optBool,
  primeros_auxilios: optBool,
  fotocopia_dui: optBool,
  uniforme: optBool,
  evaluacion_psicologica: optBool,
  constancia_pnc: optBool,
  curriculum_vitae: optBool,
  ficha_medica_ases: optBool,

  // — Firmas (la del dirigente es la única obligatoria) —
  firma_dirigente: z
    .string()
    .min(1, 'La firma del dirigente es obligatoria')
    .refine((v) => v.startsWith('data:image/'), 'Firma inválida'),
  firma_tipo_dirigente: z.enum(['canvas', 'image']).optional(),
  firma_responsable_grupo: optSignature,
  firma_tipo_responsable_grupo: z.enum(['canvas', 'image']).optional(),
  firma_presidente_comite: optSignature,
  firma_tipo_presidente_comite: z.enum(['canvas', 'image']).optional(),
  firma_responsable_rama: optSignature,
  firma_tipo_responsable_rama: z.enum(['canvas', 'image']).optional(),
});

export const beneficiarioSchema = z
  .object({
    // — Identificación / datos personales —
    rama_inscripcion: z.string().min(1, 'La rama es requerida'),
    fecha_llenado_ficha: optDate,
    nombre_completo: z.string().trim().min(1, 'El nombre es requerido'),
    dui_numero: optText,
    fecha_nacimiento: z.string().min(1, 'La fecha de nacimiento es requerida'),
    sexo: z.string().min(1, 'El sexo es requerido'),
    lugar_nacimiento: optText,
    direccion: z.string().trim().min(1, 'La dirección es requerida'),
    ciudad: optText,
    departamento: optText,
    telefono_casa: optText,
    telefono_celular: optText,
    email: optText,
    religion: optText,
    tipo_sangre: optText,
    vive_con: optText,

    // — Madre / tutora —
    madre_nombre: optText,
    madre_dui: optText,
    madre_telefono_celular: optText,
    madre_email: optText,

    // — Padre / tutor —
    padre_nombre: optText,
    padre_documento: optText,
    padre_telefono_celular: optText,
    padre_email: optText,

    // — Emergencia —
    emergencia_contacto: optText,
    emergencia_telefono: optText,

    // — Escolaridad —
    escuela_nombre: optText,
    ano_escolar_actual: optText,
    sabe_nadar: optBool,

    // — Datos médicos —
    alergias: optText,
    medicamentos_permanentes: optText,
    discapacidad: optText,
    observaciones_adicionales: optText,

    // — Firmas —
    firma_padre_tutor: optSignature,
    firma_tipo_padre: z.enum(['canvas', 'image']).optional(),
    firma_madre_tutora: optSignature,
    firma_tipo_madre: z.enum(['canvas', 'image']).optional(),
  })
  .superRefine((val, ctx) => {
    if (!val.madre_nombre?.trim() && !val.padre_nombre?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['tutor'],
        message: 'Debes ingresar al menos un tutor (madre o padre)',
      });
    }
    const firmaPadre = val.firma_padre_tutor?.trim() || '';
    const firmaMadre = val.firma_madre_tutora?.trim() || '';
    if (!firmaPadre && !firmaMadre) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['firma'],
        message: 'Se requiere al menos una firma de tutor (padre o madre)',
      });
    }
    for (const [key, label] of [
      ['firma_padre_tutor', 'Firma del padre inválida'],
      ['firma_madre_tutora', 'Firma de la madre inválida'],
    ] as const) {
      const v = (val as Record<string, unknown>)[key];
      if (typeof v === 'string' && v.trim() && !v.startsWith('data:image/')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: label,
        });
      }
    }
  });

export const inscriptionStatusSchema = z.enum([
  'draft',
  'submitted',
  'approved',
  'rejected',
]);

export type AdultoInput = z.infer<typeof adultoSchema>;
export type BeneficiarioInput = z.infer<typeof beneficiarioSchema>;
