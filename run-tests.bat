@echo off
setlocal
set "JAVA_HOME=C:\Users\Mond\.jdks\corretto-21.0.11"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo ========================================
echo Running Carbon Exchange Test Suite
echo ========================================

echo [1/2] Running Backend Tests (Spring Boot)...
cd trading-engine
call mvnw.cmd test
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Backend tests failed!
    exit /b %ERRORLEVEL%
)
cd ..

echo.
echo [2/2] Running Frontend Tests (Vitest)...
cd carbon-exchange-ui
call npm test -- --run
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Frontend tests failed!
    exit /b %ERRORLEVEL%
)
cd ..

echo.
echo ========================================
echo SUCCESS: All tests passed!
echo ========================================
pause