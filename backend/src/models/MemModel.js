const knex = require('../services/db');

class MEMData {
  static async getMemData(type = null) {
    let query = 'SELECT * FROM mem_tb';
    
    if (type && type.trim()) {
      query += ` WHERE Memtype='${type}'`;
    }
    
    return knex.raw(query);
  }

  static async getMemberSearch(SearchCol='Genlno', SearchVal='***') {       
    return knex.raw(`
     select top 1 * from mem_tb where ${SearchCol}=N'${SearchVal}'       
    `);
  }

  static async getMemberbyMEMID(MEMID) {       
    return knex.raw(`
     select top 1 * from mem_tb where  MEMID=?       
    `,[MEMID]);
  }


}

module.exports = MEMData;