#!/bin/bash

# Production Build Script for SuperAdmin Panel
echo "🚀 Building SuperAdmin Panel for Production..."

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production file not found!"
    echo "Please create .env.production with your production environment variables."
    echo "Example:"
    echo "VITE_API_BASE_URL=https://api.yourdomain.com"
    echo "VITE_APP_ENV=production"
    exit 1
fi

# Display current environment configuration
echo "📋 Production Environment Configuration:"
cat .env.production

# Confirm build
read -p "🔍 Confirm build with above configuration? (y/N): " confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "❌ Build cancelled."
    exit 1
fi

# Install dependencies if needed
echo "📦 Installing dependencies..."
npm install

# Lint the code
echo "🔍 Linting code..."
npm run lint

# Build for production
echo "🏗️ Building for production..."
NODE_ENV=production npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Production build completed successfully!"
    echo "📁 Build files are in the 'dist' directory"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Test the build locally: npm run preview"
    echo "2. Deploy the 'dist' folder to your hosting service"
    echo "3. Configure your web server for SPA routing"
    echo ""
    echo "🌍 Deploy to:"
    echo "- Netlify: Drag and drop 'dist' folder"
    echo "- Vercel: Connect GitHub repo or upload 'dist'"
    echo "- Traditional Server: Upload 'dist' contents to web root"
else
    echo "❌ Build failed!"
    exit 1
fi