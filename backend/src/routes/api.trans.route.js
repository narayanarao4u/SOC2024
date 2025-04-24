const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");

const TransModel = require("../models/trans.Model");

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

    if(req.body.Trans_dt) req.body.Trans_dt = new Date(req.body.Trans_dt);
    if(req.body.CB_dt) req.body.CB_dt = new Date(req.body.CB_dt);

    const newMember = await prisma.trans_tb.create({
      data: req.body,
    });
    res.json(newMember);
  } catch (err) {
    console.log(err);
    next(err);
  }
});

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
