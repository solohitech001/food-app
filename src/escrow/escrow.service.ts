import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EscrowService {
  constructor(private prisma: PrismaService) {}

  /* HOLD MONEY WHEN ORDER IS CREATED */
  async holdFunds(
    orderId: string,
    userWalletId: string,
    vendorWalletId: string,
    amount: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // Debit user wallet
      await tx.wallet.update({
        where: { id: userWalletId },
        data: { balance: { decrement: amount } },
      });

      // Create escrow
      return tx.escrow.create({
        data: {
          orderId,
          walletId: userWalletId,
          vendorWalletId,
          amount,
        },
      });
    });
  }

  /* RELEASE FUNDS TO VENDOR */
  async release(orderId: string) {
    const escrow = await this.prisma.escrow.findFirst({
      where: { orderId, status: 'HELD' },
    });

    if (!escrow) {
      throw new BadRequestException('Escrow not found');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: escrow.vendorWalletId },
        data: { balance: { increment: escrow.amount } },
      });

      await tx.escrow.update({
        where: { id: escrow.id },
        data: {
          status: 'RELEASED',
          releasedAt: new Date(),
        },
      });
    });
  }

  /* REFUND USER */
  async refund(orderId: string) {
    const escrow = await this.prisma.escrow.findFirst({
      where: { orderId, status: 'HELD' },
    });

    if (!escrow) {
      throw new BadRequestException('Escrow not found');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: escrow.walletId },
        data: { balance: { increment: escrow.amount } },
      });

      await tx.escrow.update({
        where: { id: escrow.id },
        data: { status: 'REFUNDED' },
      });
    });
  }
}
