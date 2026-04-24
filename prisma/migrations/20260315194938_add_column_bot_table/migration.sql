/*
  Warnings:

  - Added the required column `behavior` to the `bot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company_description` to the `bot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `bot` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "bot" ADD COLUMN     "behavior" TEXT NOT NULL,
ADD COLUMN     "company_description" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL;
