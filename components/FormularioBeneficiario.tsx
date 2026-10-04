// components/FormularioBeneficiario.tsx
'use client';

import React, { useState } from 'react';
import SignaturePad from './SignaturePad';

interface FormDataBeneficiario {
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
}

const FormularioBeneficiario: React.FC<FormularioBeneficiarioProps> = ({
  initialData = {},
  onSubmit,
  isLoading = false,
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
  const [activeTab, setActiveTab] = useState('personales');

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre_completo.trim())
      newErrors.nombre_completo = 'El nombre es requerido';
    if (!formData.fecha_nacimiento)
      newErrors.fecha_nacimiento = 'La fecha de nacimiento es requerida';
    if (!formData.direccion.trim())
      newErrors.direccion = 'La dirección es requerida';
    if (!formData.madre_nombre?.trim() && !formData.padre_nombre?.trim())
      newErrors.tutor = 'Debes ingresar al menos un tutor (madre o padre)';
    if (
      !formData.firma_padre_tutor?.trim() &&
      !formData.firma_madre_tutora?.trim()
    )
      newErrors.firma =
        'Se requiere al menos una firma de tutor (padre o madre)';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
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

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">
        Ficha de Afiliación - Beneficiario
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b overflow-x-auto">
        {['personales', 'tutores', 'escolaridad', 'medicos', 'firma'].map(
          (tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              {tab === 'personales' && 'Datos Personales'}
              {tab === 'tutores' && 'Padres/Tutores'}
              {tab === 'escolaridad' && 'Escolaridad'}
              {tab === 'medicos' && 'Datos Médicos'}
              {tab === 'firma' && 'Firmas'}
            </button>
          )
        )}
      </div>

      {/* Tab: Datos Personales */}
      {activeTab === 'personales' && (
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rama de Inscripción *
            </label>
            <select
              name="rama_inscripcion"
              value={formData.rama_inscripcion}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="manada_7_10">Manada (7 a 10 años)</option>
              <option value="scouts_11_14">Scouts (11 a 14 años)</option>
              <option value="caminantes_15_17">Caminantes (15 a 17 años)</option>
              <option value="rovers_18_21">Rovers (18 a 21 años)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre Completo *
              </label>
              <input
                type="text"
                name="nombre_completo"
                value={formData.nombre_completo}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                  errors.nombre_completo ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.nombre_completo && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.nombre_completo}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Nacimiento *
              </label>
              <input
                type="date"
                name="fecha_nacimiento"
                value={formData.fecha_nacimiento}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                  errors.fecha_nacimiento
                    ? 'border-red-500'
                    : 'border-gray-300'
                }`}
              />
              {errors.fecha_nacimiento && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.fecha_nacimiento}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sexo
              </label>
              <select
                name="sexo"
                value={formData.sexo}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                DUI (solo Rovers)
              </label>
              <input
                type="text"
                name="dui_numero"
                value={formData.dui_numero || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección *
              </label>
              <input
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                  errors.direccion ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.direccion && (
                <p className="text-red-500 text-sm mt-1">{errors.direccion}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ciudad
              </label>
              <input
                type="text"
                name="ciudad"
                value={formData.ciudad || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Departamento
              </label>
              <input
                type="text"
                name="departamento"
                value={formData.departamento || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono Celular
              </label>
              <input
                type="tel"
                name="telefono_celular"
                value={formData.telefono_celular || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Sangre
              </label>
              <select
                name="tipo_sangre"
                value={formData.tipo_sangre || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Seleccionar...</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Padres/Tutores */}
      {activeTab === 'tutores' && (
        <div className="space-y-6 mb-6">
          {errors.tutor && (
            <p className="text-red-500 text-sm">{errors.tutor}</p>
          )}

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Madre o Tutora</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="madre_nombre"
                placeholder="Nombre completo"
                value={formData.madre_nombre || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <input
                type="text"
                name="madre_dui"
                placeholder="DUI"
                value={formData.madre_dui || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <input
                type="tel"
                name="madre_telefono_celular"
                placeholder="Teléfono celular"
                value={formData.madre_telefono_celular || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <input
                type="email"
                name="madre_email"
                placeholder="Email"
                value={formData.madre_email || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Padre o Tutor</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="padre_nombre"
                placeholder="Nombre completo"
                value={formData.padre_nombre || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <input
                type="text"
                name="padre_documento"
                placeholder="Documento"
                value={formData.padre_documento || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <input
                type="tel"
                name="padre_telefono_celular"
                placeholder="Teléfono celular"
                value={formData.padre_telefono_celular || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <input
                type="email"
                name="padre_email"
                placeholder="Email"
                value={formData.padre_email || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              En caso de emergencia llamar a:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="emergencia_contacto"
                placeholder="Nombre de contacto"
                value={formData.emergencia_contacto || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <input
                type="tel"
                name="emergencia_telefono"
                placeholder="Teléfono"
                value={formData.emergencia_telefono || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab: Escolaridad */}
      {activeTab === 'escolaridad' && (
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Centro de Estudios
            </label>
            <input
              type="text"
              name="escuela_nombre"
              value={formData.escuela_nombre || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Año Escolar Actual
            </label>
            <input
              type="text"
              name="ano_escolar_actual"
              value={formData.ano_escolar_actual || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="sabe_nadar"
              checked={formData.sabe_nadar || false}
              onChange={handleChange}
              className="mr-2"
            />
            <span className="text-sm">Sabe nadar</span>
          </label>
        </div>
      )}

      {/* Tab: Médicos */}
      {activeTab === 'medicos' && (
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alergias
            </label>
            <textarea
              name="alergias"
              value={formData.alergias || ''}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Medicamentos Permanentes
            </label>
            <textarea
              name="medicamentos_permanentes"
              value={formData.medicamentos_permanentes || ''}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Discapacidad
            </label>
            <textarea
              name="discapacidad"
              value={formData.discapacidad || ''}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones Adicionales
            </label>
            <textarea
              name="observaciones_adicionales"
              value={formData.observaciones_adicionales || ''}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
          <SignaturePad
            label="Firma de Padre o Tutor *"
            onSignatureCapture={(data, type) =>
              setFormData((prev) => ({
                ...prev,
                firma_padre_tutor: data,
                firma_tipo_padre: type,
              }))
            }
          />
          <SignaturePad
            label="Firma de Madre o Tutora"
            onSignatureCapture={(data, type) =>
              setFormData((prev) => ({
                ...prev,
                firma_madre_tutora: data,
                firma_tipo_madre: type,
              }))
            }
          />
        </div>
      )}

      <div className="flex gap-4 mt-8">
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
        >
          {isLoading ? 'Enviando...' : 'Enviar Formulario'}
        </button>
      </div>

      {errors.submit && <p className="text-red-500 mt-4">{errors.submit}</p>}
    </form>
  );
};

export default FormularioBeneficiario;
