import { cp, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.resolve(__dirname, '..');
const src = path.join(root, 'apps', 'web', 'dist');
const dest = path.join(root, 'apps', 'backend', 'public');

if (!existsSync(src)) {
  console.error(`[copy-web] dist não encontrado em: ${src}`);
  process.exit(1);
}

await rm(dest, { recursive: true, force: true });
await mkdir(dest, { recursive: true });
await cp(src, dest, { recursive: true });

console.log(`[copy-web] copiado: ${src} -> ${dest}`);




