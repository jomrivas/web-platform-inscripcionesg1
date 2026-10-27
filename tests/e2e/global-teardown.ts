// tests/e2e/global-teardown.ts
// Limpia los datos de prueba (inscripciones + usuario E2E_TEST_).
import { adminClient, deleteTestUser } from './utils/supabaseAdmin';
import { TEST_USER } from './utils/testData';

export default async function globalTeardown() {
  const supabase = adminClient();
  await deleteTestUser(supabase, TEST_USER.email);
  console.log(`[e2e] Teardown: usuario ${TEST_USER.email} eliminado`);
}
