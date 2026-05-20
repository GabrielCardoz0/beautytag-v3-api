/*
  Warnings:

  - You are about to drop the column `percent_colab` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `percent_repasse` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `preco_colab` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `preco_parceiro` on the `services` table. All the data in the column will be lost.
  - Added the required column `percent_tax` to the `services` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "services" DROP COLUMN "percent_colab",
DROP COLUMN "percent_repasse",
DROP COLUMN "preco_colab",
DROP COLUMN "preco_parceiro",
ADD COLUMN     "percent_tax" INTEGER NOT NULL;
