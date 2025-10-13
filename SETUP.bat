@echo off
echo ========================================
echo Voucher Management System - Setup
echo ========================================
echo.

echo [1/6] Checking Node.js...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found! Please install Node.js 18+
    pause
    exit /b 1
)
echo ✓ Node.js found
echo.

echo [2/6] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo ✓ Dependencies installed
echo.

echo [3/6] Setting up environment file...
if not exist .env (
    copy .env.example .env
    echo ✓ .env file created from .env.example
    echo.
    echo IMPORTANT: Please edit .env file and update DATABASE_URL
    echo Example: DATABASE_URL="postgresql://postgres:password@localhost:5432/voucher_db?schema=public"
    echo.
    pause
) else (
    echo ✓ .env file already exists
)
echo.

echo [4/6] Generating Prisma Client...
call npm run db:generate
if %errorlevel% neq 0 (
    echo ERROR: Failed to generate Prisma Client
    pause
    exit /b 1
)
echo ✓ Prisma Client generated
echo.

echo [5/6] Pushing database schema...
call npm run db:push
if %errorlevel% neq 0 (
    echo ERROR: Failed to push database schema
    echo Please check your DATABASE_URL in .env file
    pause
    exit /b 1
)
echo ✓ Database schema pushed
echo.

echo [6/6] Seeding database...
call npm run db:seed
if %errorlevel% neq 0 (
    echo ERROR: Failed to seed database
    pause
    exit /b 1
)
echo ✓ Database seeded
echo.

echo ========================================
echo Setup completed successfully! 🎉
echo ========================================
echo.
echo Default Admin Credentials:
echo   Username: admin
echo   Password: admin123
echo.
echo   Username: kasir
echo   Password: admin123
echo.
echo To start the development server:
echo   npm run dev
echo.
echo To open Prisma Studio:
echo   npm run db:studio
echo.
echo Read QUICKSTART.md for next steps!
echo ========================================
pause
