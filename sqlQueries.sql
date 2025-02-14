USE [SOCRJY]
GO

/****** Object:  UserDefinedFunction [dbo].[Cash_balance]    Script Date: 14-02-2025 07:52:15 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON


--- FT_AC_BAL_AsON
IF OBJECT_ID('FT_AC_Bal_Torder', 'IF') IS NOT NULL
    DROP FUNCTION FT_AC_BAL_AsON
GO

CREATE FUNCTION FT_AC_Bal_Torder
(   
    @toDate as datetime = NULL
)
RETURNS TABLE AS RETURN 
(
    WITH MaxOrder AS (
        SELECT ACID, MAX(T_Order) AS T_order
        FROM trans_tb
        WHERE Trans_dt <= ISNULL(@toDate, GETDATE())
        GROUP BY ACID
    ),
    FROMTABLE AS (
        SELECT trans_tb.ACID, trans_tb.PRN_B, trans_tb.Trans_dt, trans_tb.rate, trans_tb.INT_B, trans_tb.CB_dt
        FROM trans_tb
        INNER JOIN MaxOrder ON trans_tb.ACID = MaxOrder.ACID AND trans_tb.T_Order = MaxOrder.T_order
    )
    SELECT 
        VMA.ACID, VMA.gno, VMA.hrno, VMA.name, VMA.AC_Sub, 
        VMA.ACNO, VMA.DOC, VMA.Amt, FTB.Trans_dt, 
        FTB.CB_dt, FTB.PRN_B, FTB.INT_B, FTB.rate,
        cast(round((FTB.PRN_B * POWER(1 + FTB.rate / 100, DATEDIFF(DAY, FTB.CB_dt, ISNULL(@toDate, GETDATE())) / 365.0) - FTB.PRN_B), 2) as numeric(36, 2)) AS AccInt
    FROM View_MEM_AC VMA 
    LEFT OUTER JOIN FROMTABLE FTB ON VMA.ACID = FTB.ACID
)
GO
---- FT_AC_BAL_AsON



IF OBJECT_ID('Cash_balance', 'IF') IS NOT NULL
    DROP FUNCTION FT_AC_BAL_AsON
GO
CREATE FUNCTION [dbo].[Cash_balance]
(
    @dt as datetime
)
RETURNS TABLE
AS
RETURN
(
    WITH CombinedData AS
    (
        SELECT 
            CB_side,
            SUM(CASE WHEN CB_side = 'P' THEN Cash_amt * -1 ELSE Cash_amt END) AS CASH,
            SUM(CASE WHEN CB_side = 'P' THEN Chq_amt * -1 ELSE Chq_amt END) AS CHQ
        FROM 
            View_Trans_TranDESC
        WHERE 
            (CB_dt < @dt) 
            AND AC_type <> 'BANK'
        GROUP BY 
            CB_side
        
        UNION
        
        SELECT 
            CB_side,
            SUM(CASE WHEN CB_side = 'P' THEN Cash_amt * -1 ELSE 0 END) AS CASH,
            SUM(CASE WHEN CB_side = 'R' THEN Chq_amt * -1 ELSE Chq_amt END) AS CHQ
        FROM 
            View_Trans_TranDESC
        WHERE 
            (CB_dt < @dt) 
            AND AC_type = 'BANK'
        GROUP BY 
            CB_side
    )
    SELECT 
        SUM(CASH) AS CASH, 
        SUM(CHQ) AS CHQ 
    FROM 
        CombinedData
)
GO


---#####
USE [SOCRJY]
GO

/****** Object:  View [dbo].[View_AC_Bal_Trans]    Script Date: 14-02-2025 09:06:14 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

ALTER VIEW [dbo].[View_AC_Bal_Trans]
AS
WITH AC_Balance AS (
    SELECT 
        ACID, 
        SUM(ISNULL(PRN_C, 0)) - SUM(ISNULL(PRN_D, 0)) AS PRNBAL, 
        SUM(ISNULL(INT_C, 0)) - SUM(ISNULL(INT_D, 0)) AS INTBAL
    FROM 
        trans_tb
    GROUP BY 
        ACID
)
SELECT top 100 percent
    A.MemID, 
    A.ACID, 
    A.AC_type, 
    A.AC_Sub, 
    A.ACNO, 
    A.DOC, 
    A.Amt, 
    COALESCE(ACB.PRNBAL, 0) AS PRNBAL, 
    COALESCE(ACB.INTBAL, 0) AS INTBAL, 
    A.prn, 
    A.Period, 
    A.CloseDT, 
    A.int, 
    A.rate, 
    A.Closed, 
    vma.hrno
FROM 
    AC_tb A 
    LEFT OUTER JOIN AC_Balance ACB ON A.ACID = ACB.ACID
    LEFT OUTER JOIN View_MEM_AC vma ON A.ACID = vma.ACID
ORDER BY 
    A.MemID, 
    A.AC_type, 
    A.AC_Sub, 
    A.ACID DESC
GO


---#####



IF OBJECT_ID('FT_AC_Bal_Trans', 'IF') IS NOT NULL
    DROP FUNCTION FT_AC_Bal_Trans
GO
CREATE FUNCTION [dbo].[FT_AC_Bal_Trans]
(   
    @toDate AS DATETIME = NULL
)
RETURNS TABLE 
AS 
RETURN 
(
    WITH AC_Balance AS (
        SELECT 
            ACID, 
            SUM(ISNULL(PRN_C, 0)) - SUM(ISNULL(PRN_D, 0)) AS PRNBAL, 
            SUM(ISNULL(INT_C, 0)) - SUM(ISNULL(INT_D, 0)) AS INTBAL
        FROM 
            trans_tb 
        WHERE 
            Trans_dt <= ISNULL(@toDate, GETDATE())
        GROUP BY 
            ACID
    ),
    MaxTrans AS (
        SELECT 
            ACID, 
            MAX(Trans_dt) AS Trans_dt
        FROM 
            trans_tb
        WHERE 
            Trans_dt <= ISNULL(@toDate, GETDATE())
        GROUP BY 
            ACID
    )

    SELECT top 100 percent
        A.MemID, 
        vma.hrno,
        A.ACID, 
        A.AC_type, 
        A.AC_Sub, 
        A.ACNO, 
        A.DOC, 
        A.Amt, 
        COALESCE(ACB.PRNBAL, 0) AS PRNBAL, 
        COALESCE(ACB.INTBAL, 0) AS INTBAL, 
        A.prn, 
        A.Period, 
        A.CloseDT, 
        A.int, 
        A.rate, 
        A.Closed, 
        mt.Trans_dt,
        CAST(
            ROUND(
                (ACB.PRNBAL * POWER(1 + A.rate / 100, DATEDIFF(DAY, mt.Trans_dt, ISNULL(@toDate, GETDATE())) / 365.0) - ACB.PRNBAL), 
                2
            ) 
            AS NUMERIC(36, 2)
        ) AS AccInt
        
    FROM 
        AC_tb A 
        LEFT OUTER JOIN AC_Balance ACB ON A.ACID = ACB.ACID
        LEFT OUTER JOIN View_MEM_AC vma ON A.ACID = vma.ACID
        LEFT OUTER JOIN MaxTrans mt ON A.ACID = mt.ACID
    ORDER BY 
        A.MemID, 
        A.AC_type, 
        A.AC_Sub, 
        A.ACID DESC
)
GO
