/*
  Warnings:

  - The `start_time` column on the `bot` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `end_time` column on the `bot` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "bot" DROP COLUMN "start_time",
ADD COLUMN     "start_time" INTEGER,
DROP COLUMN "end_time",
ADD COLUMN     "end_time" INTEGER;
