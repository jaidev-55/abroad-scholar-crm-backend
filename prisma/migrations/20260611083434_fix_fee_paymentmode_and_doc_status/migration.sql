/*
  Warnings:

  - Added the required column `updatedAt` to the `EnrollmentDocument` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EnrollmentDocument" ADD COLUMN     "expiryDate" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "status" "DocumentStatus" NOT NULL DEFAULT 'UPLOADED',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "FeePayment" ADD COLUMN     "paymentMode" "PaymentMode";

-- CreateIndex
CREATE INDEX "EnrollmentDocument_status_idx" ON "EnrollmentDocument"("status");
