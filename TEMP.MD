```SQL
WITH MaxOrder AS (
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
```
