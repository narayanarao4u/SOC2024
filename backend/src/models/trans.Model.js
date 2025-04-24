const knex = require('../services/db');
const knexnest = require('knex');

class ACData {
  static async getTransByBatch(BatchID) {
    const rows = await knex('trans_tb as t')
  .join('View_MEM_AC as ma', 't.ACID', 'ma.ACID')
  .select('t.*', 'ma.*');

    const nested = knexnest(rows);
    console.log(nested);
    return nested;
  }




}

module.exports = ACData;