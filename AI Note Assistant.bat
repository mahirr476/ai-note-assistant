@echo off
title AI Note Assistant
color 0A
cd /d "%~dp0"

echo.
echo  ███╗   ██╗ ██████╗ ████████╗███████╗    ███████╗██╗
echo  ████╗  ██║██╔═══██╗╚══██╔══╝██╔════╝    ██╔════╝██║
echo  ██╔██╗ ██║██║   ██║   ██║   █████╗      █████╗  ██║
echo  ██║╚██╗██║██║   ██║   ██║   ██╔══╝      ██╔══╝  ╚═╝
echo  ██║ ╚████║╚██████╔╝   ██║   ███████╗    ███████╗██╗
echo  ╚═╝  ╚═══╝ ╚═════╝    ╚═╝   ╚══════╝    ╚══════╝╚═╝
echo.
echo  Starting your AI-powered note assistant...
echo.

timeout /t 2 /nobreak >nul

call npm run build >nul 2>&1
set ELECTRON_IS_DEV=false
call npm run electron

echo.
echo Thanks for using AI Note Assistant! 
timeout /t 3 /nobreak >nul