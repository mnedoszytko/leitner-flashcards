@echo off

REM Quick run script for Leitner Flashcards

echo Starting Leitner Flashcards...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies first...
    call npm install
)

echo Opening at http://localhost:5173
echo Press Ctrl+C to stop
echo.

call npm run dev