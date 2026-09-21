-- CreateEnum
CREATE TYPE "DepositStatus" AS ENUM (
  'PENDING',
  'SUCCESSFUL',
  'FAILED',
  'CANCELLED'
);

-- CreateTable
CREATE TABLE "WalletDeposit" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "amount" DECIMAL(15,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'NGN',
  "reference" TEXT NOT NULL,
  "flutterwaveId" TEXT,
  "status" "DepositStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WalletDeposit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WalletDeposit_reference_key"
ON "WalletDeposit"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "WalletDeposit_flutterwaveId_key"
ON "WalletDeposit"("flutterwaveId");

-- CreateIndex
CREATE INDEX "WalletDeposit_userId_idx"
ON "WalletDeposit"("userId");

-- AddForeignKey
ALTER TABLE "WalletDeposit"
ADD CONSTRAINT "WalletDeposit_userId_fkey"
FOREIGN KEY ("userId")
REFERENCES "User"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
