/*
  Warnings:

  - Added the required column `user_id` to the `notifications` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "user_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "instance" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_connected" BOOLEAN NOT NULL,
    "whatsapp" TEXT,
    "evolution_id" TEXT,
    "base64" TEXT,

    CONSTRAINT "instance_pkey" PRIMARY KEY ("id")
);
