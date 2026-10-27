'use client';

import React, { useState } from 'react';
import SignaturePad from './SignaturePad';

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
}

// — Helpers de formulario —
const toStrArray = (v: unknown): string[] => {
  if (Array.isArray(v))
    return v.map((x) => (typeof x === 'string' ? x : JSON.stringify(x)));
  if (typeof v === 'string' && v.trim()) return [v.trim()];
  return [];
};

const inputCls = (hasError?: string) =>
  `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 ${
    hasError ? 'border-red-500' : 'border-gray-300'
  }`;

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
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && '*'}
      </label>
      {children}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
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
    <label className="flex items-center gap-2 text-sm text-gray-700">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 accent-blue-600"
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

const TABS = [
  { id: 'ficha', label: 'Ficha' },
  { id: 'personales', label: 'Datos Personales' },
  { id: 'seguro', label: 'Seguro / Emergencia' },
  { id: 'medicos', label: 'Datos Médicos' },
  { id: 'trayectoria', label: 'Trayectoria Scout' },
  { id: 'documentos', label: 'Documentos' },
  { id: 'firma', label: 'Firmas' },
] as const;

const FormularioAdulto: React.FC<FormularioAdultoProps> = ({
  initialData = {},
  onSubmit,
  isLoading = false,
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

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<string>('personales');

  const validateForm = (): boolean => {
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

    setErrors(newErrors);

    // Como el botón de envío solo vive en "Firmas", llevamos al usuario
    // a la pestaña del primer error para que no parezca que no pasa nada.
    const tabDeErrores: Array<[string, string[]]> = [
      [
        'personales',
        ['nombre_completo', 'dui', 'email', 'fecha_nacimiento', 'telefono_celular'],
      ],
      ['seguro', ['seguro_suma_asegurada']],
      ['firma', ['firma']],
    ];
    const primeraTab = tabDeErrores.find(([, claves]) =>
      claves.some((k) => newErrors[k])
    )?.[0];
    if (primeraTab) setActiveTab(primeraTab);

    return Object.keys(newErrors).length === 0;
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
    if (!validateForm()) return;
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

  const arrText = (v?: string[]) => (v || []).join('\n');
  const bool = (v?: boolean) => v || false;
  const txt = (v?: string | number) => v ?? '';

  const ramaValue = (formData.rama || '').trim();
  const esRamaConRoles = RAMAS_CON_ROLES.includes(ramaValue);
  const esComite = ramaValue.toLowerCase().includes('comit');

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">
        Ficha de Adultos Voluntarios - Grupo Scout No. 1 &quot;Los Intrépidos&quot;
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Control de ficha */}
      {activeTab === 'ficha' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
            <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-gray-900">
                Rol en la rama
              </h3>
              <div className="flex flex-wrap gap-6">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Field label="Nombre Completo" required error={errors.nombre_completo}>
            <input
              type="text"
              name="nombre_completo"
              value={formData.nombre_completo}
              onChange={handleChange}
              className={inputCls(errors.nombre_completo)}
            />
          </Field>
          <Field label="DUI" required error={errors.dui}>
            <input
              type="text"
              name="dui"
              placeholder="XXXXXXXX-X"
              value={formData.dui}
              onChange={handleChange}
              className={inputCls(errors.dui)}
            />
          </Field>
          <Field label="Email" required error={errors.email}>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={inputCls(errors.email)}
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
              className={inputCls(errors.fecha_nacimiento)}
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
              className={inputCls(errors.telefono_celular)}
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
          <div className="md:col-span-2">
            <Field label="Grupo familiar (una persona por línea)">
              <textarea
                name="grupo_familiar"
                value={arrText(formData.grupo_familiar)}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
              className={inputCls(errors.seguro_suma_asegurada)}
            />
          </Field>
          <div className="flex items-end pb-2">
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
        <div className="space-y-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-4 text-gray-900">
              Condiciones médicas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <div className="space-y-4 mb-6">
          <Field label="Grupos previos (uno por línea)">
            <textarea
              name="grupos_previos"
              value={arrText(formData.grupos_previos)}
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
              value={arrText(formData.formacion_scout)}
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
              value={arrText(formData.referencias)}
              onChange={(e) => handleArrayChange('referencias', e.target.value)}
              rows={3}
              className={inputCls()}
            />
          </Field>
        </div>
      )}

      {/* Tab: Documentos */}
      {activeTab === 'documentos' && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold mb-4 text-gray-900">
            Checklist de documentos entregados
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
        <div className="space-y-6 mb-6">
          {errors.firma && (
            <p className="text-red-500 text-sm bg-red-50 border border-red-200 px-3 py-2 rounded">
              {errors.firma}
            </p>
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
              <p className="text-green-600 text-sm mt-2">
                ✓ Firma capturada correctamente
              </p>
            )}
          </div>
        </div>
      )}

      {/* Botones: solo visibles en la pestaña de Firmas para evitar
          que se envíe el formulario sin completar el resto */}
      {activeTab === 'firma' && (
        <div className="flex gap-4 mt-8">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
          >
            {isLoading ? 'Enviando...' : 'Enviar Formulario'}
          </button>
        </div>
      )}

      {errors.submit && (
        <p className="text-red-500 mt-4">{errors.submit}</p>
      )}
    </form>
  );
};

export default FormularioAdulto;
