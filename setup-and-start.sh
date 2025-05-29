#!/bin/bash

echo "🚀 Setting up Crypto Trader 3..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

# Generate Prisma client
echo ""
echo "🔧 Generating Prisma client..."
npx prisma generate
echo "✅ Prisma client generated"

# Run database migrations
echo ""
echo "🗄️  Setting up database..."
npx prisma migrate deploy
echo "✅ Database setup complete"

# Check if database exists
if [ -f "prisma/dev.db" ]; then
    echo "✅ Database file exists"
else
    echo "⚠️  Database file not found, creating..."
    npx prisma db push
fi

# Start the application
echo ""
echo "🎉 Starting the application..."
echo "📱 The app will open at http://localhost:3000"
echo ""
npm start