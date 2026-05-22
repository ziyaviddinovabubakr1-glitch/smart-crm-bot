@echo off
chcp 65001 >nul
title Smart CRM — установка и запуск
color 0A
echo.
echo  ========================================
echo   Smart CRM — установка и запуск
echo  ========================================
echo.

set TEMP=E:\temp
set TMP=E:\temp
set npm_config_cache=E:\npm-cache
set npm_config_prefix=E:\npm-global

if not exist E:\temp mkdir E:\temp
if not exist E:\npm-cache mkdir E:\npm-cache
if not exist E:\npm-global mkdir E:\npm-global

echo [1/4] Освобождаю место на диске C: ...
if exist "C:\Users\User\Desktop\1\node_modules" (
  rd /s /q "C:\Users\User\Desktop\1\node_modules" 2>nul
)
if exist "C:\Users\User\Desktop\1\.next" (
  rd /s /q "C:\Users\User\Desktop\1\.next" 2>nul
)
echo       Готово.

echo [2/4] Устанавливаю зависимости на E:\smart-crm ...
cd /d E:\smart-crm
call npm install
if errorlevel 1 (
  echo.
  echo  ОШИБКА: npm install не удался.
  echo  Проверьте интернет и место на диске E:
  pause
  exit /b 1
)

echo [3/4] Проверяю Next.js ...
if not exist "node_modules\next\package.json" (
  echo  ОШИБКА: Next.js не установился.
  pause
  exit /b 1
)
echo       Next.js OK.

set PATH=C:\Program Files\nodejs;%PATH%

echo [4/4] Запускаю сервер...
echo.
echo  Откройте в браузере: http://localhost:3000
echo  Логин: admin@local.dev / admin123
echo  Чтобы остановить — закройте это окно или Ctrl+C
echo.
start http://localhost:3000
call npm run dev
