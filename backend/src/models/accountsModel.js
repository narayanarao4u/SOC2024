const knex = require('../services/db');

class ACData {
  static async getACData(type = null) {
    let query = 'SELECT  acid id, * FROM View_MEM_AC ';
    
    if (type && type.trim()) {
      query += ` WHERE AC_Sub='${type}'`;
    }
    
    return knex.raw(query);
  }
  static async getACBalByMEMID(MEMID) {
    let query =   `SELECT * FROM dbo.View_AC_Bal_Trans where MEMID = ${MEMID}`;  
    
    return knex.raw(query);
  }

  

}

module.exports = ACData;