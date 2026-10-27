// tests/e2e/auth.setup.ts
// Proyecto "setup": crea/actualiza el usuario de pruebas y guarda su sesión
// (storageState) para que los specs no tengan que loguearse en cada test.
import { test as setup, expect } from '@playwright/test';
import fs from 'node:fs';
import { adminClient, ensureTestUser } from './utils/supabaseAdmin';
import { AUTH_DIR, AUTH_FILE } from './utils/env';
import { TEST_USER } from './utils/testData';
import { LoginPage } from './pages/LoginPage';

setup('autenticar usuario de pruebas', async ({ page }) => {
  const supabase = adminClient();
  await ensureTestUser(supabase, TEST_USER.email, TEST_USER.password);

  const login = new LoginPage(page);
  await login.loginAndWaitForDashboard(TEST_USER.email, TEST_USER.password);
  await expect(page).toHaveURL(/\/dashboard/);

  fs.mkdirSync(AUTH_DIR, { recursive: true });
  await page.context().storageState({ path: AUTH_FILE });
});
