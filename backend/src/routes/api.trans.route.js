const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");

const TransModel = require("../models/trans.Model");
const BatchModel = require("../models/Batch.Model");
const ChqModel = require("../models/Chq.model");

const prisma = new PrismaClient();

const dtFields = [
  "DOB",
  "DOC",
  "DOA",
  "DOR",
  "DOM",
  "Trans_dt",
  "CB_dt",
  "CreatedOn",
  "ModifiedOn",
];

//api/trans/batch/:id
router.get("/batch/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const trans_tb = await TransModel.getTransByBatch(id);
    res.json(trans_tb);
  } catch (err) {
    console.log(err);
    next(err);
  }
});
// api/trans_tb
router.get("/:transby/:id", async (req, res, next) => {
  try {
    const transby = req.params.transby;
    const id = req.params.id;
    console.log(transby, id);
    const trans_tb = await prisma.trans_tb.findMany({
      where: { [transby]: +id },
      orderBy: [{ Trans_dt: "desc" }, { T_Order: "desc" }],
      take: 1500,
      include: { AC_tb: {
        include: {
          mem_tb: true
        }
      }
       }
    });
    // console.log("trans_tb", trans_tb);
    res.json(trans_tb);
  } catch (err) {
    console.log(err);
    next(err);
  }
});

// api/member/:id
router.get("/:id", async (req, res, next) => {
  try {
    console.log(req.params.id);
    const result = await prisma.trans_tb.findMany({
      where: { id: +req.params.id },
      include: { Accounts: true },
    });
    res.json(result);
  } catch (err) {
    console.log(err);
    next(err);
  }
});

// post /api/trans
router.post("/", async (req, res, next) => {
  try {

    if (req.body.id) delete req.body.id;

    dtFields.forEach(field => {
      if (req.body[field]) {
        req.body[field] = new Date(req.body[field]);
      }
    });

    const newMember = await prisma.trans_tb.create({
      data: req.body,
    });
    res.json(newMember);
  } catch (err) {
    console.log(err);
    next(err);
  }
});

// post /api/trans/newLoan
router.post("/newLoan", async (req, res, next) => {
  try {
    
    const BatchData = req.body.BatchData;
    const loadData = req.body.loanData;
    const ACtoAdj = req.body.ACtoAdj;
    const ChqData = req.body.ChqData;



    const BatchID = await  BatchModel.insertAction(BatchData);
    const ActionID = BatchID[0].ActionID;

    console.log("BatchID", ActionID);
    
    

    const newACcount = await prisma.AC_tb.create({
      data: {
        MEMID: +loadData.MemID,
        ACNO: loadData.ACNO,
        AC_type: 'LOAN',
        AC_Sub:'LT',
        rate: +loadData.rate,
        Period: +loadData.period,
        Amt: +loadData.amount,
        Remarks: loadData.remarks,
        prn: +loadData.emi,
      }
    })

    console.log("newACcount", newACcount);

    const newTrans = await prisma.trans_tb.create({
      data: {
        ActionID: ActionID,
        Trans_des_ID:129,
        Trans_dt:new Date(loadData.date),
        CB_dt:new Date(loadData.date),
        ACID: + newACcount.id,
        Total_amt: +loadData.amount,
        Chq_amt: +loadData.finalChqAmt,
        Adj_amt: +loadData.adjustableAmount,
        PRN_C: +loadData.amount,
        PRN: +loadData.amount,
        PRN_B: +loadData.amount,
        CB_side:"P",
        Remarks: loadData.remarks,
        T_Order: 1
      }
    })

    const transactionsToInsert = ACtoAdj.map(item => ({
      ActionID: ActionID,
      Trans_des_ID: 130,
      Trans_dt: new Date(loadData.date),
      CB_dt: new Date(loadData.date),
      ACID: item.ACID,
      Total_amt: item.totalBalance,
      PRN_B: 0,
      INT_B: 0,
      Adj_amt: item.totalBalance, // Or use any adjusted logic
      PRN: item.PRN_B,
      PRN_C: item.PRN_B,
      INT: +item.IntUptoDate,
      INT_C: +item.IntUptoDate + item.INT_B,
      CB_side: "P",
      Remarks: `Auto-adjusted on ${loadData.date}`,
      T_Order: 1
    }));

    const newAdjTrans  = await prisma.trans_tb.createMany({
      data: transactionsToInsert
    });

    ChqData.Trans_ID = ActionID;
    const newChq =  await ChqModel.createChq(ChqData);

    console.log("newChq", newChq);
    

    console.log("newTrans", newTrans);
    console.log("newAdjTrans", newAdjTrans);
    
    console.log("BatchID", BatchID[0]);
   

    // res.json( {BatchID: BatchID[0]});
    res.json( {"NewBatchID": ActionID});


  }
  catch(err) {
    console.log(err);
    next(err);
  }

})

// put /api/trans
router.put("/:id", async (req, res, next) => {
  let id = req.body.id;
  delete req.body.id;
  if(req.body.Trans_dt) req.body.Trans_dt = new Date(req.body.Trans_dt);
  if(req.body.CB_dt) req.body.CB_dt = new Date(req.body.CB_dt);
  
  try {
    const updatedMember = await prisma.trans_tb.update({
      where: { id: +id },
      data: req.body,
    });

    res.json(updatedMember);
  } catch (err) {
    console.log(err);
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const deletedMember = await prisma.trans_tb.delete({
      where: { id: +req.params.id },
    });
    res.json(deletedMember);
  } catch (err) {
    console.log(err);
    next(err);
  }
});

module.exports = router;
