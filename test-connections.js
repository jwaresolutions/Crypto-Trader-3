const axios = require('axios');

console.log('🔌 Testing API Connections...\n');

// Load environment variables
require('dotenv').config();

const ALPACA_API_KEY = process.env.REACT_APP_ALPACA_API_KEY;
const ALPACA_SECRET_KEY = process.env.REACT_APP_ALPACA_SECRET_KEY;
const ALPACA_BASE_URL = process.env.REACT_APP_ALPACA_BASE_URL;
const POLYGON_API_KEY = process.env.REACT_APP_POLYGON_API_KEY;

async function testAlpacaConnection() {
  console.log('📊 Testing Alpaca API...');
  try {
    const response = await axios.get(`${ALPACA_BASE_URL}/v2/account`, {
      headers: {
        'APCA-API-KEY-ID': ALPACA_API_KEY,
        'APCA-API-SECRET-KEY': ALPACA_SECRET_KEY
      }
    });
    console.log('✅ Alpaca API: Connected');
    console.log(`   Account Status: ${response.data.status}`);
    console.log(`   Buying Power: $${parseFloat(response.data.buying_power).toLocaleString()}`);
    console.log(`   Portfolio Value: $${parseFloat(response.data.portfolio_value).toLocaleString()}`);
  } catch (error) {
    console.error('❌ Alpaca API: Failed');
    console.error(`   Error: ${error.response?.data?.message || error.message}`);
  }
}

async function testPolygonConnection() {
  console.log('\n📈 Testing Polygon API...');
  try {
    const response = await axios.get(`https://api.polygon.io/v2/aggs/ticker/X:BTCUSD/prev`, {
      params: { apikey: POLYGON_API_KEY }
    });
    console.log('✅ Polygon API: Connected');
    if (response.data.results && response.data.results[0]) {
      const btcPrice = response.data.results[0].c;
      console.log(`   BTC Price: $${btcPrice.toLocaleString()}`);
    }
  } catch (error) {
    console.error('❌ Polygon API: Failed');
    console.error(`   Error: ${error.response?.data?.error || error.message}`);
    if (error.response?.status === 403) {
      console.log('   Note: You may need a paid Polygon subscription for crypto data');
    }
  }
}

async function testDatabaseConnection() {
  console.log('\n🗄️  Testing Database...');
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    await prisma.$connect();
    const userCount = await prisma.user.count();
    console.log('✅ Database: Connected');
    console.log(`   Users in database: ${userCount}`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Database: Failed');
    console.error(`   Error: ${error.message}`);
    console.log('   Run: npx prisma generate && npx prisma db push');
  }
}

async function runTests() {
  await testAlpacaConnection();
  await testPolygonConnection();
  await testDatabaseConnection();
  
  console.log('\n📋 Summary:');
  console.log('If all tests pass, you can run: npm start');
  console.log('Login with username: jware-admin');
}

runTests();