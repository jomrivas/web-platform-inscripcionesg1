// tests/e2e/pages/DashboardPage.ts
import { Locator, Page, expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly welcomeHeading: Locator;
  readonly successBanner: Locator;

  constructor(page: Page) {
    this.page = page;
    this.welcomeHeading = page.getByRole('heading', { name: '¡Bienvenido!' });
    this.successBanner = page.getByText('¡Formulario enviado correctamente!');
  }

  async goto() {
    await this.page.goto('/dashboard');
    await expect(this.welcomeHeading).toBeVisible();
  }

  async goToNuevoFormularioAdulto() {
    await this.page.goto('/dashboard/nuevo-formulario/adulto');
  }

  async goToNuevoFormularioBeneficiario() {
    await this.page.goto('/dashboard/nuevo-formulario/beneficiario');
  }

  async goToMisInscripciones() {
    await this.page.goto('/dashboard/mis-inscripciones');
  }

  async expectSubmissionSuccess() {
    await expect(this.page).toHaveURL(/\/dashboard\/mis-inscripciones\?success=true/);
    await expect(this.successBanner).toBeVisible();
  }
}
