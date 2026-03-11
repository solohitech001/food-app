/*
  Warnings:

  - Added the required column `acceptBy` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "VendorLevel" AS ENUM ('LEVEL_1', 'LEVEL_2', 'LEVEL_3');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "acceptBy" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "level" "VendorLevel" NOT NULL DEFAULT 'LEVEL_1';
