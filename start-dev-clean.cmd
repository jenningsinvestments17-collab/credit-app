@echo off
setlocal

cd /d C:\Users\kj\credit-repair-mvp\next-credit-foundation

echo.
echo Stopping stale Node processes...
taskkill /f /im node.exe >nul 2>nul

echo.
echo Clearing stale Next.js dev cache...
if exist .next (
  rmdir /s /q .next
)

echo.
echo Starting Credu Consulting live edit server on http://localhost:3001
echo Keep this window open while using the site.
echo.

npm.cmd run dev -- --port 3001
