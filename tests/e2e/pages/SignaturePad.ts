// tests/e2e/pages/SignaturePad.ts
// Component Object que encapsula <SignaturePad /> (canvas + botón Guardar firma).
import { Locator, Page, expect } from '@playwright/test';

export class SignaturePad {
  readonly page: Page;
  readonly container: Locator;
  readonly canvas: Locator;
  readonly saveButton: Locator;

  constructor(page: Page, label: string) {
    this.page = page;
    this.container = page.locator('.signature-pad-container', {
      hasText: label,
    });
    this.canvas = this.container.locator('canvas');
    this.saveButton = this.container.getByRole('button', {
      name: 'Guardar firma',
    });
  }

  async expectVisible() {
    await expect(this.canvas).toBeVisible();
  }

  // Dibuja un trazo en el canvas y guarda la firma.
  async sign() {
    await this.expectVisible();
    const box = await this.canvas.boundingBox();
    if (!box) throw new Error('El canvas de firma no tiene bounding box');

    const x = (factor: number) => box.x + box.width * factor;
    const y = (factor: number) => box.y + box.height * factor;

    await this.page.mouse.move(x(0.15), y(0.5));
    await this.page.mouse.down();
    await this.page.mouse.move(x(0.35), y(0.25), { steps: 8 });
    await this.page.mouse.move(x(0.5), y(0.75), { steps: 8 });
    await this.page.mouse.move(x(0.7), y(0.3), { steps: 8 });
    await this.page.mouse.move(x(0.85), y(0.6), { steps: 8 });
    await this.page.mouse.up();

    await this.saveButton.click();
  }
}
