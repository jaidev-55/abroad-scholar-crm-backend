-- CreateEnum
CREATE TYPE "PipelineStatus" AS ENUM ('COUNSELLING_COMPLETED', 'FOLLOW_UP', 'ACTIVE_PIPELINE', 'DOCS_PENDING', 'NO_RESPONSE_1ST_CALL');

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "pipelineStatus" "PipelineStatus";

-- CreateIndex
CREATE INDEX "Lead_pipelineStatus_idx" ON "Lead"("pipelineStatus");
