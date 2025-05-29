const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Initializing Crypto Trader 3...\n');

function runCommand(command, description) {
  console.log(`📌 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} - Complete\n`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} - Failed`);
    console.error(error.message);
    return false;
  }
}

// Step 1: Install dependencies
if (!fs.existsSync('node_modules')) {
  runCommand('npm install', 'Installing dependencies');
}

// Step 2: Generate Prisma Client
runCommand('npx prisma generate', 'Generating Prisma client');

// Step 3: Create/migrate database
runCommand('npx prisma db push --accept-data-loss', 'Setting up database');

// Step 4: Create initial user if database is empty
const initUser = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createInitialUser() {
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      const user = await prisma.user.create({
        data: {
          email: 'admin@cryptotrader.com',
          username: 'jware-admin',
          password: 'T^61iK*9O#iY3%hnj5q5^', // In production, this should be hashed
          firstName: 'Admin',
          lastName: 'User',
          isActive: true
        }
      });
      
      // Create default portfolio
      await prisma.portfolio.create({
        data: {
          userId: user.id,
          name: 'Default Portfolio',
          cash: 100000,
          totalValue: 100000,
          isDefault: true
        }
      });
      
      console.log('✅ Initial user and portfolio created');
    } else {
      console.log('✅ Users already exist in database');
    }
  } catch (error) {
    console.error('Error creating initial user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createInitialUser();
`;

fs.writeFileSync('temp-init-user.js', initUser);
runCommand('node temp-init-user.js', 'Creating initial user');
fs.unlinkSync('temp-init-user.js');

console.log('\n🎉 Setup complete!');
console.log('\n📱 You can now run: npm start');
console.log('   Login credentials:');
console.log('   Username: jware-admin');
console.log('   Password: T^61iK*9O#iY3%hnj5q5^');