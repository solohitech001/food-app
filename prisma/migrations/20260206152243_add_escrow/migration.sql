-- CreateEnum
CREATE TYPE "EscrowStatus" AS ENUM ('HELD', 'RELEASED', 'REFUNDED');

-- CreateTable
CREATE TABLE "Escrow" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "vendorWalletId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "EscrowStatus" NOT NULL DEFAULT 'HELD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),

    CONSTRAINT "Escrow_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Escrow" ADD CONSTRAINT "Escrow_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
