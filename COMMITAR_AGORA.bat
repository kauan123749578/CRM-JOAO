@echo off
echo ========================================
echo   COMMITAR ATUALIZACOES NO GITHUB
echo ========================================
echo.

cd /d "%~dp0"

echo [1/5] Verificando remote do Git...
git remote -v
if %errorlevel% neq 0 (
    echo.
    echo Configurando remote...
    git remote add origin https://github.com/kauan123749578/crm-whatsapp-v2.git
    echo Remote configurado!
)

echo.
echo [2/5] Adicionando arquivos modificados...
git add apps/backend/src/whatsapp/whatsapp.service.ts
git add apps/backend/package.json
git add package-lock.json
git add railway.json
git add CONFIGURAR_DATABASE_RAILWAY.md
git add COMMIT_E_CONFIGURAR.md

echo.
echo [3/5] Status dos arquivos:
git status --short

echo.
echo [4/5] Fazendo commit...
git commit -m "Melhorar tratamento de erros WhatsApp e otimizar getChats"

if %errorlevel% neq 0 (
    echo.
    echo ERRO: Falha ao fazer commit
    echo Verifique se ha mudancas para commitar
    pause
    exit /b 1
)

echo.
echo [5/5] Fazendo push para GitHub...
git push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo AVISO: Push falhou. Tentando push simples...
    git push
)

echo.
echo ========================================
echo   CONCLUIDO!
echo ========================================
echo.
echo Proximo passo: Configurar DATABASE_URL no Railway
echo Veja o arquivo: COMMIT_E_CONFIGURAR.md
echo.
pause

