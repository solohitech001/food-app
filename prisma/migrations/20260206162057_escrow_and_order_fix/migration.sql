/*
  Warnings:

  - You are about to drop the column `releasedAt` on the `Escrow` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[orderId]` on the table `Escrow` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `amount` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vendorId` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "Escrow" DROP COLUMN "releasedAt";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "vendorId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Escrow_orderId_key" ON "Escrow"("orderId");

-- AddForeignKey
ALTER TABLE "Escrow" ADD CONSTRAINT "Escrow_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Escrow" ADD CONSTRAINT "Escrow_vendorWalletId_fkey" FOREIGN KEY ("vendorWalletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
