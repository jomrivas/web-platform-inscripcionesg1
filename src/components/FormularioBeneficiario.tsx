// components/FormularioBeneficiario.tsx
// Ficha de afiliación de beneficiario, por pasos (spec 005, §6).
// Los atributos `name` coinciden con las columnas de la base (C8).
'use client';

import React, { useState } from 'react';
import SignaturePad from './SignaturePad';
import { FichaSection, FichaShell, StepError, firstStepWithError, type FichaVariant } from './ficha/FichaShell';
import { Field, Input, Select, Textarea } from './ui/Field';

export interface FormDataBeneficiario {
  rama_inscripcion: string;
  fecha_llenado_ficha?: string;
  nombre_completo: string;
  dui_numero?: string;
  fecha_nacimiento: string;
  sexo: string;
  lugar_nacimiento?: string;
  direccion: string;
  ciudad?: string;
  departamento?: string;
  telefono_casa?: string;
  telefono_celular?: string;
  email?: string;
  religion?: string;
  tipo_sangre?: string;

  vive_con?: string;
  madre_nombre?: string;
  madre_dui?: string;
  madre_telefono_celular?: string;
  madre_email?: string;
  padre_nombre?: string;
  padre_documento?: string;
  padre_telefono_celular?: string;
  padre_email?: string;
  emergencia_contacto?: string;
  emergencia_telefono?: string;

  escuela_nombre?: string;
  ano_escolar_actual?: string;
  sabe_nadar?: boolean;

  alergias?: string;
  medicamentos_permanentes?: string;
  discapacidad?: string;
  observaciones_adicionales?: string;

  firma_padre_tutor?: string;
  firma_tipo_padre?: 'canvas' | 'image';
  firma_madre_tutora?: string;
  firma_tipo_madre?: 'canvas' | 'image';
}

interface FormularioBeneficiarioProps {
  initialData?: Partial<FormDataBeneficiario>;
  onSubmit: (data: FormDataBeneficiario) => Promise<void>;
  isLoading?: boolean;
  /** Errores por campo devueltos por el servidor (E3). */
  serverErrors?: Record<string, string[] | undefined>;
  /** `admin` cuando se edita desde el panel (guarda en vez de enviar). */
  variant?: FichaVariant;
}

// Los nombres de paso son los de las pestañas anteriores: las pruebas
// navegan por ellos (A7).
const STEPS = [
  { id: 'personales', label: 'Datos Personales', description: 'Datos de la persona que se inscribe.' },
  { id: 'tutores', label: 'Padres/Tutores', description: 'Necesitamos al menos una madre, padre o tutor.' },
  { id: 'escolaridad', label: 'Escolaridad', description: 'Dónde estudia actualmente.' },
  { id: 'medicos', label: 'Datos Médicos', description: 'Para cuidar su salud durante las actividades.' },
  { id: 'firma', label: 'Firmas', description: 'Con al menos una firma de madre, padre o tutor puedes enviar.' },
] as const;

// Qué errores pertenecen a cada paso (E1 y E3).
const STEP_KEYS: Record<string, readonly string[]> = {
  personales: ['rama_inscripcion', 'nombre_completo', 'fecha_nacimiento', 'sexo', 'dui_numero', 'direccion', 'ciudad', 'departamento', 'telefono_celular', 'tipo_sangre'],
  tutores: ['tutor', 'madre_nombre', 'madre_dui', 'madre_telefono_celular', 'madre_email', 'padre_nombre', 'padre_documento', 'padre_telefono_celular', 'padre_email', 'emergencia_contacto', 'emergencia_telefono'],
  escolaridad: ['escuela_nombre', 'ano_escolar_actual', 'sabe_nadar'],
  medicos: ['alergias', 'medicamentos_permanentes', 'discapacidad', 'observaciones_adicionales'],
  firma: ['firma', 'firma_padre_tutor', 'firma_madre_tutora'],
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FormularioBeneficiario: React.FC<FormularioBeneficiarioProps> = ({
  initialData = {},
  onSubmit,
  isLoading = false,
  serverErrors,
  variant = 'familia',
}) => {
  const [formData, setFormData] = useState<FormDataBeneficiario>({
    rama_inscripcion: initialData.rama_inscripcion || 'manada_7_10',
    nombre_completo: initialData.nombre_completo || '',
    fecha_nacimiento: initialData.fecha_nacimiento || '',
    sexo: initialData.sexo || 'masculino',
    direccion: initialData.direccion || '',
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<string>('personales');
  const [focusKey, setFocusKey] = useState(0);

  const collectErrors = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!formData.nombre_completo.trim()) e.nombre_completo = 'El nombre es requerido';
    if (!formData.fecha_nacimiento) e.fecha_nacimiento = 'La fecha de nacimiento es requerida';
    if (!formData.direccion.trim()) e.direccion = 'La dirección es requerida';
    if (!formData.madre_nombre?.trim() && !formData.padre_nombre?.trim())
      e.tutor = 'Debes ingresar al menos un tutor (madre o padre)';
    // R9: cada tutor registrado lleva su correo
    for (const [nombre, email, requerido] of [
      ['madre_nombre', 'madre_email', 'El correo de la madre o tutora es requerido'],
      ['padre_nombre', 'padre_email', 'El correo del padre o tutor es requerido'],
    ] as const) {
      if (!formData[nombre]?.trim()) continue;
      const correo = formData[email]?.trim() || '';
      if (!correo) e[email] = requerido;
      else if (!EMAIL_RE.test(correo)) e[email] = 'Correo inválido';
    }
    if (!formData.firma_padre_tutor?.trim() && !formData.firma_madre_tutora?.trim())
      e.firma = 'Se requiere al menos una firma de tutor (padre o madre)';
    return e;
  };

  const showErrors = (e: Record<string, string>) => {
    setErrors(e);
    const step = firstStepWithError(STEPS, STEP_KEYS, e);
    if (step) setActiveTab(step);
    setFocusKey((k) => k + 1);
  };

  // E3: errores que solo detecta el servidor → se abre su paso.
  // Se ajusta el estado durante el render al cambiar la prop (patrón de
  // React para derivar estado de props, sin efecto).
  const [prevServerErrors, setPrevServerErrors] = useState(serverErrors);
  if (serverErrors !== prevServerErrors) {
    setPrevServerErrors(serverErrors);
    const e: Record<string, string> = {};
    for (const [k, msgs] of Object.entries(serverErrors ?? {})) if (msgs?.[0]) e[k] = msgs[0];
    if (Object.keys(e).length) {
      setErrors(e);
      const step = firstStepWithError(STEPS, STEP_KEYS, e);
      if (step) setActiveTab(step);
      setFocusKey((k) => k + 1);
    }
  }

  // E1: "Siguiente" solo avanza si el paso actual no tiene errores.
  const handleNext = () => {
    const all = collectErrors();
    const mine = Object.fromEntries(
      Object.entries(all).filter(([k]) => STEP_KEYS[activeTab]?.includes(k)),
    );
    if (Object.keys(mine).length) {
      setErrors((prev) => ({ ...prev, ...mine }));
      setFocusKey((k) => k + 1);
      return;
    }
    const i = STEPS.findIndex((s) => s.id === activeTab);
    setActiveTab(STEPS[Math.min(i + 1, STEPS.length - 1)].id);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name] || (errors.tutor && (name === 'madre_nombre' || name === 'padre_nombre'))) {
      setErrors((prev) => ({ ...prev, [name]: '', ...(name.endsWith('_nombre') ? { tutor: '' } : {}) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const all = collectErrors();
    if (Object.keys(all).length) {
      showErrors(all);
      return;
    }
    setErrors({});
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error al enviar formulario:', error);
      setErrors((prev) => ({ ...prev, submit: 'Error al enviar el formulario. Intenta de nuevo.' }));
    }
  };

  const txt = (k: keyof FormDataBeneficiario) => (formData[k] as string | undefined) ?? '';

  /** Campo de texto (input) con etiqueta asociada. */
  const text = (
    name: keyof FormDataBeneficiario,
    label: string,
    opts: { type?: string; required?: boolean; hint?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']; autoComplete?: string; className?: string } = {},
  ) => (
    <Field label={label} id={name} required={opts.required} hint={opts.hint} error={errors[name]} className={opts.className}>
      {(a) => (
        <Input
          type={opts.type ?? 'text'}
          name={name}
          value={txt(name)}
          onChange={handleChange}
          inputMode={opts.inputMode}
          autoComplete={opts.autoComplete}
          {...a}
        />
      )}
    </Field>
  );

  const area = (name: keyof FormDataBeneficiario, label: string, rows = 3) => (
    <Field label={label} id={name} error={errors[name]}>
      {(a) => <Textarea name={name} value={txt(name)} onChange={handleChange} rows={rows} {...a} />}
    </Field>
  );

  const signature = (
    label: string,
    data: 'firma_padre_tutor' | 'firma_madre_tutora',
    tipo: 'firma_tipo_padre' | 'firma_tipo_madre',
  ) => (
    <div>
      <SignaturePad
        label={label}
        onSignatureCapture={(value, type) => {
          setFormData((prev) => ({ ...prev, [data]: value, [tipo]: type }));
          if (errors.firma) setErrors((prev) => ({ ...prev, firma: '' }));
        }}
      />
      {formData[data] && (
        <p className="mt-2 text-sm font-bold text-ok">✓ Firma capturada correctamente</p>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FichaShell
        title="Ficha de Afiliación · Beneficiario"
        steps={STEPS}
        current={activeTab}
        onStepChange={setActiveTab}
        onNext={handleNext}
        isLoading={isLoading}
        focusKey={focusKey}
        variant={variant}
      >
        {activeTab === 'personales' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Rama de inscripción" id="rama_inscripcion" required className="sm:col-span-2">
              {(a) => (
                <Select name="rama_inscripcion" value={formData.rama_inscripcion} onChange={handleChange} {...a}>
                  <option value="manada_7_10">Manada · 7 a 10 años</option>
                  <option value="scouts_11_14">Unidad Scout · 11 a 14 años</option>
                  <option value="caminantes_15_17">Comunidad de Caminantes · 15 a 17 años</option>
                  <option value="rovers_18_21">Clan Rover · 18 a 21 años</option>
                </Select>
              )}
            </Field>
            {text('nombre_completo', 'Nombre completo', { required: true, autoComplete: 'off', className: 'sm:col-span-2', hint: 'Tal como aparece en la partida de nacimiento' })}
            {text('fecha_nacimiento', 'Fecha de nacimiento', { type: 'date', required: true })}
            <Field label="Sexo" id="sexo">
              {(a) => (
                <Select name="sexo" value={formData.sexo} onChange={handleChange} {...a}>
                  <option value="masculino">Masculino</option>
                  <option value="femenino">Femenino</option>
                </Select>
              )}
            </Field>
            {text('dui_numero', 'DUI', { hint: 'Solo para Clan Rover', inputMode: 'numeric' })}
            {text('telefono_celular', 'Teléfono celular', { type: 'tel', inputMode: 'tel' })}
            {text('direccion', 'Dirección', { required: true, className: 'sm:col-span-2' })}
            {text('ciudad', 'Ciudad')}
            {text('departamento', 'Departamento')}
            <Field label="Tipo de sangre" id="tipo_sangre">
              {(a) => (
                <Select name="tipo_sangre" value={txt('tipo_sangre')} onChange={handleChange} {...a}>
                  <option value="">Seleccionar...</option>
                  {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </div>
        )}

        {activeTab === 'tutores' && (
          <div className="flex flex-col gap-8">
            {errors.tutor && <StepError>{errors.tutor}</StepError>}
            <FichaSection title="Madre o tutora">
              {text('madre_nombre', 'Nombre completo')}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {text('madre_dui', 'DUI', { inputMode: 'numeric' })}
                {text('madre_telefono_celular', 'Celular', { type: 'tel', inputMode: 'tel' })}
                {text('madre_email', 'Correo', {
                  type: 'email',
                  required: !!formData.madre_nombre?.trim(),
                  hint: 'Obligatorio si registras a la madre o tutora',
                  className: 'sm:col-span-2',
                })}
              </div>
            </FichaSection>
            <FichaSection title="Padre o tutor">
              {text('padre_nombre', 'Nombre completo')}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {text('padre_documento', 'DUI o documento')}
                {text('padre_telefono_celular', 'Celular', { type: 'tel', inputMode: 'tel' })}
                {text('padre_email', 'Correo', {
                  type: 'email',
                  required: !!formData.padre_nombre?.trim(),
                  hint: 'Obligatorio si registras al padre o tutor',
                  className: 'sm:col-span-2',
                })}
              </div>
            </FichaSection>
            <FichaSection title="En caso de emergencia llamar a">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {text('emergencia_contacto', 'Nombre de contacto')}
                {text('emergencia_telefono', 'Teléfono', { type: 'tel', inputMode: 'tel' })}
              </div>
            </FichaSection>
          </div>
        )}

        {activeTab === 'escolaridad' && (
          <div className="flex flex-col gap-4">
            {text('escuela_nombre', 'Centro de estudios')}
            {text('ano_escolar_actual', 'Año escolar actual')}
            <label className="flex min-h-11 items-center gap-3 text-[15px] font-bold">
              <input
                type="checkbox"
                name="sabe_nadar"
                checked={formData.sabe_nadar || false}
                onChange={handleChange}
                className="size-5 accent-brand"
              />
              Sabe nadar
            </label>
          </div>
        )}

        {activeTab === 'medicos' && (
          <div className="flex flex-col gap-4">
            {area('alergias', 'Alergias')}
            {area('medicamentos_permanentes', 'Medicamentos permanentes')}
            {area('discapacidad', 'Discapacidad', 2)}
            {area('observaciones_adicionales', 'Observaciones adicionales')}
          </div>
        )}

        {activeTab === 'firma' && (
          <div className="flex flex-col gap-5">
            {errors.firma && <StepError>{errors.firma}</StepError>}
            {signature('Firma de Padre o Tutor', 'firma_padre_tutor', 'firma_tipo_padre')}
            {signature('Firma de Madre o Tutora', 'firma_madre_tutora', 'firma_tipo_madre')}
          </div>
        )}

        {errors.submit && <StepError>{errors.submit}</StepError>}
      </FichaShell>
    </form>
  );
};

export default FormularioBeneficiario;
