/*
  Warnings:

  - You are about to drop the column `descricao` on the `forms` table. All the data in the column will be lost.
  - You are about to drop the column `nome` on the `forms` table. All the data in the column will be lost.
  - Added the required column `name` to the `forms` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "forms" DROP COLUMN "descricao",
DROP COLUMN "nome",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "name" TEXT NOT NULL;
