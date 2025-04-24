const knex = require('../services/db');

class BatchModel {
  static async getBatchData() {
    return knex.raw(`
      SELECT * FROM  Action_TB
    `); 
  }

  static async insertAction(actionData) {
    return knex('Action_TB')
      .insert({
        ActionDesc: actionData.ActionDesc,
        MemID: actionData.MemID,
        ActionDT: actionData.ActionDT
      }).returning('ActionID');
  }

  static async updateAction(actionId, actionData) {
    return knex('Action_TB')
      .where({ ActionID: actionId })
      .update({
        ActionDesc: actionData.ActionDesc,
        MemID: actionData.MemID,
        ActionDT: actionData.ActionDT
      });
  }

  static async deleteAction(actionId) {
    return knex('Action_TB')
      .where({ ActionID: actionId })
      .del();
  }
}

module.exports = BatchModel;