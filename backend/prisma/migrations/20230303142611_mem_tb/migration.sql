BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[mem_tb] (
    [MemID] INT NOT NULL IDENTITY(1,1),
    [Memtype] VARCHAR(10) CONSTRAINT [mem_tb_Memtype_df] DEFAULT 'EMP',
    [empno] INT,
    [gno] INT,
    [hrno] INT,
    [name] VARCHAR(50),
    [desgn] VARCHAR(20),
    [sex] VARCHAR(1),
    [DOB] DATETIME,
    [DOA] DATETIME,
    [DOR] DATETIME,
    [DOM] DATETIME,
    [DIV] VARCHAR(20),
    [subdiv] VARCHAR(20),
    [Status] VARCHAR(50),
    [Phone1] VARCHAR(10),
    CONSTRAINT [mem_tb_pkey] PRIMARY KEY CLUSTERED ([MemID])
);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
