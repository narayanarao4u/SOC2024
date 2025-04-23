/*
  Warnings:

  - The primary key for the `mem_tb` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `MemID` on the `mem_tb` table. All the data in the column will be lost.
  - Added the required column `id` to the `mem_tb` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[mem_tb] DROP CONSTRAINT [mem_tb_pkey];
ALTER TABLE [dbo].[mem_tb] DROP COLUMN [MemID];
ALTER TABLE [dbo].[mem_tb] ADD CONSTRAINT mem_tb_pkey PRIMARY KEY CLUSTERED ([id]);
ALTER TABLE [dbo].[mem_tb] ADD [id] INT NOT NULL IDENTITY(1,1);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
