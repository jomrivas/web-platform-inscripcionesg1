// tests/e2e/fixtures.ts
// Extiende el test base de Playwright con los Page Objects del proyecto.
import { test as base } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { FormularioAdultoPage } from './pages/FormularioAdultoPage';
import { FormularioBeneficiarioPage } from './pages/FormularioBeneficiarioPage';

type E2EFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  formularioAdultoPage: FormularioAdultoPage;
  formularioBeneficiarioPage: FormularioBeneficiarioPage;
};

export const test = base.extend<E2EFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  formularioAdultoPage: async ({ page }, use) => {
    await use(new FormularioAdultoPage(page));
  },
  formularioBeneficiarioPage: async ({ page }, use) => {
    await use(new FormularioBeneficiarioPage(page));
  },
});

export { expect } from '@playwright/test';
