'use client';

import React, { useState } from 'react';
import SignaturePad from './SignaturePad';
import { FichaShell, StepError, firstStepWithError, type FichaVariant } from './ficha/FichaShell';

export interface FormDataAdulto {
  // Control de ficha
  fecha_ficha?: string;
  tipo_ficha?: string;
  rama?: string;
  responsable?: string;
  asistente?: string;
  comite_grupo?: string;
  cargo?: string;
  responsable_rama?: boolean;
  asistente_rama?: boolean;

  // Datos personales
  nombre_completo: string;
  direccion?: string;
  ciudad?: string;
  departamento?: string;
  lugar_nacimiento?: string;
  fecha_nacimiento: string;
  dui: string;
  nis?: string;
  sexo?: string;
  telefono_casa?: string;
  telefono_oficina?: string;
  telefono_celular: string;
  religion?: string;
  estado_civil?: string;
  profesion?: string;
  lugar_trabajo?: string;
  email: string;
  tipo_sangre?: string;
  grupo_familiar?: string[];

  // Seguro médico / emergencia
  aseguradora_nombre?: string;
  aseguradora_afiliacion?: string;
  seguro_vigencia?: string;
  seguro_suma_asegurada?: string | number;
  seguro_cobertura_internacional?: boolean;
  emergencia_avisar_a?: string;
  emergencia_telefono?: string;

  // Datos médicos
  medicamentos_permanentes?: string;
  tratamiento_actual?: string;
  hipertenso?: boolean;
  diabetico_insulina?: boolean;
  enfermedad_pulmonar_asma?: boolean;
  alergico_a?: string;
  del_corazon?: boolean;
  convulsion?: boolean;
  discapacidad?: string;
  emergencia_trasladar_a?: string;
  regimen_alimenticio_especial?: string;
  es_propenso_a?: string;
  ha_padecido_de?: string;
  operado_ultimo_ano?: boolean;
  operado_que?: string;
  observaciones_adicionales?: string;

  // Trayectoria scout (JSONB)
  grupos_previos?: string[];
  formacion_scout?: string[];
  referencias?: string[];

  // Checklist documentos
  foto_reciente?: boolean;
  primeros_auxilios?: boolean;
  fotocopia_dui?: boolean;
  uniforme?: boolean;
  evaluacion_psicologica?: boolean;
  constancia_pnc?: boolean;
  curriculum_vitae?: boolean;
  ficha_medica_ases?: boolean;

  // Firmas (4)
  firma_responsable_grupo?: string;
  firma_tipo_responsable_grupo?: 'canvas' | 'image';
  firma_presidente_comite?: string;
  firma_tipo_presidente_comite?: 'canvas' | 'image';
  firma_dirigente?: string;
  firma_tipo_dirigente?: 'canvas' | 'image';
  firma_responsable_rama?: string;
  firma_tipo_responsable_rama?: 'canvas' | 'image';
}

interface FormularioAdultoProps {
  initialData?: Partial<FormDataAdulto>;
  onSubmit: (data: FormDataAdulto) => Promise<void>;
  isLoading?: boolean;
  /** Errores por campo devueltos por el servidor (E3). */
  serverErrors?: Record<string, string[] | undefined>;
  /** `admin` cuando se edita desde el panel (guarda en vez de enviar). */
  variant?: FichaVariant;
}

// — Helpers de formulario —
const toStrArray = (v: unknown): string[] => {
  if (Array.isArray(v))
    return v.map((x) => (typeof x === 'string' ? x : JSON.stringify(x)));
  if (typeof v === 'string' && v.trim()) return [v.trim()];
  return [];
};

// Estilo de control con tokens (spec 005). El borde de error lo pone
// aria-invalid, que inyecta <Field>.
const inputCls = () =>
  'w-full min-w-0 rounded-control border-[1.5px] border-line bg-surface px-4 text-base text-ink ' +
  'transition-colors focus:border-brand focus:outline-3 focus:outline-brand-soft focus:outline-offset-0 ' +
  'aria-invalid:border-danger [&:not(textarea)]:h-13 [&:is(textarea)]:py-3';

/** Etiqueta asociada al control (A8): el id sale del `name` del control,
 *  que no cambia (C8). También inyecta aria-invalid/describedby. */
function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  const kids = React.Children.toArray(children);
  const idx = kids.findIndex(
    (k) => React.isValidElement<{ name?: string }>(k) && !!k.props.name,
  );
  const ctrl = idx >= 0 ? (kids[idx] as React.ReactElement<{ name: string }>) : null;
  const id = ctrl?.props.name;
  const errorId = error && id ? `${id}-error` : undefined;
  if (ctrl) {
    kids[idx] = React.cloneElement(ctrl as React.ReactElement<Record<string, unknown>>, {
      id,
      'aria-invalid': error ? true : undefined,
      'aria-describedby': errorId,
      'aria-required': required || undefined,
    });
  }
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-bold text-ink">
        {label}
        {required && (
          <span aria-hidden="true" className="text-danger">
            {' *'}
          </span>
        )}
      </label>
      {kids}
      {error && (
        <p id={errorId} className="text-[13px] font-bold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

function Check({
  label,
  name,
  checked,
  onChange,
}: {
  label: string;
  name: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="flex min-h-11 items-center gap-3 text-[15px] font-bold text-ink">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="size-5 flex-none accent-brand"
      />
      {label}
    </label>
  );
}

// Opciones del datalist de "Rama"
const RAMA_OPTIONS = [
  'Manada',
  'Scouts',
  'Caminantes',
  'Clan Rover',
  'Responsable de Grupo',
  'Asistente de Responsable',
  'Comité de Padres',
] as const;

// Ramas que habilitan los roles internos (Responsable/Asistente de Rama)
const RAMAS_CON_ROLES = ['Manada', 'Scouts', 'Caminantes', 'Clan Rover'];

// Los nombres de paso son los de las pestañas anteriores: las pruebas
// navegan por ellos (A7).
const TABS = [
  { id: 'ficha', label: 'Ficha', description: 'Tipo de ficha y rama o cargo en el grupo.' },
  { id: 'personales', label: 'Datos Personales', description: 'Datos de la persona voluntaria.' },
  { id: 'seguro', label: 'Seguro / Emergencia', description: 'Seguro médico y a quién avisar en una emergencia.' },
  { id: 'medicos', label: 'Datos Médicos', description: 'Para cuidar tu salud durante las actividades.' },
  { id: 'trayectoria', label: 'Trayectoria Scout', description: 'Tu experiencia previa en el movimiento scout.' },
  { id: 'documentos', label: 'Documentos', description: 'Marca los documentos que ya entregaste.' },
  { id: 'firma', label: 'Firmas', description: 'La firma del dirigente es obligatoria para enviar.' },
] as const;

// Qué errores pertenecen a cada paso (E1 y E3). Generado de los campos
// de cada paso.
const STEP_KEYS: Record<string, readonly string[]> = {
  ficha: ['fecha_ficha', 'tipo_ficha', 'rama', 'responsable_rama', 'asistente_rama', 'cargo'],
  personales: ['nombre_completo', 'dui', 'email', 'fecha_nacimiento', 'telefono_celular', 'sexo', 'direccion', 'ciudad', 'departamento', 'lugar_nacimiento', 'nis', 'telefono_casa', 'telefono_oficina', 'religion', 'estado_civil', 'profesion', 'lugar_trabajo', 'tipo_sangre', 'grupo_familiar'],
  seguro: ['aseguradora_nombre', 'aseguradora_afiliacion', 'seguro_vigencia', 'seguro_suma_asegurada', 'seguro_cobertura_internacional', 'emergencia_avisar_a', 'emergencia_telefono'],
  medicos: ['hipertenso', 'diabetico_insulina', 'enfermedad_pulmonar_asma', 'del_corazon', 'convulsion', 'operado_ultimo_ano', 'alergico_a', 'medicamentos_permanentes', 'tratamiento_actual', 'discapacidad', 'operado_que', 'emergencia_trasladar_a', 'regimen_alimenticio_especial', 'es_propenso_a', 'ha_padecido_de', 'observaciones_adicionales'],
  trayectoria: ['grupos_previos', 'formacion_scout', 'referencias'],
  documentos: ['foto_reciente', 'primeros_auxilios', 'fotocopia_dui', 'uniforme', 'evaluacion_psicologica', 'constancia_pnc', 'curriculum_vitae', 'ficha_medica_ases'],
  firma: ['firma', 'firma_dirigente'],
};


const FormularioAdulto: React.FC<FormularioAdultoProps> = ({
  initialData = {},
  onSubmit,
  isLoading = false,
  serverErrors,
  variant = 'familia',
}) => {
  const [formData, setFormData] = useState<FormDataAdulto>({
    nombre_completo: '',
    fecha_nacimiento: '',
    dui: '',
    telefono_celular: '',
    email: '',
    sexo: 'masculino',
    ...initialData,
    grupo_familiar: toStrArray(initialData.grupo_familiar),
    grupos_previos: toStrArray(initialData.grupos_previos),
    formacion_scout: toStrArray(initialData.formacion_scout),
    referencias: toStrArray(initialData.referencias),
    seguro_suma_asegurada:
      initialData.seguro_suma_asegurada !== undefined &&
      initialData.seguro_suma_asegurada !== null
        ? String(initialData.seguro_suma_asegurada)
        : '',
  });

  // Texto crudo de los textareas "uno por línea". Se guarda tal cual se
  // escribe: si el textarea se pintara desde el array ya limpio, cada
  // trim()/filter() borraría espacios y saltos de línea mientras se tipea.
  const [arrayDrafts, setArrayDrafts] = useState<Record<string, string>>(() => ({
    grupo_familiar: toStrArray(initialData.grupo_familiar).join('\n'),
    grupos_previos: toStrArray(initialData.grupos_previos).join('\n'),
    formacion_scout: toStrArray(initialData.formacion_scout).join('\n'),
    referencias: toStrArray(initialData.referencias).join('\n'),
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<string>('personales');

  const collectErrors = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre_completo.trim())
      newErrors.nombre_completo = 'El nombre es requerido';
    if (!formData.dui.trim()) newErrors.dui = 'El DUI es requerido';
    else if (!/^\d{8}-\d{1}$/.test(formData.dui))
      newErrors.dui = 'Formato DUI inválido (XXXXXXXX-X)';
    if (!formData.email.trim()) newErrors.email = 'El email es requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = 'Email inválido';
    if (!formData.fecha_nacimiento)
      newErrors.fecha_nacimiento = 'La fecha de nacimiento es requerida';
    if (!formData.telefono_celular.trim())
      newErrors.telefono_celular = 'El teléfono es requerido';
    if (
      formData.seguro_suma_asegurada !== '' &&
      formData.seguro_suma_asegurada !== undefined &&
      Number.isNaN(Number(formData.seguro_suma_asegurada))
    )
      newErrors.seguro_suma_asegurada = 'Debe ser un número';
    if (!formData.firma_dirigente?.trim())
      newErrors.firma = 'La firma del dirigente es obligatoria';

    return newErrors;
  };

  const [focusKey, setFocusKey] = useState(0);

  const showErrors = (e: Record<string, string>) => {
    setErrors(e);
    const step = firstStepWithError(TABS, STEP_KEYS, e);
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
      const step = firstStepWithError(TABS, STEP_KEYS, e);
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
    const i = TABS.findIndex((t) => t.id === activeTab);
    setActiveTab(TABS[Math.min(i + 1, TABS.length - 1)].id);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => {
      const next: FormDataAdulto = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };

      // Al cambiar de rama, limpiar los campos condicionales que dejan de aplicar
      if (name === 'rama') {
        if (!RAMAS_CON_ROLES.includes(value.trim())) {
          next.responsable_rama = false;
          next.asistente_rama = false;
        }
        if (!value.trim().toLowerCase().includes('comit')) {
          next.cargo = '';
        }
      }

      return next;
    });

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleArrayChange = (name: keyof FormDataAdulto, text: string) => {
    setArrayDrafts((prev) => ({ ...prev, [name]: text }));
    const arr = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    setFormData((prev) => ({ ...prev, [name]: arr }));
  };

  const capture =
    (firmaKey: keyof FormDataAdulto, tipoKey: keyof FormDataAdulto) =>
    (data: string, tipo: 'canvas' | 'image') => {
      setFormData((prev) => ({
        ...prev,
        [firmaKey]: data,
        [tipoKey]: tipo,
      }));
      if (errors.firma) setErrors((prev) => ({ ...prev, firma: '' }));
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
      setErrors((prev) => ({
        ...prev,
        submit: 'Error al enviar el formulario. Intenta de nuevo.',
      }));
    }
  };

  const bool = (v?: boolean) => v || false;
  const txt = (v?: string | number) => v ?? '';

  const ramaValue = (formData.rama || '').trim();
  const esRamaConRoles = RAMAS_CON_ROLES.includes(ramaValue);
  const esComite = ramaValue.toLowerCase().includes('comit');

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FichaShell
        title="Ficha de Adultos Voluntarios"
        steps={TABS}
        current={activeTab}
        onStepChange={setActiveTab}
        onNext={handleNext}
        isLoading={isLoading}
        focusKey={focusKey}
        variant={variant}
      >
      {/* Tab: Control de ficha */}
      {activeTab === 'ficha' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Fecha de ficha">
            <input
              type="date"
              name="fecha_ficha"
              value={txt(formData.fecha_ficha)}
              onChange={handleChange}
              className={inputCls()}
            />
          </Field>
          <Field label="Tipo de ficha">
            <select
              name="tipo_ficha"
              value={txt(formData.tipo_ficha)}
              onChange={handleChange}
              className={inputCls()}
            >
              <option value="">Seleccionar...</option>
              <option value="nueva">Nueva</option>
              <option value="reingreso">Reingreso</option>
              <option value="actualizacion">Actualización</option>
            </select>
          </Field>
          <Field label="Rama">
            <input
              type="text"
              name="rama"
              list="rama-options"
              placeholder="Selecciona o escribe una rama"
              value={txt(formData.rama)}
              onChange={handleChange}
              className={inputCls()}
            />
            <datalist id="rama-options">
              {RAMA_OPTIONS.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
          </Field>
          {/* Rama con roles internos (Manada/Scouts/Caminantes/Clan Rover):
              solo se muestran los checkboxes de rol */}
          {esRamaConRoles && (
            <div className="rounded-card bg-canvas p-4 sm:col-span-2">
              <h3 className="mb-2 text-[13px] font-extrabold tracking-wider text-muted uppercase">
                Rol en la rama
              </h3>
              <div className="flex flex-wrap gap-x-6">
                <Check
                  label="Responsable de Rama"
                  name="responsable_rama"
                  checked={bool(formData.responsable_rama)}
                  onChange={handleChange}
                />
                <Check
                  label="Asistente de Rama"
                  name="asistente_rama"
                  checked={bool(formData.asistente_rama)}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          {/* Comité: solo se muestra el input de Cargo */}
          {esComite && (
            <Field label="Cargo">
              <input
                type="text"
                name="cargo"
                value={txt(formData.cargo)}
                onChange={handleChange}
                className={inputCls()}
              />
            </Field>
          )}
        </div>
      )}

      {/* Tab: Datos personales */}
      {activeTab === 'personales' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nombre Completo" required error={errors.nombre_completo}>
            <input
              type="text"
              name="nombre_completo"
              value={formData.nombre_completo}
              onChange={handleChange}
              className={inputCls()}
            />
          </Field>
          <Field label="DUI" required error={errors.dui}>
            <input
              type="text"
              name="dui"
              placeholder="XXXXXXXX-X"
              value={formData.dui}
              onChange={handleChange}
              className={inputCls()}
            />
          </Field>
          <Field label="Email" required error={errors.email}>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={inputCls()}
            />
          </Field>
          <Field
            label="Fecha de Nacimiento"
            required
            error={errors.fecha_nacimiento}
          >
            <input
              type="date"
              name="fecha_nacimiento"
              value={formData.fecha_nacimiento}
              onChange={handleChange}
              className={inputCls()}
            />
          </Field>
          <Field
            label="Teléfono Celular"
            required
            error={errors.telefono_celular}
          >
            <input
              type="tel"
              name="telefono_celular"
              value={formData.telefono_celular}
              onChange={handleChange}
              className={inputCls()}
            />
          </Field>
          <Field label="Sexo">
            <select
              name="sexo"
              value={formData.sexo || 'masculino'}
              onChange={handleChange}
              className={inputCls()}
            >
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
            </select>
          </Field>
          <Field label="Dirección">
            <input
              type="text"
              name="direccion"
              value={txt(formData.direccion)}
              onChange={handleChange}
              className={inputCls()}
            />
          </Field>
          <Field label="Ciudad">
            <input
              type="text"
              name="ciudad"
              value={txt(formData.ciudad)}
              onChange={handleChange}
              className={inputCls()}
            />
          </Field>
          <Field label="Departamento">
            <input
              type="text"
              name="departamento"
              value={txt(formData.departamento)}
              onChange={handleChange}
              className={inputCls()}
            />
          </Field>
          <Field label="Lugar de nacimiento">
            <input
              type="text"
              name="lugar_nacimiento"
              value={txt(formData.lugar_nacimiento)}
              onChange={handleChange}
              className={inputCls()}
            />
          </Field>
          <Field label="NIS">
            <input
              type="text"
              name="nis"
              value={txt(formData.nis)}
              onChange={handleChange}
              className={inputCls()}
            />
          </Field>
          <Field label="Teléfono de casa">
            <input
              type="tel"
              name="telefono_casa"
              value={txt(formData.telefono_casa)}
              onChange={handleChange}
              className={inputCls()}
            />
          </Field>
          <Field label="Teléfono de oficina">
            <input
              type="tel"
              name="telefono_oficina"
              value={txt(formData.telefono_oficina)}
              onChange={handleChange}
              className={inputCls()}
            />
          </Field>
          <Field label="Religión">
            <input
              type="text"
              name="religion"
              value={txt(formData.religion)}
              onChange={handleChange}
              className={inputCls()}
            />
          </Field>
          <Field label="Estado civil">
            <select
              name="estado_civil"
              value={txt(formData.estado_civil)}
              onChange={handleChange}
              className={inputCls()}
            >
              <option value="">Seleccionar...</option>
              <option value="soltero">Soltero/a</option>
              <option value="casado">Casado/a</option>
              <option value="divorciado">Divorciado/a</option>
              <option value="viudo">Viudo/a</option>
              <option value="union_libre">Unión libre</option>
            </select>
          </Field>
          <Field label="Profesión">
            <input
              type="text"
              name="profesion"
              value={txt(formData.profesion)}
              onChange={handleChange}
              className={inputCls()}
            />
          </Field>
          <Field label="Lugar de trabajo">
            <input
              type="text"
              name="lugar_trabajo"
              value={txt(formData.lugar_trabajo)}
              onChange={handleChange}
              className={inputCls()}
            />
          </Field>
          <Field label="Tipo de Sangre">
            <select
              name="tipo_sangre"
              value={txt(formData.tipo_sangre)}
              onChange={handleChange}
              className={inputCls()}
            >
              <option value="">Seleccionar...</option>
              {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Grupo familiar (una persona por línea)">
              <textarea
                name="grupo_familiar"
                value={arrayDrafts.grupo_familiar ?? ''}
                onChange={(e) =>
                  handleArrayChange('grupo_familiar', e.target.value)
                }
                rows={3}
                className={inputCls()}
              />
            </Field>
          </div>
        </div>
      )}

      {/* Tab: Seguro / emergencia */}
      {activeTab === 'seguro' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Aseguradora">
            <input
              type="text"
              name="aseguradora_nombre"
              value={txt(formData.aseguradora_nombre)}
              onChange={handleChange}
              className={inputCls()}
            />
          </Field>
          <Field label="Afiliación de seguro">
            <input
              type="text"
              name="aseguradora_afiliacion"
              value={txt(formData.aseguradora_afiliacion)}
              onChange={handleChange}
              className={inputCls()}
            />
          </Field>
          <Field label="Vigencia del seguro">
            <input
              type="date"
              name="seguro_vigencia"
              value={txt(formData.seguro_vigencia)}
              onChange={handleChange}
              className={inputCls()}
            />
          </Field>
          <Field label="Suma asegurada" error={errors.seguro_suma_asegurada}>
            <input
              type="number"
              step="0.01"
              min="0"
              name="seguro_suma_asegurada"
              value={txt(formData.seguro_suma_asegurada)}
              onChange={handleChange}
              className={inputCls()}
            />
          </Field>
          <div className="flex items-end">
            <Check
              label="Cobertura internacional"
              name="seguro_cobertura_internacional"
              checked={bool(formData.seguro_cobertura_internacional)}
              onChange={handleChange}
            />
          </div>
          <Field label="En caso de emergencia avisar a">
            <input
              type="text"
              name="emergencia_avisar_a"
              value={txt(formData.emergencia_avisar_a)}
              onChange={handleChange}
              className={inputCls()}
            />
          </Field>
          <Field label="Teléfono de emergencia">
            <input
              type="tel"
              name="emergencia_telefono"
              value={txt(formData.emergencia_telefono)}
              onChange={handleChange}
              className={inputCls()}
            />
          </Field>
        </div>
      )}

      {/* Tab: Datos médicos */}
      {activeTab === 'medicos' && (
        <div className="flex flex-col gap-4">
          <div className="rounded-card bg-canvas p-4">
            <h3 className="mb-2 text-[13px] font-extrabold tracking-wider text-muted uppercase">
              Condiciones médicas
            </h3>
            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
              <Check
                label="Hipertenso"
                name="hipertenso"
                checked={bool(formData.hipertenso)}
                onChange={handleChange}
              />
              <Check
                label="Diabético / Insulina"
                name="diabetico_insulina"
                checked={bool(formData.diabetico_insulina)}
                onChange={handleChange}
              />
              <Check
                label="Enfermedad pulmonar / Asma"
                name="enfermedad_pulmonar_asma"
                checked={bool(formData.enfermedad_pulmonar_asma)}
                onChange={handleChange}
              />
              <Check
                label="Del corazón"
                name="del_corazon"
                checked={bool(formData.del_corazon)}
                onChange={handleChange}
              />
              <Check
                label="Convulsiones"
                name="convulsion"
                checked={bool(formData.convulsion)}
                onChange={handleChange}
              />
              <Check
                label="Operado en el último año"
                name="operado_ultimo_ano"
                checked={bool(formData.operado_ultimo_ano)}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Alérgico a">
              <textarea
                name="alergico_a"
                value={txt(formData.alergico_a)}
                onChange={handleChange}
                rows={2}
                className={inputCls()}
              />
            </Field>
            <Field label="Medicamentos permanentes">
              <textarea
                name="medicamentos_permanentes"
                value={txt(formData.medicamentos_permanentes)}
                onChange={handleChange}
                rows={2}
                className={inputCls()}
              />
            </Field>
            <Field label="Tratamiento actual">
              <textarea
                name="tratamiento_actual"
                value={txt(formData.tratamiento_actual)}
                onChange={handleChange}
                rows={2}
                className={inputCls()}
              />
            </Field>
            <Field label="Discapacidad">
              <textarea
                name="discapacidad"
                value={txt(formData.discapacidad)}
                onChange={handleChange}
                rows={2}
                className={inputCls()}
              />
            </Field>
            <Field label="¿De qué fue operado?">
              <input
                type="text"
                name="operado_que"
                value={txt(formData.operado_que)}
                onChange={handleChange}
                className={inputCls()}
              />
            </Field>
            <Field label="Trasladar en emergencia a">
              <input
                type="text"
                name="emergencia_trasladar_a"
                value={txt(formData.emergencia_trasladar_a)}
                onChange={handleChange}
                className={inputCls()}
              />
            </Field>
            <Field label="Régimen alimenticio especial">
              <input
                type="text"
                name="regimen_alimenticio_especial"
                value={txt(formData.regimen_alimenticio_especial)}
                onChange={handleChange}
                className={inputCls()}
              />
            </Field>
            <Field label="Es propenso a">
              <input
                type="text"
                name="es_propenso_a"
                value={txt(formData.es_propenso_a)}
                onChange={handleChange}
                className={inputCls()}
              />
            </Field>
            <Field label="Ha padecido de">
              <input
                type="text"
                name="ha_padecido_de"
                value={txt(formData.ha_padecido_de)}
                onChange={handleChange}
                className={inputCls()}
              />
            </Field>
          </div>
          <Field label="Observaciones adicionales">
            <textarea
              name="observaciones_adicionales"
              value={txt(formData.observaciones_adicionales)}
              onChange={handleChange}
              rows={3}
              className={inputCls()}
            />
          </Field>
        </div>
      )}

      {/* Tab: Trayectoria scout */}
      {activeTab === 'trayectoria' && (
        <div className="flex flex-col gap-4">
          <Field label="Grupos previos (uno por línea)">
            <textarea
              name="grupos_previos"
              value={arrayDrafts.grupos_previos ?? ''}
              onChange={(e) =>
                handleArrayChange('grupos_previos', e.target.value)
              }
              rows={3}
              className={inputCls()}
            />
          </Field>
          <Field label="Formación scout (una por línea)">
            <textarea
              name="formacion_scout"
              value={arrayDrafts.formacion_scout ?? ''}
              onChange={(e) =>
                handleArrayChange('formacion_scout', e.target.value)
              }
              rows={3}
              className={inputCls()}
            />
          </Field>
          <Field label="Referencias (una por línea)">
            <textarea
              name="referencias"
              value={arrayDrafts.referencias ?? ''}
              onChange={(e) => handleArrayChange('referencias', e.target.value)}
              rows={3}
              className={inputCls()}
            />
          </Field>
        </div>
      )}

      {/* Tab: Documentos */}
      {activeTab === 'documentos' && (
        <div className="rounded-card bg-canvas p-4">
          <h3 className="mb-2 text-[13px] font-extrabold tracking-wider text-muted uppercase">
            Checklist de documentos entregados
          </h3>
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <Check
              label="Foto reciente"
              name="foto_reciente"
              checked={bool(formData.foto_reciente)}
              onChange={handleChange}
            />
            <Check
              label="Primeros auxilios"
              name="primeros_auxilios"
              checked={bool(formData.primeros_auxilios)}
              onChange={handleChange}
            />
            <Check
              label="Fotocopia de DUI"
              name="fotocopia_dui"
              checked={bool(formData.fotocopia_dui)}
              onChange={handleChange}
            />
            <Check
              label="Uniforme"
              name="uniforme"
              checked={bool(formData.uniforme)}
              onChange={handleChange}
            />
            <Check
              label="Evaluación psicológica"
              name="evaluacion_psicologica"
              checked={bool(formData.evaluacion_psicologica)}
              onChange={handleChange}
            />
            <Check
              label="Constancia PNC"
              name="constancia_pnc"
              checked={bool(formData.constancia_pnc)}
              onChange={handleChange}
            />
            <Check
              label="Currículum vitae"
              name="curriculum_vitae"
              checked={bool(formData.curriculum_vitae)}
              onChange={handleChange}
            />
            <Check
              label="Ficha médica ASES"
              name="ficha_medica_ases"
              checked={bool(formData.ficha_medica_ases)}
              onChange={handleChange}
            />
          </div>
        </div>
      )}

      {/* Tab: Firmas */}
      {activeTab === 'firma' && (
        <div className="flex flex-col gap-5">
          {errors.firma && (
            <StepError>{errors.firma}</StepError>
          )}
          <div>
            <SignaturePad
              onSignatureCapture={capture(
                'firma_dirigente',
                'firma_tipo_dirigente'
              )}
              label="Firma del Dirigente *"
              error={errors.firma}
            />
            {formData.firma_dirigente && (
              <p className="mt-2 text-sm font-bold text-ok">
                ✓ Firma capturada correctamente
              </p>
            )}
          </div>
        </div>
      )}

      {errors.submit && <StepError>{errors.submit}</StepError>}
      </FichaShell>
    </form>
  );
};

export default FormularioAdulto;
