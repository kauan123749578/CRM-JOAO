# Script para rodar JOÃO FORNECEDOR localmente (pasta crm-v2)
Write-Host "🚀 Iniciando JOÃO FORNECEDOR localmente..." -ForegroundColor Yellow
Write-Host "📁 Pasta: crm-v2" -ForegroundColor Cyan

# Verificar se .env existe
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Arquivo .env não encontrado!" -ForegroundColor Red
    Write-Host "📝 Criando .env a partir de env.example.txt..." -ForegroundColor Yellow
    Copy-Item "env.example.txt" ".env"
    Write-Host "✅ Arquivo .env criado. Configure as variáveis antes de continuar!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Pressione qualquer tecla após configurar o .env..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Instalar dependências se necessário
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
    npm install
}

# Build do backend primeiro (necessário para db:init)
Write-Host "🏗️  Compilando backend..." -ForegroundColor Yellow
npm run build -w @crm/backend

# Gerar Prisma
Write-Host "🔧 Gerando cliente Prisma..." -ForegroundColor Yellow
npm run prisma:generate -w @crm/backend

# Push do banco
Write-Host "🗄️  Sincronizando banco de dados..." -ForegroundColor Yellow
npm run db:push -w @crm/backend

# Inicializar banco
Write-Host "👤 Criando usuário admin..." -ForegroundColor Yellow
npm run db:init -w @crm/backend

Write-Host ""
Write-Host "✅ Configuração concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "Escolha como rodar:" -ForegroundColor Cyan
Write-Host "1. Desenvolvimento (Backend + Frontend separados - recomendado)"
Write-Host "2. Produção (Build completo - como no Railway)"
Write-Host ""
$opcao = Read-Host "Digite 1 ou 2"

if ($opcao -eq "1") {
    Write-Host ""
    Write-Host "🚀 Iniciando em modo desenvolvimento..." -ForegroundColor Green
    Write-Host "📝 Abra 2 terminais:" -ForegroundColor Yellow
    Write-Host "   Terminal 1: npm run dev -w @crm/backend" -ForegroundColor Cyan
    Write-Host "   Terminal 2: npm run dev -w @crm/web" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Frontend: http://localhost:5173" -ForegroundColor Green
    Write-Host "Backend:  http://localhost:8080" -ForegroundColor Green
    Write-Host ""
    Write-Host "Pressione qualquer tecla para iniciar o backend..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    npm run dev -w @crm/backend
} else {
    Write-Host ""
    Write-Host "🏗️  Fazendo build completo..." -ForegroundColor Yellow
    npm run build
    
    Write-Host ""
    Write-Host "🚀 Iniciando servidor..." -ForegroundColor Green
    Write-Host "Aplicação disponível em: http://localhost:8080" -ForegroundColor Green
    npm start
}

