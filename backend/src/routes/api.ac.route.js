const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const knex = require('../services/db');
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

 // api/account/ACBalance/:id
 router.get("/ACBalance/:id", async (req, res, next) => {
  try {
    let MemID = req.params.id;
    let SQL =`
    
WITH AC_Balance AS (
    SELECT  Trans_ID,  ACID, Trans_dt,  T_Order,  PRN_B,  INT_B,
        ROW_NUMBER() OVER (
            PARTITION BY ACID 
            ORDER BY Trans_dt DESC, T_Order DESC
        ) AS rn
    FROM trans_tb
)
SELECT 
    A.Trans_dt, A.PRN_B,  A.INT_B, A.Trans_ID, [vma].*
FROM AC_Balance A
LEFT OUTER JOIN  dbo.View_AC_Bal_Trans  vma ON A.ACID = vma.ACID
WHERE rn = 1 AND [MemID] = ${MemID}    
    `
    const acbal = await  knex.raw(SQL);
    // console.log(acbal);
    res.json(acbal);  
    
  }
  catch (err) {
    console.log(err);
    next(err);
  }

 })

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
