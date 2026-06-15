@echo off
title World Business Plus - Serveur local
cd /d "%~dp0"
echo ================================================================
echo   World Business Plus - demarrage du site en local
echo ================================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [X] Node.js n'est pas installe sur cet ordinateur.
  echo.
  echo     1. Allez sur https://nodejs.org
  echo     2. Telechargez et installez la version "LTS"
  echo     3. Relancez ce fichier ^(double-clic^)
  echo.
  pause
  exit /b 1
)

echo Node.js detecte :
node -v
echo.

if not exist node_modules (
  echo Premiere fois : installation des librairies ^(~1-2 minutes^)...
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo [X] L'installation a echoue. Verifiez votre connexion internet et reessayez.
    pause
    exit /b 1
  )
  echo.
)

echo ----------------------------------------------------------------
echo  Demarrage du serveur...
echo  Ouvrez votre navigateur sur :  http://localhost:3000
echo  Espace admin :                 http://localhost:3000/admin
echo.
echo  Laissez cette fenetre OUVERTE pendant que vous testez.
echo  Pour arreter : fermez cette fenetre ou appuyez sur Ctrl+C.
echo ----------------------------------------------------------------
echo.

call npm run dev
pause
