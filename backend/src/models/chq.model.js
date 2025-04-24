const knex = require('../services/db'); 

class ChqModel {
    static async getChqData() {
      return knex.raw(`
        SELECT * FROM  [Chqdetails]
      `); 
    }

    // Create new cheque record
    static async createChq(chqData) {
        return knex('Chqdetails').insert({
            Pay_Mode: chqData.Pay_Mode,
            ChqNo: chqData.ChqNo,
            ChqDt: chqData.ChqDt,
            Chqamt: chqData.Chqamt,
            ChaBank: chqData.ChaBank,
            ChqName: chqData.ChqName,
            ChqACNO: chqData.ChqACNO,
            VrNo: chqData.VrNo,
            VrDt: chqData.VrDt,
            ACID: chqData.ACID,
            CrDt: chqData.CrDt,
            Trans_ID: chqData.Trans_ID
        }).returning('ChqID');
    }

    // Get cheque by ID
    static async getChqById(chqId) {
        return knex('Chqdetails')
            .where('ChqID', +chqId)
            .first();
    }

    static async getBatchDataById(Trans_ID) {
        const id = Number(Trans_ID);
        console.log("Fetching batch for Trans_ID:", id);
        let result = await knex.raw(`
            SELECT * FROM Chqdetails
            WHERE Trans_ID = ?
        `, [id]);
        console.log("Result from getBatchDataById:", result);
        return result;          
    }
    

    // Update cheque record
    static async updateChq(chqId, chqData) {
        return knex('Chqdetails')
            .where('ChqID', chqId)
            .update({
                Pay_Mode: chqData.Pay_Mode,
                ChqNo: chqData.ChqNo,
                ChqDt: chqData.ChqDt,
                Chqamt: chqData.Chqamt,
                ChaBank: chqData.ChaBank,
                ChqName: chqData.ChqName,
                ChqACNO: chqData.ChqACNO,
                VrNo: chqData.VrNo,
                VrDt: chqData.VrDt,
                ACID: chqData.ACID,
                CrDt: chqData.CrDt,
                Trans_ID: chqData.Trans_ID
            });
    }

    // Delete cheque record
    static async deleteChq(chqId) {
        return knex('Chqdetails')
            .where('ChqID', chqId)
            .del();
    }
}

module.exports = ChqModel;

