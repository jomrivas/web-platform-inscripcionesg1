// lib/validators.ts
// Validación server-side (y reutilizable en cliente) con Zod.
// Refleja las reglas de negocio: Adulto requiere DUI + email + firma;
// Beneficiario requiere datos básicos + al menos un tutor + al menos una firma.

import { z } from 'zod';

const duiRegex = /^\d{8}-\d$/;

export const adultoSchema = z.object({
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
  firma_responsable_grupo: z
    .string()
    .min(1, 'La firma es obligatoria')
    .refine((v) => v.startsWith('data:image/'), 'Firma inválida'),
  firma_tipo_responsable_grupo: z.enum(['canvas', 'image']).optional(),
});

export const beneficiarioSchema = z
  .object({
    rama_inscripcion: z.string().min(1),
    nombre_completo: z.string().trim().min(1, 'El nombre es requerido'),
    fecha_nacimiento: z.string().min(1, 'La fecha de nacimiento es requerida'),
    direccion: z.string().trim().min(1, 'La dirección es requerida'),
    madre_nombre: z.string().trim().optional().default(''),
    padre_nombre: z.string().trim().optional().default(''),
    firma_padre_tutor: z.string().optional().default(''),
    firma_madre_tutora: z.string().optional().default(''),
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

export type AdultoInput = z.infer<typeof adultoSchema>;
export type BeneficiarioInput = z.infer<typeof beneficiarioSchema>;
