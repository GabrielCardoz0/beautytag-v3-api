-- AlterTable
ALTER TABLE "services" ADD COLUMN     "created_by" TEXT NOT NULL DEFAULT 'admin',
ALTER COLUMN "lucro" SET DEFAULT 0,
ALTER COLUMN "percent_tax" SET DEFAULT 0;
