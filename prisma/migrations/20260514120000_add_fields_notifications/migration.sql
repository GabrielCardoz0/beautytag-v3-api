-- AlterTable
ALTER TABLE "notifications"
ADD COLUMN "body" TEXT,
ADD COLUMN "type" TEXT NOT NULL DEFAULT 'info',
ALTER COLUMN "is_read" SET DEFAULT false,
ALTER COLUMN "user_id" DROP NOT NULL;
