@echo off
title EIS Dashboard Startup
echo ============================================
echo   EIS Dashboard - Local Startup Script
echo ============================================
echo.

:: Change to script directory first
cd /d "%~dp0"

:: -------------------------------------------
:: Step 0: Ensure .env exists
:: -------------------------------------------
if not exist ".env" (
    echo [0/7] Creating .env from .env.example...
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo        .env created — update credentials if needed.
    ) else (
        echo DATABASE_URL="postgresql://postgres:postgres@localhost:5432/eis_dashboard"> .env
        echo NEXTAUTH_SECRET="dev-secret-change-in-production-abc123xyz">> .env
        echo NEXTAUTH_URL="http://localhost:3000">> .env
        echo        .env created with defaults.
    )
    :: Patch the default DATABASE_URL so it matches the Docker container we create
    powershell -Command "(Get-Content .env) -replace 'postgresql://user:password@', 'postgresql://postgres:postgres@' | Set-Content .env" >nul 2>&1
) else (
    echo [0/7] .env already exists.
)
echo.

:: -------------------------------------------
:: Step 1: Check Docker
:: -------------------------------------------
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

:: -------------------------------------------
:: Step 2: Kill stale dev server
:: -------------------------------------------
echo [1/7] Cleaning up previous sessions...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000.*LISTENING" 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)
if exist ".next\dev\lock" del /f ".next\dev\lock" >nul 2>&1
echo        Done.
echo.

:: -------------------------------------------
:: Step 3: Start / create PostgreSQL container
:: -------------------------------------------
echo [2/7] Starting PostgreSQL database...

docker start eis-postgres >nul 2>&1
if %errorlevel% equ 0 (
    echo        PostgreSQL container started.
    goto :db_wait
)

docker rm eis-postgres >nul 2>&1

netstat -an | findstr ":5432.*LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARN] Port 5432 already in use. Checking Docker...
    docker ps --filter "publish=5432" --format "{{.Names}}" 2>nul | findstr /r "." >nul 2>&1
    if %errorlevel% equ 0 (
        echo        Found existing Docker container on 5432. Continuing...
        goto :db_wait
    )
    echo [ERROR] Port 5432 is in use by another process. Free it and retry.
    pause
    exit /b 1
)

echo        Creating new PostgreSQL container...
docker run -d --name eis-postgres ^
    -e POSTGRES_USER=postgres ^
    -e POSTGRES_PASSWORD=postgres ^
    -e POSTGRES_DB=eis_dashboard ^
    -p 5432:5432 ^
    postgres:16 >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Failed to create PostgreSQL container.
    echo        Try: docker rm eis-postgres   then run this script again.
    pause
    exit /b 1
)
echo        PostgreSQL container created.

:: -------------------------------------------
:: Step 4: Wait for DB readiness
:: -------------------------------------------
:db_wait
echo [3/7] Waiting for database to be ready...
set /a attempts=0

:db_check
set /a attempts+=1
if %attempts% gtr 30 (
    echo [ERROR] Database did not become ready in time.
    pause
    exit /b 1
)
docker exec eis-postgres pg_isready -U postgres >nul 2>&1
if %errorlevel% neq 0 (
    timeout /t 1 /nobreak >nul
    goto :db_check
)
echo        Database is ready.
echo.

:: -------------------------------------------
:: Step 5: Install dependencies (if needed)
:: -------------------------------------------
echo [4/7] Checking dependencies...
if not exist "node_modules" (
    echo        node_modules not found — running npm install...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
    echo        Dependencies installed.
) else (
    echo        node_modules present. Skipping install.
    :: Ensure Prisma client is generated even if node_modules existed
    if not exist "lib\generated\prisma\index.js" (
        echo        Prisma client missing — regenerating...
        call npx prisma generate --no-hints >nul 2>&1
    )
)
echo.

:: -------------------------------------------
:: Step 6: Push schema + seed
:: -------------------------------------------
echo [5/7] Syncing database schema...
call npx prisma db push --skip-generate --accept-data-loss >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARN] Schema push returned a non-zero exit. It may already be in sync.
) else (
    echo        Schema synced.
)

echo [6/7] Seeding database...
call npx prisma db seed >nul 2>&1
echo        Seed complete (admin / admin123).
echo.

:: -------------------------------------------
:: Step 7: Launch dev server
:: -------------------------------------------
echo [7/7] Starting Next.js dev server...
echo.
echo ============================================
echo   Dashboard ready at: http://localhost:3000
echo.
echo   Login:  admin / admin123
echo.
echo   Press Ctrl+C to stop the server
echo ============================================
echo.
call npx next dev
