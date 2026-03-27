/*
  Warnings:

  - The `lostReason` column on the `Lead` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "LostReason" AS ENUM ('NO_RESPONSE', 'NOT_INTERESTED', 'FINANCIAL_ISSUE', 'CHOSE_OTHER_CONSULTANT', 'NOT_ELIGIBLE', 'DUPLICATE_LEAD', 'OTHER');

-- AlterTable
ALTER TABLE "Lead" DROP COLUMN "lostReason",
ADD COLUMN     "lostReason" "LostReason";

-- CreateIndex
CREATE INDEX "Lead_lostReason_idx" ON "Lead"("lostReason");
