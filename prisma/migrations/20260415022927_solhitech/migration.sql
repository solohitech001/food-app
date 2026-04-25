/*
  Warnings:

  - A unique constraint covering the columns `[reference]` on the table `Escrow` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `reference` to the `Escrow` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Escrow" ADD COLUMN     "reference" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "balanceAfter" DOUBLE PRECISION,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'SUCCESS',
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'NGN',
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "WebhookEvent" ADD COLUMN     "payload" JSONB,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PROCESSED';

-- CreateTable
CREATE TABLE "Withdrawal" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Withdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Withdrawal_reference_key" ON "Withdrawal"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Escrow_reference_key" ON "Escrow"("reference");

-- AddForeignKey
ALTER TABLE "Withdrawal" ADD CONSTRAINT "Withdrawal_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
