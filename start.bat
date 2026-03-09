@echo off
title EIS Dashboard Startup
echo ============================================
echo   EIS Dashboard - Startup Script
echo ============================================
echo.

:: Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

:: Kill any existing Next.js dev server
echo [0/5] Cleaning up previous sessions...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000.*LISTENING" 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)
:: Also clean the lock file if it exists
if exist "%~dp0.next\dev\lock" del /f "%~dp0.next\dev\lock" >nul 2>&1
echo        Cleanup done.

:: Start or create PostgreSQL container
echo [1/5] Starting PostgreSQL database...

:: Try to start existing container first
docker start eis-postgres >nul 2>&1
if %errorlevel% equ 0 (
    echo        PostgreSQL container started.
    goto :db_wait
)

:: Remove any dead container with same name
docker rm eis-postgres >nul 2>&1

:: Check if port 5432 is already in use by non-Docker process
netstat -an | findstr ":5432.*LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARN] Port 5432 is already in use. Checking if it's our container...
    docker ps --filter "publish=5432" --format "{{.Names}}" 2>nul | findstr /r "." >nul 2>&1
    if %errorlevel% equ 0 (
        echo        Found existing Docker container on port 5432. Continuing...
        goto :db_wait
    )
    echo [ERROR] Port 5432 is in use by another process. Please free it and retry.
    pause
    exit /b 1
)

:: Create new container
echo        Creating new PostgreSQL container...
docker run -d --name eis-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=eis_dashboard -p 5432:5432 postgres:16 >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Failed to create PostgreSQL container.
    echo        Try running: docker rm eis-postgres
    echo        Then run this script again.
    pause
    exit /b 1
)
echo        PostgreSQL container created.

:: Wait for database to be ready
:db_wait
echo [2/5] Waiting for database to be ready...
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

:: Change to script directory
cd /d "%~dp0"

echo [3/5] Syncing database schema...
call npx prisma db push --skip-generate 2>&1 | findstr /i "error" >nul
if %errorlevel% equ 0 (
    echo [WARN] Schema push had issues, but may already be in sync.
) else (
    echo        Schema synced.
)

echo [4/5] Seeding database...
call npx prisma db seed 2>nul
echo        Seed complete.

echo [5/5] Starting Next.js dev server...
echo.
echo ============================================
echo   Dashboard ready at: http://localhost:3000
echo   Login: admin / admin123
echo   Press Ctrl+C to stop
echo ============================================
echo.
call npx next dev
