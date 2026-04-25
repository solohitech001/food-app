import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EscrowService {
  constructor(private prisma: PrismaService) {}

  /* ============================
     HOLD FUNDS (SAFE)
  ============================ */
  async holdFunds(
    orderId: string,
    userWalletId: string,
    vendorWalletId: string,
    amount: number,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        // 🔒 Idempotency check
        const existing = await tx.escrow.findFirst({
          where: { orderId },
        });

        if (existing) return existing;

        // 🔒 Check balance
        const wallet = await tx.wallet.findUnique({
          where: { id: userWalletId },
        });

        if (!wallet || wallet.balance < amount) {
          throw new BadRequestException('Insufficient balance');
        }

        // 🔻 Debit user wallet
        await tx.wallet.update({
          where: { id: userWalletId },
          data: { balance: { decrement: amount } },
        });

        // 🧾 Log transaction
        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            amount,
            type: 'DEBIT',
            source: 'ESCROW',
            reference: `ESCROW-${orderId}`,
            narration: 'Escrow hold',
          },
        });

        // 📦 Create escrow (✅ FIXED HERE)
        return tx.escrow.create({
          data: {
            orderId,
            walletId: userWalletId,
            vendorWalletId,
            amount,
            status: 'HELD',
            reference: `ESCROW-${orderId}`, // ✅ REQUIRED FIX
          },
        });
      },
      { isolationLevel: 'Serializable' },
    );
  }

  /* ============================
     RELEASE FUNDS (SAFE)
  ============================ */
  async release(orderId: string) {
    return this.prisma.$transaction(
      async (tx) => {
        const escrow = await tx.escrow.findFirst({
          where: { orderId, status: 'HELD' },
        });

        if (!escrow) {
          throw new BadRequestException('Already processed or not found');
        }

        // 💰 Credit vendor wallet
        await tx.wallet.update({
          where: { id: escrow.vendorWalletId },
          data: { balance: { increment: escrow.amount } },
        });

        // 🧾 Log transaction
        await tx.transaction.create({
          data: {
            walletId: escrow.vendorWalletId,
            amount: escrow.amount,
            type: 'CREDIT',
            source: 'ESCROW',
            reference: `RELEASE-${orderId}`,
            narration: 'Escrow release',
          },
        });

        // 🔓 Update escrow
        await tx.escrow.update({
          where: { id: escrow.id },
          data: {
            status: 'RELEASED',
            releasedAt: new Date(),
          },
        });

        return { message: 'Funds released' };
      },
      { isolationLevel: 'Serializable' },
    );
  }

  /* ============================
     REFUND USER (SAFE)
  ============================ */
  async refund(orderId: string) {
    return this.prisma.$transaction(
      async (tx) => {
        const escrow = await tx.escrow.findFirst({
          where: { orderId, status: 'HELD' },
        });

        if (!escrow) {
          throw new BadRequestException('Already processed or not found');
        }

        // 💰 Refund user wallet
        await tx.wallet.update({
          where: { id: escrow.walletId },
          data: { balance: { increment: escrow.amount } },
        });

        // 🧾 Log transaction
        await tx.transaction.create({
          data: {
            walletId: escrow.walletId,
            amount: escrow.amount,
            type: 'CREDIT',
            source: 'ESCROW',
            reference: `REFUND-${orderId}`,
            narration: 'Escrow refund',
          },
        });

        // 🔄 Update escrow
        await tx.escrow.update({
          where: { id: escrow.id },
          data: {
            status: 'REFUNDED',
            refundedAt: new Date(),
          },
        });

        return { message: 'Funds refunded' };
      },
      { isolationLevel: 'Serializable' },
    );
  }
}