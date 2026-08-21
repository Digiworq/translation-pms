@echo off
echo ===================================================
echo 🚀 GitHub Deployment Script for LingoTech PMS
echo ===================================================
echo.

git init
git add .
git commit -m "Initial commit - LingoTech PMS ready for Vercel deployment"
git branch -M main

echo.
set /p REPO_URL="Enter your GitHub Repository URL (e.g. https://github.com/username/translation-pms.git): "

if "%REPO_URL%"=="" (
    echo ❌ Repository URL cannot be empty. Please run the script again.
    pause
    exit /b
)

git remote remove origin >nul 2>&1
git remote add origin %REPO_URL%
git push -u origin main

echo.
echo ===================================================
echo ✅ Success! Your project is now pushed to GitHub!
echo ===================================================
pause
