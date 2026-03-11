-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "city" TEXT,
ADD COLUMN     "deliveryRadiusKm" DOUBLE PRECISION NOT NULL DEFAULT 10,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "locationLockType" "LocationLockType" NOT NULL DEFAULT 'RADIUS',
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "state" TEXT;

-- CreateTable
CREATE TABLE "VendorZone" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "polygon" JSONB NOT NULL,

    CONSTRAINT "VendorZone_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "VendorZone" ADD CONSTRAINT "VendorZone_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
