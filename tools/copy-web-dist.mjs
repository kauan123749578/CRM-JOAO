import { cp, mkdir, rm, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.resolve(__dirname, '..');
const src = path.join(root, 'apps', 'web', 'dist');
const dest = path.join(root, 'apps', 'backend', 'public');

if (!existsSync(src)) {
  console.error(`[copy-web] ❌ dist não encontrado em: ${src}`);
  process.exit(1);
}

console.log(`[copy-web] 🧹 Removendo pasta antiga: ${dest}`);
await rm(dest, { recursive: true, force: true });

console.log(`[copy-web] 📋 Copiando de ${src} para ${dest}`);
await mkdir(dest, { recursive: true });
await cp(src, dest, { recursive: true });

// Verificar e corrigir index.html se necessário
const indexPath = path.join(dest, 'index.html');
if (existsSync(indexPath)) {
  const indexContent = await readFile(indexPath, 'utf-8');
  
  // Se ainda tiver o título antigo, corrigir
  if (indexContent.includes('CRM WhatsApp v2') || indexContent.includes('CRM WhatsApp')) {
    console.log(`[copy-web] ⚠️  Detectado título antigo no index.html, corrigindo...`);
    const corrected = indexContent
      .replace(/<title>.*?<\/title>/i, '<title>JOÃO FORNECEDOR - Gestão VIP</title>')
      .replace(/CRM WhatsApp v2/gi, 'JOÃO FORNECEDOR - Gestão VIP')
      .replace(/CRM WhatsApp/gi, 'JOÃO FORNECEDOR');
    await writeFile(indexPath, corrected, 'utf-8');
    console.log(`[copy-web] ✅ index.html corrigido!`);
  } else if (indexContent.includes('JOÃO FORNECEDOR')) {
    console.log(`[copy-web] ✅ index.html já está correto!`);
  }
  
  // Mostrar primeiras linhas para debug
  console.log(`[copy-web] 📄 Primeiras linhas do index.html:`);
  console.log(indexContent.split('\n').slice(0, 8).join('\n'));
}

console.log(`[copy-web] ✅ Copiado com sucesso: ${src} -> ${dest}`);




