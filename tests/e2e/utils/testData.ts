// tests/e2e/utils/testData.ts
// Datos de prueba. Todas las cadenas que se persisten usan el prefijo
// E2E_TEST_ para que el teardown pueda limpiarlas.

import './env';

export const E2E_PREFIX = 'E2E_TEST_';

export const TEST_USER = {
  email: process.env.E2E_TEST_EMAIL || 'e2e.formularios@gruposcout1.test',
  password: process.env.E2E_TEST_PASSWORD || 'E2eTest123!',
};

export const adultoData = {
  nombre_completo: `${E2E_PREFIX}Juan Rivas`,
  dui: '12345678-9',
  email: 'e2e.adulto@gruposcout1.test',
  fecha_nacimiento: '1985-04-12',
  telefono_celular: '7000-0000',
  tipo_ficha: 'nueva',
  rama: 'Manada',
  sexo: 'masculino',
  estado_civil: 'soltero',
  tipo_sangre: 'O+',
  direccion: 'Calle Principal 123',
  emergencia_trasladar_a: 'Hospital Nacional Rosales',
};

export const beneficiarioData = {
  rama_inscripcion: 'manada_7_10',
  nombre_completo: `${E2E_PREFIX}Ana Rivas`,
  fecha_nacimiento: '2016-06-15',
  sexo: 'femenino',
  direccion: 'Calle Principal 123',
  telefono_celular: '7000-1111',
  tipo_sangre: 'A+',
  madre_nombre: `${E2E_PREFIX}Maria Rivas`,
};
