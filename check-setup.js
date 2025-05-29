const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Checking project setup...\n');

// Check if node_modules exists
const nodeModulesExists = fs.existsSync(path.join(__dirname, 'node_modules'));
console.log(`✓ node_modules: ${nodeModulesExists ? 'EXISTS' : 'MISSING'}`);

// Check if .env exists
const envExists = fs.existsSync(path.join(__dirname, '.env'));
console.log(`✓ .env file: ${envExists ? 'EXISTS' : 'MISSING'}`);

// Check if database exists
const dbExists = fs.existsSync(path.join(__dirname, 'prisma', 'dev.db'));
console.log(`✓ Database file: ${dbExists ? 'EXISTS' : 'MISSING'}`);

// Check if Prisma client is generated
const prismaClientExists = fs.existsSync(path.join(__dirname, 'node_modules', '.prisma', 'client'));
console.log(`✓ Prisma client: ${prismaClientExists ? 'GENERATED' : 'NOT GENERATED'}`);

console.log('\n📦 Installing dependencies if needed...');
if (!nodeModulesExists) {
  try {
    console.log('Running npm install...');
    execSync('npm install', { stdio: 'inherit' });
    console.log('✓ Dependencies installed successfully');
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
  }
}

console.log('\n🗄️ Setting up database...');
if (!prismaClientExists) {
  try {
    console.log('Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✓ Prisma client generated');
  } catch (error) {
    console.error('❌ Failed to generate Prisma client:', error.message);
  }
}

if (!dbExists) {
  try {
    console.log('Running database migrations...');
    execSync('npx prisma migrate dev --name init', { stdio: 'inherit' });
    console.log('✓ Database migrations completed');
  } catch (error) {
    console.error('❌ Failed to run migrations:', error.message);
  }
}

console.log('\n✅ Setup check complete!');
console.log('\nYou can now run:');
console.log('  npm start - to start the development server');
console.log('  npm run db:studio - to open Prisma Studio');