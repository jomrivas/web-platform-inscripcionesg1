// tests/e2e/utils/env.ts
// Carga variables de entorno (.env, .env.local, .env.test) para los procesos de
// Playwright (config, setup y specs), que NO pasan por el cargador de Next.js.
// En el shell también se pueden sobrescribir (tienen prioridad).

import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '..', '..', '..');

function loadFile(file: string) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) return;
  const text = fs.readFileSync(full, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (!match) continue;
    const key = match[1];
    let value = (match[2] ?? '').trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

for (const file of ['.env', '.env.local', '.env.test']) loadFile(file);

export const ROOT_DIR = root;
export const AUTH_DIR = path.join(root, 'tests', 'e2e', '.auth');
export const AUTH_FILE = path.join(AUTH_DIR, 'user.json');
export const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';
