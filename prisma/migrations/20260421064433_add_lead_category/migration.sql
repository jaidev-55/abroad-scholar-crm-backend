-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "category" "LeadCategory";

-- AlterTable
ALTER TABLE "WebhookConfig" ADD COLUMN     "category" "LeadCategory";

-- CreateIndex
CREATE INDEX "Lead_category_idx" ON "Lead"("category");
