#!/bin/bash
set -e

# Normalizar DATABASE_URL ANTES de tudo (Prisma precisa disso)
if [ -z "$DATABASE_URL" ] && [ -n "$URL_DO_BANCO_DE_DADOS" ]; then
  export DATABASE_URL="$URL_DO_BANCO_DE_DADOS"
  echo "📝 Usando URL_DO_BANCO_DE_DADOS como DATABASE_URL"
fi

echo "🧹 Limpando arquivos antigos..."
npm run clean || true

# Limpar cache do Vite também
echo "🧹 Limpando cache do Vite..."
rm -rf apps/web/node_modules/.vite || true
rm -rf apps/web/dist || true

echo "📦 Construindo frontend..."
npm run build -w @crm/web

echo "📋 Copiando frontend para public..."
node tools/copy-web-dist.mjs

echo "🔧 Gerando Prisma..."
npm run prisma:generate -w @crm/backend

echo "🏗️ Construindo backend..."
npm run build -w @crm/backend

echo "✅ Build completo!"
echo "🚀 Versão: João Fornecedor - $(date +%Y%m%d-%H%M%S)"

# Verificar se o frontend foi copiado
if [ -d "apps/backend/public" ] && [ "$(ls -A apps/backend/public)" ]; then
  echo "✅ Frontend copiado com sucesso para apps/backend/public"
  echo "📄 Conteúdo do index.html:"
  head -10 apps/backend/public/index.html || echo "index.html não encontrado"
  echo ""
  ls -la apps/backend/public/ | head -10
else
  echo "❌ ERRO: Frontend não foi copiado!"
  exit 1
fi

