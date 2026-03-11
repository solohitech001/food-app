-- CreateEnum
CREATE TYPE "LocationLockType" AS ENUM ('RADIUS', 'CITY', 'STATE', 'POLYGON');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "city" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "state" TEXT;
