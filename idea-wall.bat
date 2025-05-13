@echo off
setlocal enabledelayedexpansion

:: Define log directory
set "LOG_DIR=logs"
set "PID_DIR=logs"

:: Create log directory
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

:: Main program
if "%~1"=="" (
    call :show_help
    exit /b 0
)

if /i "%~1"=="start" (
    call :start_services
    exit /b 0
)

if /i "%~1"=="stop" (
    call :stop_services
    exit /b 0
)

if /i "%~1"=="status" (
    call :check_status
    exit /b 0
)

if /i "%~1"=="help" (
    call :show_help
    exit /b 0
)

echo Unknown command: %~1
call :show_help
exit /b 1

:: Start services function
:start_services
    echo Starting Idea Wall Project...

    :: Check Python virtual environment
    if not exist "components\idea-wall-api\venv" (
        echo Creating Python virtual environment...
        cd components\idea-wall-api
        python -m venv venv
        call venv\Scripts\activate
        pip install -r requirements.txt
        cd ..\..
    ) else (
        cd components\idea-wall-api
        call venv\Scripts\activate
        cd ..\..
    )

    :: Check Node.js dependencies
    if not exist "components\idea-wall-ui\node_modules" (
        echo Installing Node.js dependencies...
        cd components\idea-wall-ui
        call npm install
        cd ..\..
    )

    :: Start backend service
    echo Starting backend service...
    start "Idea Wall Backend" cmd /k "cd components\idea-wall-api && venv\Scripts\activate && uvicorn main:app --reload > ..\..\%LOG_DIR%\backend.log 2>&1"
    
    :: Wait for backend to start
    echo Waiting for backend to start...
    timeout /t 5 /nobreak > nul

    :: Start frontend service
    echo Starting frontend service...
    start "Idea Wall Frontend" cmd /k "cd components\idea-wall-ui && npm start > ..\..\%LOG_DIR%\frontend.log 2>&1"

    echo.
    echo Services are starting...
    echo Backend: http://localhost:8000
    echo Frontend: http://localhost:4200
    echo.
    echo To stop the services, run:
    echo app.bat stop
    echo.
    echo Logs are available in:
    echo %LOG_DIR%\backend.log
    echo %LOG_DIR%\frontend.log
    exit /b 0

:: Stop services function
:stop_services
    echo Stopping Idea Wall services...

    :: Stop backend service (uvicorn)
    taskkill /F /IM python.exe /FI "WINDOWTITLE eq uvicorn*" > nul 2>&1
    if errorlevel 1 (
        echo Backend service is not running
    ) else (
        echo Backend service stopped
    )

    :: Stop frontend service (node)
    taskkill /F /IM node.exe /FI "WINDOWTITLE eq npm*" > nul 2>&1
    if errorlevel 1 (
        echo Frontend service is not running
    ) else (
        echo Frontend service stopped
    )

    echo All services stopped
    exit /b 0

:: Check service status function
:check_status
    echo Checking service status...
    
    :: Check backend service (uvicorn)
    tasklist /FI "IMAGENAME eq python.exe" 2>NUL | find /I /N "python.exe" >NUL
    if "%ERRORLEVEL%"=="0" (
        for /f "tokens=2" %%a in ('tasklist /FI "IMAGENAME eq python.exe" /NH') do (
            echo Backend: Running (PID: %%a)
        )
    ) else (
        echo Backend: Not running
    )

    :: Check frontend service (node)
    tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe" >NUL
    if "%ERRORLEVEL%"=="0" (
        for /f "tokens=2" %%a in ('tasklist /FI "IMAGENAME eq node.exe" /NH') do (
            echo Frontend: Running (PID: %%a)
        )
    ) else (
        echo Frontend: Not running
    )
    exit /b 0

:: Show help information
:show_help
    echo Usage:
    echo   app.bat ^<command^>
    echo.
    echo Commands:
    echo   start   - Start all services
    echo   stop    - Stop all services
    echo   status  - Check service status
    echo   help    - Show this help message
    exit /b 0