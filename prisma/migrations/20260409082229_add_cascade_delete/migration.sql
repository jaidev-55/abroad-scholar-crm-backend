-- DropForeignKey
ALTER TABLE "LeadActivity" DROP CONSTRAINT "LeadActivity_leadId_fkey";

-- AddForeignKey
ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
