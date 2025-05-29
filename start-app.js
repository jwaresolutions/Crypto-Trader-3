#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log(`
╔═══════════════════════════════════════╗
║       CRYPTO TRADER 3 - STARTUP       ║
╚═══════════════════════════════════════╝
`);

// Check if this is first run
const firstRun = !fs.existsSync('node_modules') || !fs.existsSync('prisma/dev.db');

if (firstRun) {
  console.log('🔍 First run detected. Running setup...\n');
  
  // Run setup
  const setup = spawn('node', ['init-project.js'], { 
    stdio: 'inherit',
    shell: true 
  });
  
  setup.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ Setup complete!');
      startApp();
    } else {
      console.error('\n❌ Setup failed. Please check the errors above.');
      process.exit(1);
    }
  });
} else {
  startApp();
}

function startApp() {
  console.log('\n🚀 Starting Crypto Trader 3...\n');
  console.log('📱 App will open at: http://localhost:3000');
  console.log('👤 Login credentials:');
  console.log('   Username: jware-admin');
  console.log('   Password: T^61iK*9O#iY3%hnj5q5^');
  console.log('\n⏳ Please wait while the app starts...\n');
  
  // Start the React app
  const app = spawn('npm', ['start'], { 
    stdio: 'inherit',
    shell: true 
  });
  
  app.on('close', (code) => {
    console.log(`\nApp exited with code ${code}`);
  });
  
  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down Crypto Trader 3...');
    app.kill();
    process.exit(0);
  });
}