#!/bin/bash
# Script para normalizar DATABASE_URL antes de rodar Prisma
if [ -z "$DATABASE_URL" ] && [ -n "$URL_DO_BANCO_DE_DADOS" ]; then
  export DATABASE_URL="$URL_DO_BANCO_DE_DADOS"
  echo "📝 Normalizado: URL_DO_BANCO_DE_DADOS → DATABASE_URL"
fi

