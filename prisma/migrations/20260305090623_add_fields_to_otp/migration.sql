-- AlterTable
ALTER TABLE "OtpVerification" ADD COLUMN     "name" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "password" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'COUNSELOR';
