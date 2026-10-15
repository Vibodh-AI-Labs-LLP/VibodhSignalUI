@echo off
echo ========================================================
echo   Vibodh Signal - Responsive Pricing Page Local Preview
echo ========================================================
echo Starting local web server on http://localhost:3000 ...
start http://localhost:3000/
"C:\Users\Sahana\.gemini\bin\node.exe" "%~dp0serve.cjs"
pause
