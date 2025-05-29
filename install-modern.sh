#!/bin/bash

echo "🚀 Installing Modern Crypto Trader 3..."
echo ""

# Clean up old files
echo "🧹 Cleaning up old files..."
rm -rf node_modules package-lock.json

# Install dependencies
echo "📦 Installing modern dependencies..."
npm install

# Generate Prisma client
echo ""
echo "🔧 Generating Prisma client..."
npx prisma generate

# Setup database
echo ""
echo "🗄️ Setting up database..."
npx prisma db push --accept-data-loss

# Create initial user
echo ""
echo "👤 Creating initial user..."
node init-project.js

echo ""
echo "✅ Installation complete!"
echo ""
echo "🎉 To start the application, run: npm run dev"
echo ""
echo "📱 The app will open at: http://localhost:3000"
echo "👤 Login credentials:"
echo "   Username: jware-admin"
echo "   Password: T^61iK*9O#iY3%hnj5q5^"