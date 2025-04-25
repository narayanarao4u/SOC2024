const router = require("express").Router();
const ChqModel = require("../models/Chq.model");


// /api/chqDetails
router.get("/", async (req, res, next) => {
    const batchData = await ChqModel.getBatchData();
    res.json(batchData);
  });
  router.get("/batch/:id", async (req, res, next) => {
    console.log(req.params.id);
    
    const batchData = await ChqModel.getBatchDataById(req.params.id);
    console.log(batchData);
    res.json(batchData);
  })
  
  router.post("/", async (req, res, next) => {
    console.log(req.body);
    
    const newAction = await ChqModel.createChq(req.body);
    res.json(newAction);
  });
  
  router.put("/:id", async (req, res, next) => {
    const updatedAction = await ChqModel.updateChq(req.params.id, req.body);
    res.json(updatedAction);
  }); 
  
  router.delete("/:id", async (req, res, next) => {
    const deletedAction = await ChqModel.deleteChq(req.params.id);
    res.json(deletedAction);
  });
  
  module.exports = router;