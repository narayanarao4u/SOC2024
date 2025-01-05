const express = require("express");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();

const prisma = new PrismaClient();

const reportQueries = [
  {
    title: "Total Members",
    query: `SELECT gno GNo, name Name, desgn Desgn FROM mem_tb`,
  },
  {
    title: "Receipts & Payments",
    query: `
      with t1 as ( 
        select Actionid, Sum(Chq_amt) chqAmt, 
          CASE
            WHEN CB_side = 'P' THEN Sum(Chq_amt)
            ELSE 0
          END AS Debit,
          CASE
            WHEN CB_side = 'R' THEN Sum(Chq_amt)
            ELSE 0
          END AS Credit
        from  View_Trans_TranDESC
        where not Chq_amt = 0
        group by Actionid, CB_side
      ) 
      select  Action_TB.ActionDT, t1.ActionID, chqAmt, Debit, Credit, 
        sum(Credit - Debit) over (order by Action_TB.ActionDT) Balance
      from t1 
      join Action_TB on t1.ActionID = Action_TB.ActionID 
      {whereclause}
      order by 1`,
    summaryCols: ["Debit", "Credit"],
  },
  {
    title: "Accounts Summary",
    query: `SELECT     AC_Sub, COUNT(ACID) AS NO_OF_Accounts  FROM  AC_tb GROUP BY AC_Sub ORDER BY 2 DESC`,
    summaryCols: ["NO_OF_Accounts"],
  },
  {
    title: "Batch Summary",
    query: `select ActionID as BatchNo, ACT_DT as Date,Descr, AC_Sub, ACNO, Debit,Credit from View_1 where ActionID>0
            and  ACT_DT between  {whereclause}
      `,
    summaryCols: ["Debit", "Credit"],
  },
];

router.get("/", async (req, res) => {
  res.json({ message: "Reports API" });
});

router.get("/test", async (req, res) => {
  const sql = "select ActionID as BatchNo, ACT_DT as Date,Descr, AC_Sub, ACNO, Debit,Credit from View_1 where ActionID>0";
  const result = await prisma.$queryRawUnsafe(sql);
  res.json(result);
});

router.get("/reports", async (req, res) => {
  try {
    let result = reportQueries.map((report) => report.title);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/query", async (req, res) => {
  try {
    const { query, fromDate, toDate } = req.body;
    const sqlConfig = reportQueries.find((report) => report.title === query);

    if (!sqlConfig) {
      return res.status(400).json({ error: "Report query not found" });
    }

    let finalQuery = sqlConfig.query;
    if (query === "Receipts & Payments" && fromDate && toDate) {
      finalQuery = sqlConfig.query.replace("{whereclause}", `where Action_TB.ActionDT between '${fromDate}' and '${toDate}'`);
    }
    if (query === "Batch Summary" && fromDate && toDate) {
      finalQuery = sqlConfig.query.replace("{whereclause}", ` '${fromDate}' and '${toDate}'`);
    }

    // finalQuery = finalQuery.replace("\n", " ");
    console.log(finalQuery);

    const result = await prisma.$queryRawUnsafe(finalQuery);
    res.json({ data: result, summaryCols: sqlConfig.summaryCols || [] });
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

module.exports = router;
