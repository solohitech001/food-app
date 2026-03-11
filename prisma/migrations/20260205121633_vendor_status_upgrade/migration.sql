-- CreateEnum
CREATE TYPE "VendorStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED');

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "status" "VendorStatus" NOT NULL DEFAULT 'PENDING';
