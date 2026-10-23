// Crea los archivos .env a partir de los ejemplos si todavía no existen (funciona en Windows, Mac y Linux)
import { copyFileSync, existsSync } from 'node:fs';
const pairs = [
  ['apps/api/.env.example', 'apps/api/.env'],
  ['apps/web/.env.example', 'apps/web/.env.local'],
];
for (const [from, to] of pairs) {
  if (!existsSync(to)) {
    copyFileSync(from, to);
    console.log(`✓ Creado ${to}`);
  }
}
