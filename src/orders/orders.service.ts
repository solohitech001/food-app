import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  /* ============================
     CREATE ORDER + ESCROW
  ============================ */
  async createOrder(userId: string, vendorId: string, amount: number) {
    const userWallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    const vendorWallet = await this.prisma.wallet.findUnique({
      where: { vendorId },
    });

    if (!userWallet || !vendorWallet) {
      throw new BadRequestException('Wallet not found');
    }

    if (userWallet.balance < amount) {
      throw new ForbiddenException('Insufficient balance');
    }

    const ACCEPTANCE_WINDOW_MINUTES = 15;

    return this.prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: userWallet.id },
        data: { balance: { decrement: amount } },
      });

      const order = await tx.order.create({
        data: {
          userId,
          vendorId,
          amount,
          status: 'PENDING',
          acceptBy: new Date(
            Date.now() + ACCEPTANCE_WINDOW_MINUTES * 60 * 1000,
          ),
        },
      });

      await tx.escrow.create({
        data: {
          orderId: order.id,
          amount,
          walletId: userWallet.id,
          vendorWalletId: vendorWallet.id,
          status: 'HELD',
        },
      });

      await tx.transaction.create({
        data: {
          walletId: userWallet.id,
          amount,
          type: 'DEBIT',
          source: 'TRANSFER',
          reference: `ORD-${order.id}`,
          narration: 'Order payment (escrow)',
        },
      });

      return order;
    });
  }

  /* ============================
     VENDOR ACCEPT ORDER
  ============================ */
  async acceptOrder(orderId: string, vendorUserId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId: vendorUserId },
    });

    if (!vendor) throw new ForbiddenException('Vendor not found');

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.vendorId !== vendor.id) {
      throw new ForbiddenException('Access denied');
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException('Order cannot be accepted');
    }

    if (order.acceptBy < new Date()) {
      throw new BadRequestException('Order acceptance time expired');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'PREPARING' },
    });
  }

  /* ============================
     VENDOR REJECT ORDER
  ============================ */
  async rejectOrder(orderId: string, vendorUserId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId: vendorUserId },
    });

    if (!vendor) throw new ForbiddenException('Vendor not found');

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { escrow: true },
    });

    if (!order || order.vendorId !== vendor.id) {
      throw new ForbiddenException('Access denied');
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException('Order cannot be rejected');
    }

    if (!order.escrow) {
      throw new BadRequestException('Escrow not found');
    }

    const escrowId = order.escrow.id;

    return this.prisma.$transaction(async (tx) => {
      const userWallet = await tx.wallet.findUnique({
        where: { userId: order.userId },
      });

      if (!userWallet) {
        throw new BadRequestException('User wallet not found');
      }

      await tx.wallet.update({
        where: { id: userWallet.id },
        data: { balance: { increment: order.amount } },
      });

      await tx.escrow.update({
        where: { id: escrowId },
        data: {
          status: 'REFUNDED',
          refundedAt: new Date(),
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
      });

      await tx.transaction.create({
        data: {
          walletId: userWallet.id,
          amount: order.amount,
          type: 'CREDIT',
          source: 'TRANSFER',
          reference: `REJ-${order.id}`,
          narration: 'Order rejected by vendor',
        },
      });

      return { rejected: true };
    });
  }

  /* ============================
     AUTO-REFUND EXPIRED ORDERS
  ============================ */
  async refundExpiredOrders() {
    const expiredOrders = await this.prisma.order.findMany({
      where: {
        status: 'PENDING',
        acceptBy: { lt: new Date() },
      },
      include: { escrow: true },
    });

    for (const order of expiredOrders) {
      if (!order.escrow) continue;

      const escrowId = order.escrow.id;

      await this.prisma.$transaction(async (tx) => {
        const userWallet = await tx.wallet.findUnique({
          where: { userId: order.userId },
        });

        if (!userWallet) return;

        await tx.wallet.update({
          where: { id: userWallet.id },
          data: { balance: { increment: order.amount } },
        });

        await tx.escrow.update({
          where: { id: escrowId },
          data: {
            status: 'REFUNDED',
            refundedAt: new Date(),
          },
        });

        await tx.order.update({
          where: { id: order.id },
          data: { status: 'CANCELLED' },
        });

        await tx.transaction.create({
          data: {
            walletId: userWallet.id,
            amount: order.amount,
            type: 'CREDIT',
            source: 'TRANSFER',
            reference: `EXP-${order.id}`,
            narration: 'Order expired auto-refund',
          },
        });
      });
    }

    return { refunded: expiredOrders.length };
  }
}
