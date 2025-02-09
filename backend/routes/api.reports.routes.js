const express = require("express");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();

const prisma = new PrismaClient();

const reportQueries = [
  {
    title: "Total Members",
    query: `SELECT gno GNo, name Name, desgn Desgn FROM mem_tb`,
    showCalender: false,
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
      where Action_TB.ActionDT between '@fromDate' and '@toDate'
      order by 1`,
    summaryCols: ["Debit", "Credit"],
    showCalender: true,
  },
  {
    title: "Accounts Summary",
    query: `SELECT     AC_Sub, COUNT(ACID) AS NO_OF_Accounts  FROM  AC_tb GROUP BY AC_Sub ORDER BY 2 DESC`,
    summaryCols: ["NO_OF_Accounts"],
    showCalender: true,
  },
  {
    title: "All Accounts",
    query: `select * from View_MEM_AC ORDER by MemID, AC_Sub, ACNO`,
    summaryCols: [],
    showCalender: false,
  },
  {
    title: "Batch Transcations",
    query: `select ActionID as BatchNo, ACT_DT as Date,Descr, AC_Sub, ACNO, Debit,Credit from View_1 where ActionID>0
            and  ActionID =  @inputValue
      `,
    summaryCols: ["Debit", "Credit"],
    showCalender: true,
    InputLabel: "Enter Batch No",
  },
  {
    title: "AC balances as on date",
    query: `WITH MaxOrder AS (
    SELECT ACID, MAX(T_Order) AS T_order
    FROM trans_tb
    WHERE Trans_dt <= '@toDate'
    GROUP BY ACID
),
FROMTABLE AS (
    SELECT trans_tb.ACID, trans_tb.PRN_B, trans_tb.Trans_dt, trans_tb.rate, trans_tb.INT_B, trans_tb.CB_dt
    FROM trans_tb
    INNER JOIN MaxOrder ON trans_tb.ACID = MaxOrder.ACID AND trans_tb.T_Order = MaxOrder.T_order
)
SELECT VMA.ACID, VMA.gno, VMA.hrno, VMA.name, VMA.AC_Sub, 
       VMA.ACNO, VMA.DOC, VMA.Amt, FTB.Trans_dt, 
       FTB.CB_dt, FTB.PRN_B, FTB.INT_B, FTB.rate,
       (FTB.PRN_B * POWER(1 + FTB.rate / 100, DATEDIFF(DAY, FTB.CB_dt, '@toDate') / 365.0) - FTB.PRN_B) AS AccInt
FROM View_MEM_AC VMA 
LEFT OUTER JOIN FROMTABLE FTB ON VMA.ACID = FTB.ACID
WHERE VMA.AC_Sub = '@inputValue' and FTB.PRN_B > 0

      `,
    summaryCols: ["PRN_B", "INT_B", "AccInt"],
    showCalender: true,
    InputLabel: "Enter as on date",
    InputDefValue: "LT",
    InputOption: ["LT", "FD"],
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
    let result = reportQueries.map((report) => ({
      title: report.title,
      showCalender: report.showCalender,
      InputLabel: report.InputLabel,
      InputDefValue: report.InputDefValue,
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/query", async (req, res) => {
  try {
    const { query, fromDate, toDate, inputValue } = req.body;

    // Validate required parameters
    if (!query) {
      return res.status(400).json({ error: "Query parameter is required" });
    }

    const sqlConfig = reportQueries.find((report) => report.title === query);

    if (!sqlConfig) {
      return res.status(400).json({ error: "Report query not found" });
    }

    let finalQuery = sqlConfig.query;

    // Handle date parameters for specific queries

    if (query === "Receipts & Payments") {
      finalQuery = finalQuery.replace("@fromDate", `${fromDate}`);
      finalQuery = finalQuery.replace("@toDate", `${toDate}`);
    } else if (query === "Batch Transcations") {
      finalQuery = finalQuery.replace("@inputValue", `${inputValue}`);
    } else if (query === "AC balances as on date") {
      finalQuery = finalQuery.replace("@toDate", `${toDate}`);
      finalQuery = finalQuery.replace("@toDate", `${toDate}`);
      finalQuery = finalQuery.replace("@inputValue", `${inputValue}`);
    }

    console.log("Executing query:", finalQuery);

    const result = await prisma.$queryRawUnsafe(finalQuery);

    if (!result) {
      return res.status(404).json({ error: "No data found" });
    }

    return res.json({
      data: result,
      summaryCols: sqlConfig.summaryCols || [],
    });
  } catch (error) {
    console.error("Query execution error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
});

module.exports = router;
