// tests/e2e/specs/user/formulario-beneficiario.spec.ts
// Pruebas E2E del formulario de Beneficiario.

import { test, expect } from '../../fixtures';
import { beneficiarioData } from '../../utils/testData';

test.describe('Formulario de Beneficiario', () => {
  test.beforeEach(async ({ formularioBeneficiarioPage }) => {
    await formularioBeneficiarioPage.goto();
  });

  test('muestra los errores de validación al enviar el formulario vacío', async ({
    formularioBeneficiarioPage,
  }) => {
    await formularioBeneficiarioPage.submit();

    await expect(
      formularioBeneficiarioPage.errorText('El nombre es requerido')
    ).toBeVisible();
    await expect(
      formularioBeneficiarioPage.errorText(
        'La fecha de nacimiento es requerida'
      )
    ).toBeVisible();
    await expect(
      formularioBeneficiarioPage.errorText('La dirección es requerida')
    ).toBeVisible();
  });

  test('exige al menos un tutor (madre o padre)', async ({
    formularioBeneficiarioPage,
  }) => {
    await formularioBeneficiarioPage.fillPersonales(beneficiarioData);
    await formularioBeneficiarioPage.submit();

    await expect(
      formularioBeneficiarioPage.errorText(
        'Debes ingresar al menos un tutor (madre o padre)'
      )
    ).toBeVisible();
  });

  test('exige al menos una firma de tutor', async ({
    formularioBeneficiarioPage,
  }) => {
    await formularioBeneficiarioPage.fillPersonales(beneficiarioData);
    await formularioBeneficiarioPage.fillTutor(beneficiarioData);
    await formularioBeneficiarioPage.submit();

    await expect(
      formularioBeneficiarioPage.errorText(
        'Se requiere al menos una firma de tutor (padre o madre)'
      )
    ).toBeVisible();
  });

  test('envía la ficha de beneficiario completa correctamente', async ({
    formularioBeneficiarioPage,
    dashboardPage,
    page,
  }) => {
    await formularioBeneficiarioPage.fillPersonales(beneficiarioData);
    await formularioBeneficiarioPage.fillTutor(beneficiarioData);

    await formularioBeneficiarioPage.openTab('Firmas');
    await formularioBeneficiarioPage.firmaPadre().sign();

    await formularioBeneficiarioPage.submit();

    await dashboardPage.expectSubmissionSuccess();
    await expect(
      page.getByRole('cell', { name: 'Beneficiario', exact: true })
    ).toBeVisible();
  });
});
