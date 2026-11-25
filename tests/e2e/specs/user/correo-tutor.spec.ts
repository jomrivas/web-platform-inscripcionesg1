// tests/e2e/specs/user/correo-tutor.spec.ts
// Spec 005, E7/R9/A13: cada tutor registrado lleva su correo.
// El caso positivo (madre con correo, padre sin registrar) lo cubre
// "envía la ficha de beneficiario completa correctamente".

import { test, expect } from '../../fixtures';
import { beneficiarioData } from '../../utils/testData';

const sinCorreo = { ...beneficiarioData, madre_email: undefined };

test.describe('Correo obligatorio por tutor (R9)', () => {
  test('la ficha no se envía si la madre registrada no tiene correo', async ({
    formularioBeneficiarioPage,
    page,
  }) => {
    await formularioBeneficiarioPage.goto();
    await formularioBeneficiarioPage.fillPersonales(beneficiarioData);
    await formularioBeneficiarioPage.fillTutor(sinCorreo);

    await formularioBeneficiarioPage.openTab('Firmas');
    await formularioBeneficiarioPage.firmaMadre().sign();
    await formularioBeneficiarioPage.submit();

    await expect(
      formularioBeneficiarioPage.errorText('El correo de la madre o tutora es requerido')
    ).toBeVisible();
    await expect(formularioBeneficiarioPage.field('madre_email')).toHaveAttribute('aria-invalid', 'true');
    await expect(page).toHaveURL(/\/dashboard\/nuevo-formulario\/beneficiario/);
  });

  test('el servidor rechaza un tutor sin correo aunque el cliente no valide', async ({
    page,
  }) => {
    // Va directo a la API, sin pasar por la validación del formulario (C5).
    await page.goto('/dashboard');
    const response = await page.request.post('/api/inscriptions', {
      data: {
        type: 'beneficiario',
        formData: {
          ...sinCorreo,
          firma_madre_tutora: 'data:image/png;base64,iVBORw0KGgo=',
          firma_tipo_madre: 'image',
        },
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.details?.madre_email?.[0]).toBe('El correo de la madre o tutora es requerido');
  });
});
