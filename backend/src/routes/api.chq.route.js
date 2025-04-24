const router = require("express").Router();
const ChqModel = require("../models/chq.model");



router.get("/", async (req, res, next) => {
    const batchData = await ChqModel.getBatchData();
    res.json(batchData);
  });
  
  router.post("/", async (req, res, next) => {
    const newAction = await ChqModel.insertAction(req.body);
    res.json(newAction);
  });
  
  router.put("/:id", async (req, res, next) => {
    const updatedAction = await ChqModel.updateAction(req.params.id, req.body);
    res.json(updatedAction);
  }); 
  
  router.delete("/:id", async (req, res, next) => {
    const deletedAction = await ChqModel.deleteAction(req.params.id);
    res.json(deletedAction);
  });
  
  module.exports = router;