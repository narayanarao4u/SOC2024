require('dotenv').config();

module.exports = {
  client: 'mssql',
  connection: {
    server: process.env.DB_SERVER || '127.0.0.1',
    port:  1433,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
      encrypt: false,
      trustServerCertificate: true,      
      enableArithAbort: true,
      instanceName: 'SQLEXPRESS',
      useUTC: false,
      dateFirst: 1,
      timezone: 'Asia/Kolkata'
    }
  },
  pool: {
    min: 2,
    max: 10
  }
};