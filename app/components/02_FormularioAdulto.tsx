'use client';

import React, { useState } from 'react';
import SignaturePad from './SignaturePad';

interface FormDataAdulto {
  // Control de Ficha
  fecha_ficha?: string;
  tipo_ficha?: string;
  rama?: string;
  responsable?: string;
  asistente?: string;
  comite_grupo?: string;
  cargo?: string;

  // Datos Personales
  nombre_completo: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  lugar_nacimiento: string;
  fecha_nacimiento: string;
  dui: string;
  nis?: string;
  sexo: string;
  telefono_casa?: string;
  telefono_oficina?: string;
  telefono_celular: string;
  religion?: string;
  estado_civil?: string;
  profesion?: string;
  lugar_trabajo?: string;
  email: string;
  tipo_sangre?: string;

  // Seguro Médico
  aseguradora_nombre?: string;
  seguro_vigencia?: string;
  seguro_suma_asegurada?: string;

  // Datos Médicos
  medicamentos_permanentes?: string;
  hipertenso?: boolean;
  diabetico_insulina?: boolean;
  alergico_a?: string;
  discapacidad?: string;
  observaciones_adicionales?: string;

  // Firmas
  firma_responsable_grupo?: string;
  firma_tipo_responsable_grupo?: 'canvas' | 'image';
}

interface FormularioAdultoProps {
  initialData?: Partial<FormDataAdulto>;
  onSubmit: (data: FormDataAdulto) => Promise<void>;
  isLoading?: boolean;
}

const FormularioAdulto: React.FC<FormularioAdultoProps> = ({
  initialData = {},
  onSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<FormDataAdulto>({
    nombre_completo: initialData.nombre_completo || '',
    direccion: initialData.direccion || '',
    ciudad: initialData.ciudad || '',
    departamento: initialData.departamento || '',
    lugar_nacimiento: initialData.lugar_nacimiento || '',
    fecha_nacimiento: initialData.fecha_nacimiento || '',
    dui: initialData.dui || '',
    sexo: initialData.sexo || 'masculino',
    telefono_celular: initialData.telefono_celular || '',
    email: initialData.email || '',
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('personales');

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre_completo.trim())
      newErrors.nombre_completo = 'El nombre es requerido';
    if (!formData.dui.trim())
      newErrors.dui = 'El DUI es requerido';
    if (!/^\d{8}-\d{1}$/.test(formData.dui))
      newErrors.dui = 'Formato DUI inválido (XXXXXXXX-X)';
    if (!formData.email.trim())
      newErrors.email = 'El email es requerido';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = 'Email inválido';
    if (!formData.fecha_nacimiento)
      newErrors.fecha_nacimiento = 'La fecha de nacimiento es requerida';
    if (!formData.telefono_celular.trim())
      newErrors.telefono_celular = 'El teléfono es requerido';

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

    // Limpiar error del campo
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSignatureCapture = (data: string, type: 'canvas' | 'image') => {
    setFormData((prev) => ({
      ...prev,
      firma_responsable_grupo: data,
      firma_tipo_responsable_grupo: type,
    }));
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
        Ficha de Adultos Voluntarios - Clan Maya G1
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {['personales', 'medicos', 'firma'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            {tab === 'personales' && 'Datos Personales'}
            {tab === 'medicos' && 'Datos Médicos'}
            {tab === 'firma' && 'Firma Digital'}
          </button>
        ))}
      </div>

      {/* Tab: Datos Personales */}
      {activeTab === 'personales' && (
        <div className="space-y-6 mb-6">
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
                DUI *
              </label>
              <input
                type="text"
                name="dui"
                placeholder="XXXXXXXX-X"
                value={formData.dui}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                  errors.dui ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.dui && (
                <p className="text-red-500 text-sm mt-1">{errors.dui}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
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
                Teléfono Celular *
              </label>
              <input
                type="tel"
                name="telefono_celular"
                value={formData.telefono_celular}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                  errors.telefono_celular
                    ? 'border-red-500'
                    : 'border-gray-300'
                }`}
              />
              {errors.telefono_celular && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.telefono_celular}
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
                Dirección
              </label>
              <input
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ciudad
              </label>
              <input
                type="text"
                name="ciudad"
                value={formData.ciudad}
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
                value={formData.departamento}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Profesión
              </label>
              <input
                type="text"
                name="profesion"
                value={formData.profesion}
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

      {/* Tab: Datos Médicos */}
      {activeTab === 'medicos' && (
        <div className="space-y-6 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-4">Condiciones Médicas</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="hipertenso"
                  checked={formData.hipertenso || false}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="text-sm">Hipertenso</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="diabetico_insulina"
                  checked={formData.diabetico_insulina || false}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="text-sm">Diabético/Insulina</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alérgico a:
            </label>
            <textarea
              name="alergico_a"
              value={formData.alergico_a || ''}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Medicamentos Permanentes:
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
              Observaciones Adicionales:
            </label>
            <textarea
              name="observaciones_adicionales"
              value={formData.observaciones_adicionales || ''}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      )}

      {/* Tab: Firma */}
      {activeTab === 'firma' && (
        <div className="mb-6">
          <SignaturePad
            onSignatureCapture={handleSignatureCapture}
            label="Firma del Adulto"
          />
        </div>
      )}

      {/* Botones */}
      <div className="flex gap-4 mt-8">
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
        >
          {isLoading ? 'Enviando...' : 'Enviar Formulario'}
        </button>
      </div>

      {errors.submit && (
        <p className="text-red-500 mt-4">{errors.submit}</p>
      )}
    </form>
  );
};

export default FormularioAdulto;
