@echo off
echo ============================================
echo  Photo Printer Pro - Full Build Script
echo ============================================
echo.

cd /d "%~dp0"

echo [1/6] Installing dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
    echo ERROR: npm install failed!
    pause
    exit /b 1
)
echo.

echo [2/6] Building native C++ module for Electron...
call npx electron-rebuild -f -w license_checker
if %ERRORLEVEL% neq 0 (
    echo ERROR: Native module build failed!
    pause
    exit /b 1
)
echo.

echo [3/6] Building frontend (Vite)...
call npx vite build
if %ERRORLEVEL% neq 0 (
    echo ERROR: Vite build failed!
    pause
    exit /b 1
)
echo.

echo [4/6] Generating app icons...
call node scripts/generate-icons.cjs
if %ERRORLEVEL% neq 0 (
    echo ERROR: Icon generation failed!
    pause
    exit /b 1
)
echo.

echo [5/6] Encrypting modules...
call node scripts/encrypt-main.cjs
if %ERRORLEVEL% neq 0 (
    echo ERROR: Encryption failed!
    pause
    exit /b 1
)
echo.

echo [6/6] Packaging with electron-builder...
call npx electron-builder
if %ERRORLEVEL% neq 0 (
    echo ERROR: electron-builder failed!
    pause
    exit /b 1
)
echo.

echo ============================================
echo  BUILD COMPLETE!
echo  Installer: release\Photo Printer Pro Setup 1.0.5.exe
echo  Unpacked:  release\win-unpacked\
echo ============================================
pause