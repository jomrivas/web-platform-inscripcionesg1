// tests/e2e/pages/FormularioBeneficiarioPage.ts
import { Locator, Page, expect } from '@playwright/test';
import { SignaturePad } from './SignaturePad';

export type BeneficiarioTab =
  | 'Datos Personales'
  | 'Padres/Tutores'
  | 'Escolaridad'
  | 'Datos Médicos'
  | 'Firmas';

export class FormularioBeneficiarioPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', {
      name: /Ficha de Afiliación/,
    });
    this.submitButton = page.getByRole('button', {
      name: 'Enviar Formulario',
    });
  }

  async goto() {
    await this.page.goto('/dashboard/nuevo-formulario/beneficiario');
    await expect(this.heading).toBeVisible();
  }

  tab(name: BeneficiarioTab): Locator {
    return this.page.getByRole('button', { name, exact: true });
  }

  async openTab(name: BeneficiarioTab) {
    await this.tab(name).click();
  }

  field(name: string): Locator {
    return this.page.locator(`[name="${name}"]`);
  }

  async fillPersonales(data: {
    nombre_completo: string;
    fecha_nacimiento: string;
    direccion: string;
    rama_inscripcion?: string;
    sexo?: string;
    tipo_sangre?: string;
    telefono_celular?: string;
  }) {
    await this.openTab('Datos Personales');
    await this.field('nombre_completo').fill(data.nombre_completo);
    await this.field('fecha_nacimiento').fill(data.fecha_nacimiento);
    await this.field('direccion').fill(data.direccion);
    if (data.rama_inscripcion) {
      await this.field('rama_inscripcion').selectOption(data.rama_inscripcion);
    }
    if (data.sexo) await this.field('sexo').selectOption(data.sexo);
    if (data.tipo_sangre) {
      await this.field('tipo_sangre').selectOption(data.tipo_sangre);
    }
    if (data.telefono_celular) {
      await this.field('telefono_celular').fill(data.telefono_celular);
    }
  }

  async fillTutor(data: { madre_nombre?: string; padre_nombre?: string }) {
    await this.openTab('Padres/Tutores');
    if (data.madre_nombre) {
      await this.field('madre_nombre').fill(data.madre_nombre);
    }
    if (data.padre_nombre) {
      await this.field('padre_nombre').fill(data.padre_nombre);
    }
  }

  firmaPadre(): SignaturePad {
    return new SignaturePad(this.page, 'Firma de Padre o Tutor');
  }

  firmaMadre(): SignaturePad {
    return new SignaturePad(this.page, 'Firma de Madre o Tutora');
  }

  async submit() {
    await this.openTab('Firmas');
    await this.submitButton.click();
  }

  errorText(message: string): Locator {
    return this.page.getByText(message, { exact: true }).first();
  }
}
