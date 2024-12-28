const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// api/trans_desc_tb
router.get("/", async (req, res, next) => {
  try {
    const trans_desc_tb = await prisma.trans_desc_tb.findMany({});
    res.json(trans_desc_tb);
  } catch (err) {
    console.log(err);
    next(err);
  }
});

// api/member/:id
router.get("/:id", async (req, res, next) => {
  try {
    console.log(req.params.id);
    const member = await prisma.trans_desc_tb.findMany({
      where: { id: +req.params.id },
      include: { Accounts: true },
    });
    res.json(member);
  } catch (err) {
    console.log(err);
    next(err);
  }
});

// post /api/member
router.post("/", async (req, res, next) => {
  try {
    const newMember = await prisma.trans_desc_tb.create({
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
  console.log(req.body);
  let id = req.body.id;
  delete req.body.id;
  try {
    const updatedMember = await prisma.trans_desc_tb.update({
      where: { id: +id },
      data: req.body,
    });
    console.log(updatedMember);
    res.json(updatedMember);
  } catch (err) {
    console.log(err);
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const deletedMember = await prisma.trans_desc_tb.delete({
      where: { id: +req.params.id },
    });
    res.json(deletedMember);
  } catch (err) {
    console.log(err);
    next(err);
  }
});

module.exports = router;
