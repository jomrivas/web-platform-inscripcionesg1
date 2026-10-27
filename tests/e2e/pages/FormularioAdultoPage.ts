// tests/e2e/pages/FormularioAdultoPage.ts
import { Locator, Page, expect } from '@playwright/test';
import { SignaturePad } from './SignaturePad';

export type AdultoTab =
  | 'Ficha'
  | 'Datos Personales'
  | 'Seguro / Emergencia'
  | 'Datos Médicos'
  | 'Trayectoria Scout'
  | 'Documentos'
  | 'Firmas';

export class FormularioAdultoPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', {
      name: /Ficha de Adultos Voluntarios/,
    });
    this.submitButton = page.getByRole('button', {
      name: 'Enviar Formulario',
    });
  }

  async goto() {
    await this.page.goto('/dashboard/nuevo-formulario/adulto');
    await expect(this.heading).toBeVisible();
  }

  tab(name: AdultoTab): Locator {
    return this.page.getByRole('button', { name, exact: true });
  }

  async openTab(name: AdultoTab) {
    await this.tab(name).click();
  }

  field(name: string): Locator {
    return this.page.locator(`[name="${name}"]`);
  }

  async fillRequired(data: {
    nombre_completo: string;
    dui: string;
    email: string;
    fecha_nacimiento: string;
    telefono_celular: string;
  }) {
    await this.openTab('Datos Personales');
    await this.field('nombre_completo').fill(data.nombre_completo);
    await this.field('dui').fill(data.dui);
    await this.field('email').fill(data.email);
    await this.field('fecha_nacimiento').fill(data.fecha_nacimiento);
    await this.field('telefono_celular').fill(data.telefono_celular);
  }

  async fillFicha(data: {
    tipo_ficha?: string;
    rama?: string;
    sexo?: string;
    estado_civil?: string;
    tipo_sangre?: string;
  }) {
    await this.openTab('Ficha');
    if (data.tipo_ficha) {
      await this.field('tipo_ficha').selectOption(data.tipo_ficha);
    }
    if (data.rama) await this.field('rama').fill(data.rama);
  }

  async fillPersonalesExtra(data: {
    sexo?: string;
    estado_civil?: string;
    tipo_sangre?: string;
  }) {
    await this.openTab('Datos Personales');
    if (data.sexo) await this.field('sexo').selectOption(data.sexo);
    if (data.estado_civil) {
      await this.field('estado_civil').selectOption(data.estado_civil);
    }
    if (data.tipo_sangre) {
      await this.field('tipo_sangre').selectOption(data.tipo_sangre);
    }
  }

  async fillMedicos(data: { emergencia_trasladar_a?: string }) {
    await this.openTab('Datos Médicos');
    if (data.emergencia_trasladar_a) {
      await this.field('emergencia_trasladar_a').fill(
        data.emergencia_trasladar_a
      );
    }
  }

  dirigenteSignature(): SignaturePad {
    return new SignaturePad(this.page, 'Firma del Dirigente');
  }

  async submit() {
    await this.openTab('Firmas');
    await this.submitButton.click();
  }

  errorText(message: string): Locator {
    return this.page.getByText(message, { exact: true }).first();
  }
}
