# Script para preparar novo repositório limpo
Write-Host "🚀 Preparando novo repositório JOÃO FORNECEDOR..." -ForegroundColor Green
Write-Host ""

# Voltar para a pasta crm-v2
$crmV2Path = Join-Path $PSScriptRoot "."
Set-Location $crmV2Path

Write-Host "📁 Pasta atual: $crmV2Path" -ForegroundColor Cyan
Write-Host ""

# Verificar se já existe .git
if (Test-Path ".git") {
    Write-Host "⚠️  Git já inicializado. Removendo..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force .git
    Write-Host "✅ Git antigo removido" -ForegroundColor Green
}

# Inicializar novo Git
Write-Host ""
Write-Host "🔧 Inicializando novo repositório Git..." -ForegroundColor Yellow
git init
git branch -M main

# Criar .gitignore se não existir
if (-not (Test-Path ".gitignore")) {
    Write-Host "📝 Criando .gitignore..." -ForegroundColor Yellow
    @"
# Dependencies
node_modules/
/.pnp
.pnp.js

# Production builds
apps/backend/dist/
apps/web/dist/

# Environment variables
.env
.env.local
.env*.local

# Logs
*.log
npm-debug.log*
yarn-debug.log*

# WhatsApp session
.wwebjs_auth/
**/.wwebjs_auth/

# Cache
.cache/
*.cache

# OS files
Thumbs.db
.DS_Store

# Editor
.vscode/
.idea/
"@ | Out-File -FilePath ".gitignore" -Encoding UTF8
}

# Adicionar todos os arquivos (exceto os ignorados)
Write-Host ""
Write-Host "📦 Adicionando arquivos ao Git..." -ForegroundColor Yellow
git add .

# Mostrar status
Write-Host ""
Write-Host "📋 Arquivos que serão commitados:" -ForegroundColor Cyan
git status --short

Write-Host ""
Write-Host "✅ Preparação concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Crie um novo repositório no GitHub" -ForegroundColor White
Write-Host "2. Execute:" -ForegroundColor White
Write-Host "   git commit -m 'feat: JOÃO FORNECEDOR - CRM WhatsApp v2'" -ForegroundColor Cyan
Write-Host "   git remote add origin https://github.com/SEU-USUARIO/NOVO-REPO.git" -ForegroundColor Cyan
Write-Host "   git push -u origin main" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. No Railway:" -ForegroundColor White
Write-Host "   - Root Directory: crm-v2" -ForegroundColor Cyan
Write-Host "   - Variáveis: DATABASE_URL, JWT_SECRET, NODE_ENV, WA_DATA_PATH" -ForegroundColor Cyan

