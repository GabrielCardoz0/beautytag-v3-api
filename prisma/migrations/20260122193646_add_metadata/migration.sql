/*
  Warnings:

  - Added the required column `service_id` to the `plan_services` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "plan_services" ADD COLUMN     "service_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "metadata" JSONB;

-- AddForeignKey
ALTER TABLE "plan_services" ADD CONSTRAINT "plan_services_fk2" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
