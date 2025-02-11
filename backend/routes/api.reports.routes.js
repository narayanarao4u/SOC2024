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
    query: `Select v.MemID, v.gno, v.hrno, v.name, v.desgn, v.AC_Sub, v.ACNO, v.ACID, v.Closed, v.prn  from View_MEM_AC v`,
    summaryCols: [],
    showCalender: false,
  },
  {
    title: "Batch Transcations",
    query: `select ActionID as BatchNo, ACT_DT as Date,Descr, AC_Sub, ACNO, MEMID, Debit,Credit from View_1 where ActionID>0
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
     cast(round((FTB.PRN_B * POWER(1 + FTB.rate / 100, DATEDIFF(DAY, FTB.CB_dt, '@toDate') / 365.0) - FTB.PRN_B),2) as numeric(36,2)) AS AccInt
FROM View_MEM_AC VMA 
LEFT OUTER JOIN FROMTABLE FTB ON VMA.ACID = FTB.ACID
WHERE VMA.AC_Sub = '@inputValue' and FTB.PRN_B > 0

      `,
    summaryCols: ["PRN_B", "INT_B", "AccInt"],
    showCalender: true,
    InputLabel: "Select Account Type",
    InputDefValue: "LT",
    InputOption: [],
    getInputOptions: async () => {
      const sql = "Select Distinct AC_Sub as value from Ac_tb ORDER BY 1";
      const results = await prisma.$queryRawUnsafe(sql);
      return results.map((result) => ({
        value: result.value,
        label: result.value,
      }));
    },
  },
  {
    title: "General Ledger",
    query: `SELECT [AC_Sub] + ' ' + [Part] as [Descrp], [ACT_DT], SUM([Credit]) AS RECEIPTS , SUM([Debit]) AS PAYMENTS FROM [dbo].[View_1_FULLDATA]
 WHERE [AC_Sub] + ' ' + [Part] = N'@inputValue' 
 and  ACT_DT between '@fromDate' and '@toDate'
 GROUP BY [AC_Sub] + ' ' + [Part], [ACT_DT] ORDER  BY 2
    `,
    summaryCols: ["RECEIPTS", "PAYMENTS"],
    showCalender: true,
    InputLabel: "Enter Account",
    inputDefValue: "LT PRN",
    InputOption: [], // Will be populated dynamically
    getInputOptions: async () => {
      const sql = "Select Distinct [AC_Sub] + ' ' + [Part] as value from View_1_FULLDATA ORDER BY 1";
      const results = await prisma.$queryRawUnsafe(sql);
      return results.map((result) => ({
        value: result.value,
        label: result.value,
      }));
    },
  },

  {
    title: "Batch Trans Count",
    query: `select ActionID BatchNo, CB_dt, count(*) Cnt from trans_tb 
            where ActionID > 0 and CB_dt between '@fromDate' and '@toDate'
            group by ActionID, CB_dt order by 2 desc`,
    summaryCols: ["Cnt"],
    showCalender: true,
  },

  {
    title: "Show Batch",
    query: `EXEC SHOWBATCH @atn = @inputValue`,
    summaryCols: ["LTPRN", "LTINT", "STPRN", "STINT", "ENTRY FEE", "MEMBERS SUSPENCE AC", "SHARE", "THRIFT", "Total_amt"],
    showCalender: false,
    InputLabel: "Enter Batch No",
    InputDefValue: "-1",
    isStoredProcedure: true,
  },
  {
    title: "Batch Adjustment errors",
    query: `
      WITH ActionoIDs AS 
(
	SELECT DISTINCT ActionID  FROM   trans_tb  
), 
Action_R AS
    (SELECT        tr.ActionID, SUM(tr.Adj_amt) AS ADJ_R, trdesc.CB_side
      FROM            trans_tb AS tr INNER JOIN
                                trans_desc_tb AS trdesc ON tr.Trans_des_ID = trdesc.Trans_des_ID
      WHERE        (trdesc.CB_side = N'R') and not tr.Trans_des_ID in (250)
      GROUP BY tr.ActionID, trdesc.CB_side), 
Action_P AS
    (SELECT        tr.ActionID, SUM(tr.Adj_amt) AS ADJ_P, trdesc.CB_side
      FROM            trans_tb AS tr INNER JOIN
                                trans_desc_tb AS trdesc ON tr.Trans_des_ID = trdesc.Trans_des_ID
      WHERE        (trdesc.CB_side = N'P') and not tr.Trans_des_ID in (250)
      GROUP BY tr.ActionID, trdesc.CB_side),
VADJ as (
SELECT TOP (100) PERCENT ActionoIDs.ActionID [BatchNo], Action_P_1.ADJ_P, Action_R_1.ADJ_R, 
	ISNULL(Action_P_1.ADJ_P, 0) - ISNULL(Action_R_1.ADJ_R, 0) AS ADJ_Diff
     FROM            ActionoIDs LEFT OUTER JOIN
                              Action_R AS Action_R_1 ON ActionoIDs.ActionID = Action_R_1.ActionID LEFT OUTER JOIN
                              Action_P AS Action_P_1 ON ActionoIDs.ActionID = Action_P_1.ActionID
     ORDER BY ActionoIDs.ActionID
)
select * from VADJ where not ADJ_Diff= 0 and not BatchNo = 0
    `,
    summaryCols: [],
  },
  {
    title: "Bank Transcations",
    query: `
WITH OpeningBalance AS (
    SELECT 
        COALESCE(SUM(CASE WHEN CB_side = 'R' THEN Chq_amt ELSE 0 END), 0) 
        - COALESCE(SUM(CASE WHEN CB_side = 'P' THEN Chq_amt ELSE 0 END), 0) AS OpeningBal
    FROM View_Trans_TranDESC
    WHERE CB_dt < '@fromDate'
),
t1 AS ( 
    SELECT 
        Actionid, 
        SUM(Chq_amt) AS chqAmt, 
        SUM(CASE WHEN CB_side = 'P' THEN Chq_amt ELSE 0 END) AS Debit,
        SUM(CASE WHEN CB_side = 'R' THEN Chq_amt ELSE 0 END) AS Credit
    FROM View_Trans_TranDESC
    WHERE Chq_amt <> 0
    AND CB_dt BETWEEN '@fromDate' AND '@toDate'
    GROUP BY Actionid
)
SELECT 
    CAST('@fromDate' AS DATE) AS ActionDT,  
    NULL AS ActionID, 
    NULL AS chqAmt, 
    0 AS Debit, 
    0 AS Credit, 
    OpeningBal AS Balance
FROM OpeningBalance 

UNION ALL

SELECT 
    Action_TB.ActionDT,  
    t1.ActionID, 
    chqAmt, 
    Debit, 
    Credit, 
    (OpeningBal + SUM(Credit) OVER (ORDER BY Action_TB.ActionDT)) 
    - SUM(Debit) OVER (ORDER BY Action_TB.ActionDT) AS Balance
FROM t1 
JOIN Action_TB ON t1.ActionID = Action_TB.ActionID, 
OpeningBalance  -- Using CTE directly instead of a subquery

ORDER BY ActionDT;
    
    `,
    summaryCols: [],
    showCalender: true,
  },
  {
    title: "Balance Sheet",
    query: `
      WITH ls AS (
    SELECT 
        ROW_NUMBER() OVER (ORDER BY AC_Type) AS Sno, 
        AC_type, 
        AC_Sub, 
        SUM(PRNBAL + INTBAL) AS total 
    FROM View_AC_Bal_Trans 
    WHERE AC_type IN (N'DEPOSIT') 
        AND CB_dt BETWEEN '@fromDate' AND '@toDate'  -- Apply date filter
    GROUP BY AC_type, AC_Sub
), 
rs AS (
    SELECT 
        ROW_NUMBER() OVER (ORDER BY AC_Type) AS Sno, 
        AC_type, 
        AC_Sub, 
        SUM(PRNBAL + INTBAL) AS total 
    FROM View_AC_Bal_Trans 
    WHERE AC_type IN (N'LOAN', N'ASSET') 
        AND CB_dt BETWEEN '@fromDate' AND '@toDate'  -- Apply date filter
    GROUP BY AC_type, AC_Sub

    UNION ALL

    SELECT 
        7 AS Sno, 
        'ASSET' AS AC_type, 
        'BANK' AS AC_Sub, 
        SUM(chq_amt * IIF(CB_side = 'R', 1, -1)) AS Total 
    FROM View_Trans_TranDESC 
    WHERE Chq_amt <> 0 
        AND CB_dt BETWEEN '@fromDate' AND '@toDate'  -- Apply date filter
), 
t1 AS (
    SELECT 
        ls.Sno, 
        ls.AC_Sub, 
        ls.total AS Liabilities, 
        rs.AC_Sub AS [AC Sub], 
        rs.total AS Assets  
    FROM ls 
    FULL JOIN rs ON ls.Sno = rs.Sno
) 

SELECT * FROM t1 

UNION 

SELECT 
    99 AS Sno, 
    'Net Profit' AS AC_sub, 
    SUM(Assets) - SUM(Liabilities) AS Liabilities, 
    '' AS [AC Sub], 
    NULL AS Assets  
FROM t1;

    
    `,
    summaryCols: ["Assets", "Liabilities"],
    showCalender: true,
  },
];

// Routes Start Here

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
    const result = await Promise.all(
      reportQueries.map(async (report) => {
        const baseReport = {
          title: report.title,
          showCalender: report.showCalender,
          InputLabel: report.InputLabel,
          InputDefValue: report.InputDefValue,
        };

        // If the report has a getInputOptions function, fetch the options
        if (report.getInputOptions) {
          baseReport.InputOption = await report.getInputOptions();
        } else {
          baseReport.InputOption = report.InputOption;
        }

        return baseReport;
      })
    );
    res.json(result);
  } catch (error) {
    console.error("Error fetching reports:", error);
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
      finalQuery = finalQuery.replace(/@toDate/g, `${toDate}`);
      finalQuery = finalQuery.replace("@inputValue", `${inputValue}`);
    } else if (query === "General Ledger") {
      finalQuery = finalQuery.replace("@fromDate", `${fromDate}`);
      finalQuery = finalQuery.replace("@toDate", `${toDate}`);
      finalQuery = finalQuery.replace("@inputValue", `${inputValue}`);
    } else if (query === "Show Batch") {
      finalQuery = finalQuery.replace("@inputValue", `${inputValue}`);
    } else {
      finalQuery = finalQuery.replace(/@fromDate/g, `${fromDate}`);
      finalQuery = finalQuery.replace(/@toDate/g, `${toDate}`);
      finalQuery = finalQuery.replace(/@inputValue/g, `${inputValue}`);
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
