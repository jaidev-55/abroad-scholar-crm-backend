-- CreateEnum
CREATE TYPE "IeltsStatus" AS ENUM ('NOT_STARTED', 'PREPARING', 'SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "IeltsExamType" AS ENUM ('ACADEMIC', 'GENERAL');

-- CreateEnum
CREATE TYPE "IeltsTestType" AS ENUM ('OFFICIAL_EXAM', 'MOCK_TEST', 'PRACTICE');

-- CreateTable
CREATE TABLE "IeltsTracking" (
    "id" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "country" TEXT,
    "examType" "IeltsExamType" NOT NULL DEFAULT 'ACADEMIC',
    "status" "IeltsStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "examDate" TIMESTAMP(3),
    "registrationId" TEXT,
    "targetUniversity" TEXT,
    "counselorId" TEXT,
    "requiredScore" DOUBLE PRECISION,
    "targetL" DOUBLE PRECISION,
    "targetR" DOUBLE PRECISION,
    "targetW" DOUBLE PRECISION,
    "targetS" DOUBLE PRECISION,
    "targetOA" DOUBLE PRECISION,
    "currentL" DOUBLE PRECISION,
    "currentR" DOUBLE PRECISION,
    "currentW" DOUBLE PRECISION,
    "currentS" DOUBLE PRECISION,
    "currentOA" DOUBLE PRECISION,
    "notes" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IeltsTracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IeltsScoreHistory" (
    "id" TEXT NOT NULL,
    "trackingId" TEXT NOT NULL,
    "listening" DOUBLE PRECISION,
    "reading" DOUBLE PRECISION,
    "writing" DOUBLE PRECISION,
    "speaking" DOUBLE PRECISION,
    "overall" DOUBLE PRECISION,
    "testType" "IeltsTestType" NOT NULL DEFAULT 'OFFICIAL_EXAM',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IeltsScoreHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IeltsTracking_status_idx" ON "IeltsTracking"("status");

-- CreateIndex
CREATE INDEX "IeltsTracking_counselorId_idx" ON "IeltsTracking"("counselorId");

-- CreateIndex
CREATE INDEX "IeltsTracking_examDate_idx" ON "IeltsTracking"("examDate");

-- AddForeignKey
ALTER TABLE "IeltsTracking" ADD CONSTRAINT "IeltsTracking_counselorId_fkey" FOREIGN KEY ("counselorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IeltsScoreHistory" ADD CONSTRAINT "IeltsScoreHistory_trackingId_fkey" FOREIGN KEY ("trackingId") REFERENCES "IeltsTracking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
