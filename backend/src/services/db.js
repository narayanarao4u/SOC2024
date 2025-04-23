const knex = require('knex');
const dbConfig = require('../config/database');

const db = knex(dbConfig);

// Test database connection
db.raw('SELECT 1')
  .then(() => {
    console.log('Database connection successful!');
  })
  .catch((err) => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });
module.exports = db;