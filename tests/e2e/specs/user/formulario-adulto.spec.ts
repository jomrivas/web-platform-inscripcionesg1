// tests/e2e/specs/user/formulario-adulto.spec.ts
// Pruebas E2E del formulario de Adulto Voluntario.
//
// El test "envía la ficha con tipo de ficha, rama y traslado de emergencia"
// requiere que la base tenga aplicada la migración
// supabase/migrations/0004_fix_adult_form_constraints.sql. Si no está aplicada,
// el test se marca como skipped (se autocancela) en lugar de fallar.

import { test, expect } from '../../fixtures';
import { adultoData } from '../../utils/testData';
import { adultConstraintsAllowExtended } from '../../utils/supabaseAdmin';

test.describe('Formulario de Adulto Voluntario', () => {
  test.beforeEach(async ({ formularioAdultoPage }) => {
    await formularioAdultoPage.goto();
  });

  test('muestra los errores de validación al enviar el formulario vacío', async ({
    formularioAdultoPage,
  }) => {
    await formularioAdultoPage.submit();

    await expect(
      formularioAdultoPage.errorText('El nombre es requerido')
    ).toBeVisible();
    await expect(
      formularioAdultoPage.errorText('El DUI es requerido')
    ).toBeVisible();
    await expect(
      formularioAdultoPage.errorText('El email es requerido')
    ).toBeVisible();
    await expect(
      formularioAdultoPage.errorText('La fecha de nacimiento es requerida')
    ).toBeVisible();
    await expect(
      formularioAdultoPage.errorText('El teléfono es requerido')
    ).toBeVisible();
  });

  test('rechaza un DUI con formato inválido', async ({
    formularioAdultoPage,
  }) => {
    await formularioAdultoPage.fillRequired({
      ...adultoData,
      dui: '123',
    });
    await formularioAdultoPage.submit();

    await expect(
      formularioAdultoPage.errorText('Formato DUI inválido (XXXXXXXX-X)')
    ).toBeVisible();
  });

  test('exige la firma del dirigente', async ({ formularioAdultoPage }) => {
    await formularioAdultoPage.fillRequired(adultoData);
    await formularioAdultoPage.submit();

    await expect(
      formularioAdultoPage.errorText(
        'La firma del dirigente es obligatoria'
      )
    ).toBeVisible();
  });

  test('envía la ficha de adulto completa correctamente', async ({
    formularioAdultoPage,
    dashboardPage,
    page,
  }) => {
    await formularioAdultoPage.fillRequired(adultoData);
    await formularioAdultoPage.fillPersonalesExtra(adultoData);

    await formularioAdultoPage.openTab('Firmas');
    await formularioAdultoPage.dirigenteSignature().sign();
    await expect(
      page.getByText('Firma capturada correctamente')
    ).toBeVisible();

    await formularioAdultoPage.submit();

    await dashboardPage.expectSubmissionSuccess();
    await expect(
      page.getByRole('cell', { name: 'Adulto Voluntario', exact: true })
    ).toBeVisible();
  });

  test('envía la ficha con tipo de ficha, rama y traslado de emergencia', async ({
    formularioAdultoPage,
    dashboardPage,
    page,
  }) => {
    const constraintsFixed = await adultConstraintsAllowExtended();
    test.skip(
      !constraintsFixed,
      'Requiere la migración 0004 (constraints de tipo_ficha/rama/estado_civil/emergencia_trasladar_a)'
    );

    await formularioAdultoPage.fillFicha(adultoData);
    await formularioAdultoPage.fillRequired(adultoData);
    await formularioAdultoPage.fillPersonalesExtra(adultoData);
    await formularioAdultoPage.fillMedicos(adultoData);

    await formularioAdultoPage.openTab('Firmas');
    await formularioAdultoPage.dirigenteSignature().sign();

    await formularioAdultoPage.submit();

    await dashboardPage.expectSubmissionSuccess();
    await expect(
      page.getByRole('cell', { name: 'Adulto Voluntario', exact: true })
    ).toBeVisible();
  });
});
