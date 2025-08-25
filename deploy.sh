#!/bin/bash

# FlashFire Dashboard Frontend - Deployment Script

echo "🚀 Starting FlashFire Dashboard Frontend Deployment..."

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
npm install

# Step 2: Build the application
echo "🔨 Building application..."
npm run build

# Step 3: Create deployment package
echo "📦 Creating deployment package..."
rm -rf deployment-package
cp -r dist deployment-package
cp nginx.conf deployment-package/

# Step 4: Show deployment info
echo "✅ Deployment package created successfully!"
echo ""
echo "📁 Deployment package location: ./deployment-package/"
echo "📋 Next steps:"
echo "   1. Upload the contents of deployment-package/ to your web server"
echo "   2. Configure your web server to serve static files"
echo "   3. Ensure your backend API is running and accessible"
echo ""
echo "🌐 Your application is ready for deployment!"
