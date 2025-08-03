@echo off
REM Leitner Flashcards - One-Click Installer for Windows
REM This script will install and run the Leitner Flashcards app

echo.
echo ===================================
echo  Leitner Flashcards Installer
echo ===================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please install Node.js from https://nodejs.org first.
    echo Then run this script again.
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js found: %NODE_VERSION%

REM Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed!
    echo.
    echo Please install npm or reinstall Node.js from https://nodejs.org
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [OK] npm found: %NPM_VERSION%
echo.

REM Ask user for installation directory
set "install_dir=leitner-flashcards"
set /p install_dir="Where to install? (default: leitner-flashcards): "

REM Check if directory already exists
if exist "%install_dir%" (
    echo.
    echo [WARNING] Directory '%install_dir%' already exists!
    set /p confirm="Delete it and continue? (y/n): "
    if /i not "!confirm!"=="y" (
        echo Installation cancelled.
        pause
        exit /b 1
    )
    rmdir /s /q "%install_dir%"
)

echo.
echo Downloading Leitner Flashcards...
call npx degit mnedoszytko/leitner-flashcards "%install_dir%"

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to download the app!
    pause
    exit /b 1
)

cd "%install_dir%"

echo.
echo Installing dependencies...
call npm install

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to install dependencies!
    pause
    exit /b 1
)

echo.
echo ===================================
echo  Installation complete!
echo ===================================
echo.
echo Starting Leitner Flashcards...
echo The app will open in your browser at http://localhost:5173
echo.
echo Press Ctrl+C to stop the app
echo.

call npm run dev