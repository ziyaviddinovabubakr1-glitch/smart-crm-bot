@echo off
setlocal
set TEMP=E:\temp
set TMP=E:\temp
set npm_config_cache=E:\npm-cache
cd /d E:\smart-crm
if not exist E:\temp mkdir E:\temp
if not exist E:\npm-cache mkdir E:\npm-cache
echo [%date% %time%] cleanup C drive node_modules >> E:\smart-crm\install.log
rd /s /q "C:\Users\User\Desktop\1\node_modules" 2>>E:\smart-crm\install.log
rd /s /q "C:\Users\User\Desktop\1\.next" 2>>E:\smart-crm\install.log
echo [%date% %time%] npm install start >> E:\smart-crm\install.log
call npm install >> E:\smart-crm\install.log 2>&1
echo [%date% %time%] npm install exit: %ERRORLEVEL% >> E:\smart-crm\install.log
if errorlevel 1 exit /b 1
echo [%date% %time%] npm run dev start >> E:\smart-crm\dev.log
call npm run dev >> E:\smart-crm\dev.log 2>&1
