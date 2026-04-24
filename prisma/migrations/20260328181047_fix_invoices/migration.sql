/*
  Warnings:

  - You are about to drop the column `pagarmeTransactionId` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `paymentDate` on the `invoices` table. All the data in the column will be lost.
  - Added the required column `pagarme_transaction_id` to the `invoices` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "invoices" DROP COLUMN "pagarmeTransactionId",
DROP COLUMN "paymentDate",
ADD COLUMN     "pagarme_transaction_id" TEXT NOT NULL,
ADD COLUMN     "payment_date" TIMESTAMP(3);
