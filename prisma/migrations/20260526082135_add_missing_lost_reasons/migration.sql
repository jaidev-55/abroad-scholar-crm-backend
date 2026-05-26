-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LostReason" ADD VALUE 'DIRECT_ADMISSION';
ALTER TYPE "LostReason" ADD VALUE 'ANOTHER_CONSULTANCY';
ALTER TYPE "LostReason" ADD VALUE 'NOT_RESPONDING';
ALTER TYPE "LostReason" ADD VALUE 'DEFERRED_INTAKE';
ALTER TYPE "LostReason" ADD VALUE 'CHANGED_COUNTRY';
ALTER TYPE "LostReason" ADD VALUE 'FAMILY_DECISION';
ALTER TYPE "LostReason" ADD VALUE 'VISA_REJECTION';
