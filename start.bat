@echo off
set "ROOT=%~dp0"

echo Starting backend on port 5000...
start "SPX Backend" cmd /k "cd /d "%ROOT%backend" && py app.py"

echo Starting frontend on port 3000...
start "SPX Frontend" cmd /k "cd /d "%ROOT%frontend" && npm run dev"

echo.
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:4000
echo.
echo Each server is running in its own window. Close those windows to stop them.
