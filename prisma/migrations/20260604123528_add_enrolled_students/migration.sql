-- CreateEnum
CREATE TYPE "EnrollmentStage" AS ENUM ('LEAD_CONVERTED', 'FEE_PAID', 'CAS_I20_ISSUED', 'VISA_FILED', 'VISA_APPROVED', 'TRAVEL_DONE');

-- CreateEnum
CREATE TYPE "VisaStatus" AS ENUM ('NOT_STARTED', 'FILED', 'IN_PROGRESS', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "FeeStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID');

-- CreateEnum
CREATE TYPE "RiskType" AS ENUM ('VISA_DEADLINE', 'FEE_OVERDUE', 'DOCS_MISSING', 'INTAKE_APPROACHING', 'VISA_REJECTED', 'CAS_PENDING');

-- CreateEnum
CREATE TYPE "EnrollmentActivityType" AS ENUM ('ENROLLED', 'STAGE_CHANGE', 'VISA_UPDATE', 'FEE_PAYMENT', 'DOCUMENT_UPLOAD', 'RISK_FLAGGED', 'RISK_RESOLVED', 'NOTE', 'EDIT');

-- CreateTable
CREATE TABLE "EnrolledStudent" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "ieltsScore" DOUBLE PRECISION,
    "source" "LeadSource",
    "country" TEXT NOT NULL,
    "university" TEXT NOT NULL,
    "course" TEXT NOT NULL,
    "intakeDate" TIMESTAMP(3) NOT NULL,
    "counselorId" TEXT,
    "stage" "EnrollmentStage" NOT NULL DEFAULT 'LEAD_CONVERTED',
    "visaStatus" "VisaStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "visaAppDate" TIMESTAMP(3),
    "visaDecDate" TIMESTAMP(3),
    "casRef" TEXT,
    "totalFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "feePaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "feeStatus" "FeeStatus" NOT NULL DEFAULT 'PENDING',
    "feeCurrency" TEXT NOT NULL DEFAULT 'USD',
    "travelDate" TIMESTAMP(3),
    "travelReady" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "leadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnrolledStudent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnrollmentRisk" (
    "id" TEXT NOT NULL,
    "type" "RiskType" NOT NULL,
    "message" TEXT NOT NULL,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "studentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnrollmentRisk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnrollmentDocument" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT,
    "studentId" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnrollmentDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnrollmentActivity" (
    "id" TEXT NOT NULL,
    "type" "EnrollmentActivityType" NOT NULL,
    "message" TEXT NOT NULL,
    "meta" JSONB,
    "studentId" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnrollmentActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EnrolledStudent_studentId_key" ON "EnrolledStudent"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "EnrolledStudent_phone_key" ON "EnrolledStudent"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "EnrolledStudent_leadId_key" ON "EnrolledStudent"("leadId");

-- CreateIndex
CREATE INDEX "EnrolledStudent_stage_idx" ON "EnrolledStudent"("stage");

-- CreateIndex
CREATE INDEX "EnrolledStudent_visaStatus_idx" ON "EnrolledStudent"("visaStatus");

-- CreateIndex
CREATE INDEX "EnrolledStudent_feeStatus_idx" ON "EnrolledStudent"("feeStatus");

-- CreateIndex
CREATE INDEX "EnrolledStudent_country_idx" ON "EnrolledStudent"("country");

-- CreateIndex
CREATE INDEX "EnrolledStudent_counselorId_idx" ON "EnrolledStudent"("counselorId");

-- CreateIndex
CREATE INDEX "EnrolledStudent_intakeDate_idx" ON "EnrolledStudent"("intakeDate");

-- CreateIndex
CREATE INDEX "EnrolledStudent_createdAt_idx" ON "EnrolledStudent"("createdAt");

-- CreateIndex
CREATE INDEX "EnrollmentRisk_studentId_idx" ON "EnrollmentRisk"("studentId");

-- CreateIndex
CREATE INDEX "EnrollmentRisk_type_idx" ON "EnrollmentRisk"("type");

-- CreateIndex
CREATE INDEX "EnrollmentRisk_isResolved_idx" ON "EnrollmentRisk"("isResolved");

-- CreateIndex
CREATE INDEX "EnrollmentDocument_studentId_idx" ON "EnrollmentDocument"("studentId");

-- CreateIndex
CREATE INDEX "EnrollmentActivity_studentId_idx" ON "EnrollmentActivity"("studentId");

-- CreateIndex
CREATE INDEX "EnrollmentActivity_createdAt_idx" ON "EnrollmentActivity"("createdAt");

-- AddForeignKey
ALTER TABLE "EnrolledStudent" ADD CONSTRAINT "EnrolledStudent_counselorId_fkey" FOREIGN KEY ("counselorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentRisk" ADD CONSTRAINT "EnrollmentRisk_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "EnrolledStudent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentDocument" ADD CONSTRAINT "EnrollmentDocument_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "EnrolledStudent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentActivity" ADD CONSTRAINT "EnrollmentActivity_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "EnrolledStudent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentActivity" ADD CONSTRAINT "EnrollmentActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
