// testConnection.js
const db = require('./services/db');

async function testConnection() {
  try {
    
    const result = await db.raw('SELECT 1 AS test');
    console.log('✅ Connection successful:', result);
  } catch (err) {
    console.error('❌ Connection failed:', err);
  } finally {
    await db.destroy(); // Close connection pool
  }
}

testConnection();
