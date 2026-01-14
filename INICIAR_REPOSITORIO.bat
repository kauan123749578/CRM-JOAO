@echo off
echo ========================================
echo   Inicializando Repositorio Git - CRM v2
echo ========================================
echo.

echo [1/5] Verificando Git...
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Git nao encontrado no PATH!
    echo Por favor, reinicie o terminal ou adicione Git ao PATH
    echo Ou use Git Bash/Git CMD
    pause
    exit /b 1
)
git --version
echo OK: Git encontrado
echo.

echo [2/5] Inicializando repositorio Git...
if exist ".git" (
    echo AVISO: Git ja foi inicializado
    echo Continuando...
) else (
    git init
    git branch -M main
    echo OK: Repositorio inicializado
)
echo.

echo [3/5] Verificando arquivos que serao adicionados...
echo.
echo Arquivos que SERAO commitados:
echo ----------------------------------------
git add --dry-run . 2>nul
if %errorlevel% neq 0 (
    echo Usando metodo alternativo...
    dir /s /b /a-d | findstr /V "node_modules" | findstr /V ".git" | findstr /V ".wwebjs_auth" | findstr /V ".env" | findstr /V "dist" | findstr /V ".log" | findstr /V "Thumbs.db" | findstr /V ".DS_Store" | findstr /V ".cache" | findstr /V ".tmp" | findstr /V ".temp"
)
echo ----------------------------------------
echo.

echo [4/5] Adicionando arquivos ao Git...
git add .
if %errorlevel% neq 0 (
    echo ERROR: Falha ao adicionar arquivos
    pause
    exit /b 1
)
echo OK: Arquivos adicionados
echo.

echo [5/5] Status do repositorio:
echo ----------------------------------------
git status --short | findstr /V "^$" | Select-Object -First 30
echo ----------------------------------------
echo.

echo ========================================
echo   Proximos passos:
echo ========================================
echo.
echo 1. Criar repositorio no GitHub:
echo    https://github.com/new
echo    Nome: crm-whatsapp-v2
echo    NAO marque "Initialize with README"
echo.
echo 2. Conectar ao GitHub:
echo    git remote add origin https://github.com/SEU-USUARIO/crm-whatsapp-v2.git
echo.
echo 3. Fazer primeiro commit:
echo    git commit -m "feat: CRM WhatsApp v2 - Sistema completo"
echo.
echo 4. Fazer push:
echo    git push -u origin main
echo.
echo Veja ARQUIVOS_PARA_COMMITAR.md para lista completa!
echo.
pause



