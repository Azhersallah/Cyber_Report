@echo off
echo ============================================
echo  Photo Printer Free - Full Build Script
echo ============================================
echo.

cd /d "%~dp0"

echo [1/4] Installing dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
    echo ERROR: npm install failed!
    pause
    exit /b 1
)
echo.

echo [2/4] Building frontend (Vite)...
call npx vite build
if %ERRORLEVEL% neq 0 (
    echo ERROR: Vite build failed!
    pause
    exit /b 1
)
echo.

echo [3/4] Generating app icons...
call node scripts/generate-icons.cjs
if %ERRORLEVEL% neq 0 (
    echo ERROR: Icon generation failed!
    pause
    exit /b 1
)
echo.

echo [4/4] Packaging with electron-builder...
call npx electron-builder
if %ERRORLEVEL% neq 0 (
    echo ERROR: electron-builder failed!
    pause
    exit /b 1
)
echo.

echo ============================================
echo  BUILD COMPLETE!
echo  Installer: release\Photo Printer Free Setup 1.0.0.exe
echo  Unpacked:  release\win-unpacked\
echo ============================================
pause