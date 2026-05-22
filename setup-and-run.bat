@echo off
setlocal
set TEMP=E:\temp
set TMP=E:\temp
set npm_config_cache=E:\npm-cache
cd /d E:\smart-crm
if not exist E:\temp mkdir E:\temp
if not exist E:\npm-cache mkdir E:\npm-cache
echo [%date% %time%] Starting npm install >> E:\smart-crm\setup.log
call npm install >> E:\smart-crm\setup.log 2>&1
echo [%date% %time%] npm install exit: %ERRORLEVEL% >> E:\smart-crm\setup.log
if errorlevel 1 exit /b 1
echo [%date% %time%] Starting dev server >> E:\smart-crm\setup.log
call npm run dev >> E:\smart-crm\setup.log 2>&1
