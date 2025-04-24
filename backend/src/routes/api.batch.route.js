const router = require("express").Router();
const BatchModel = require("../models/Batch.Model");

router.get("/", async (req, res, next) => {
  const batchData = await BatchModel.getBatchData();
  res.json(batchData);
});

router.post("/", async (req, res, next) => {
  const newAction = await BatchModel.insertAction(req.body);
  res.json(newAction);
});

router.put("/:id", async (req, res, next) => {
  const updatedAction = await BatchModel.updateAction(req.params.id, req.body);
  res.json(updatedAction);
}); 

router.delete("/:id", async (req, res, next) => {
  const deletedAction = await BatchModel.deleteAction(req.params.id);
  res.json(deletedAction);
});

module.exports = router;




    