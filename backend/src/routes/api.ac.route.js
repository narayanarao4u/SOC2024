const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");

const ACData = require("../models/accountsModel");

const prisma = new PrismaClient();

// api/account
router.get("/", async (req, res, next) => {
  try {
// const AC_tb = await prisma.$queryRaw`SELECT Top 10 acid id, * FROM AC_tb ORDER BY acid DESC  `;
console.log('fired');


const AC_tb = await ACData.getACData();
    res.json(AC_tb);
  } catch (err) {
    console.log(err);
    next(err);
  }
});

// api/account/newActionID
router.get("/newActionID", async (req, res, next) => {
  try {
    const result = await prisma.$queryRaw`select max(ActionID)+1  ActionID from trans_tb;`;
    res.json(result);
  } catch (err) {
    console.log(err);
    next(err);
  }
});

// api/account/:id
router.get("/:id", async (req, res, next) => {
  try {
    // console.log(req.params.id);
    const member = await prisma.AC_tb.findMany({
      where: { id: +req.params.id },
      include: { mem_tb: true },
      
    });
    res.json(member);
  } catch (err) {
    console.log(err);
    next(err);
  }
});

// api/account/search
router.post("/search", async (req, res, next) => {
  try {
    // console.log(req.body);
    const member = await prisma.AC_tb.findMany({
      where: req.body,
      include: { mem_tb: true },
    });
    res.json(member);
  } catch (err) {
    console.log(err);
    next(err);
  }
});

// post /api/account
router.post("/", async (req, res, next) => {
  try {
    const newMember = await prisma.AC_tb.create({
      data: req.body,
    });

    res.json(newMember);
  } catch (err) {
    console.log(err);
    next(err);
  }
});

// put /api/account
router.put("/:id", async (req, res, next) => {
  let id = req.body.id;
  delete req.body.id;
  try {
    const updatedMember = await prisma.AC_tb.update({
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
    const deletedMember = await prisma.AC_tb.delete({
      where: { id: +req.params.id },
    });
    res.json(deletedMember);
  } catch (err) {
    console.log(err);
    next(err);
  }
});

module.exports = router;
