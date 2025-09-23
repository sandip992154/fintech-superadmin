@echo off
echo 🚀 Building SuperAdmin Panel for Production...

REM Check if .env.production exists
if not exist ".env.production" (
    echo ❌ .env.production file not found!
    echo Please create .env.production with your production environment variables.
    echo Example:
    echo VITE_API_BASE_URL=https://api.yourdomain.com
    echo VITE_APP_ENV=production
    pause
    exit /b 1
)

REM Display current environment configuration
echo 📋 Production Environment Configuration:
type .env.production
echo.

REM Confirm build
set /p confirm="🔍 Confirm build with above configuration? (y/N): "
if /i not "%confirm%"=="y" (
    echo ❌ Build cancelled.
    pause
    exit /b 1
)

REM Install dependencies if needed
echo 📦 Installing dependencies...
call npm install

REM Lint the code
echo 🔍 Linting code...
call npm run lint

REM Build for production
echo 🏗️ Building for production...
set NODE_ENV=production
call npm run build

REM Check if build was successful
if %errorlevel% equ 0 (
    echo ✅ Production build completed successfully!
    echo 📁 Build files are in the 'dist' directory
    echo.
    echo 📋 Next Steps:
    echo 1. Test the build locally: npm run preview
    echo 2. Deploy the 'dist' folder to your hosting service
    echo 3. Configure your web server for SPA routing
    echo.
    echo 🌍 Deploy to:
    echo - Netlify: Drag and drop 'dist' folder
    echo - Vercel: Connect GitHub repo or upload 'dist'
    echo - Traditional Server: Upload 'dist' contents to web root
) else (
    echo ❌ Build failed!
)

pause