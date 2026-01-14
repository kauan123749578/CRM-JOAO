#!/bin/bash
set -e

echo "🧹 Limpando arquivos antigos..."
npm run clean || true

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
  ls -la apps/backend/public/ | head -10
else
  echo "❌ ERRO: Frontend não foi copiado!"
  exit 1
fi

