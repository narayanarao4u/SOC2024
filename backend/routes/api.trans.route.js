const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");

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

// api/trans_tb
router.get("/:transby/:id", async (req, res, next) => {
  try {
    const transby = req.params.transby;
    const id = req.params.id;
    console.log(transby, id);
    const trans_tb = await prisma.trans_tb.findMany({
      where: { [transby]: +id },
      orderBy: [{ Trans_dt: "desc" }, { T_Order: "desc" }],
      take: 100,
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

// post /api/member
router.post("/", async (req, res, next) => {
  try {
    if (req.body.id) delete req.body.id;

    const newMember = await prisma.trans_tb.create({
      data: req.body,
    });
    res.json(newMember);
  } catch (err) {
    console.log(err);
    next(err);
  }
});

// put /api/member
router.put("/:id", async (req, res, next) => {
  let id = req.body.id;
  delete req.body.id;
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
