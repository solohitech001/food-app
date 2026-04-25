import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client/wasm';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  /* ============================
     CREATE ORDER + ESCROW
  ============================ */
  async createOrder(userId: string, vendorId: string, amount: number) {
  if (amount <= 0) {
    throw new BadRequestException('Invalid amount');
  }

  // 🔍 Get wallets
  const userWallet = await this.prisma.wallet.findFirst({
    where: { userId },
  });

  const vendorWallet = await this.prisma.wallet.findFirst({
    where: { vendorId },
  });

  if (!userWallet || !vendorWallet) {
    throw new BadRequestException('Wallet not found');
  }

  // 🚫 Prevent duplicate pending order
  const existing = await this.prisma.order.findFirst({
    where: {
      userId,
      vendorId,
      amount,
      status: OrderStatus.PENDING,
    },
  });

  if (existing) {
    throw new BadRequestException('Duplicate order attempt');
  }

  return this.prisma.$transaction(async (tx) => {
    // 🔒 Lock wallet row (prevent race condition)
    const rows: any = await tx.$queryRawUnsafe(
      `SELECT * FROM "Wallet" WHERE id = $1 FOR UPDATE`,
      userWallet.id,
    );

    const wallet = rows[0];

    if (!wallet || wallet.balance < amount) {
      throw new ForbiddenException('Insufficient balance');
    }

    // 🧾 Generate order reference
    const orderRef = `ORD-${userId}-${Date.now()}`;

    // 💰 Debit user wallet
    await tx.wallet.update({
      where: { id: userWallet.id },
      data: { balance: { decrement: amount } },
    });

    // 🛒 Create order
    const order = await tx.order.create({
      data: {
        userId,
        vendorId,
        amount,
        reference: orderRef,
        status: OrderStatus.PENDING,
        acceptBy: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    // 🔒 Create escrow (FIXED)
    await tx.escrow.create({
      data: {
        orderId: order.id,
        amount,
        walletId: userWallet.id,
        vendorWalletId: vendorWallet.id,
        status: 'HELD',
        reference: `ESCROW-${order.id}`, // ✅ REQUIRED
      },
    });

    // 🧾 Log transaction (DEBIT)
    await tx.transaction.create({
      data: {
        walletId: userWallet.id,
        amount,
        type: 'DEBIT',
        source: 'ESCROW',
        reference: `ESCROW-${order.id}`,
        narration: 'Order payment held in escrow',
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
    if (!order || order.vendorId !== vendor.id)
      throw new ForbiddenException('Access denied');
    if (order.status !== OrderStatus.PENDING)
      throw new BadRequestException('Order cannot be accepted');
    if (order.acceptBy < new Date())
      throw new BadRequestException('Order acceptance expired');

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.PREPARING },
    });
  }

  /* ============================
     MARK AS DELIVERED
  ============================ */
  async markAsDelivered(orderId: string, vendorUserId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId: vendorUserId },
    });
    if (!vendor) throw new ForbiddenException('Vendor not found');

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order || order.vendorId !== vendor.id)
      throw new ForbiddenException('Access denied');
    if (order.status !== OrderStatus.PREPARING)
      throw new BadRequestException('Order not in preparing state');

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.DELIVERED, deliveredAt: new Date() },
    });
  }

  /* ============================
     COMPLETE ORDER → RELEASE ESCROW
  ============================ */
  async completeOrder(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { escrow: true },
    });

    if (!order || order.userId !== userId)
      throw new ForbiddenException('Access denied');
    if (order.status !== OrderStatus.DELIVERED)
      throw new BadRequestException('Order not delivered yet');
    if (!order.escrow) throw new BadRequestException('Escrow not found');

    return this.prisma.$transaction(async (tx) => {
      const escrow = order.escrow!; // non-null assertion

      // Pay vendor
      await tx.wallet.update({
        where: { id: escrow.vendorWalletId },
        data: { balance: { increment: order.amount } },
      });

      // Release escrow
      await tx.escrow.update({
        where: { id: escrow.id },
        data: { status: 'RELEASED', releasedAt: new Date() },
      });

      // Log transaction
      await tx.transaction.create({
        data: {
          walletId: escrow.vendorWalletId,
          amount: order.amount,
          type: 'CREDIT',
          source: 'ESCROW',
          reference: `REL-${order.id}`,
          narration: 'Escrow released too vendor',
        },
      });

      // Mark order as completed
      return tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.COMPLETED, completedAt: new Date() },
      });
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

    if (!order || order.vendorId !== vendor.id)
      throw new ForbiddenException('Access denied');
    if (order.status !== OrderStatus.PENDING)
      throw new BadRequestException('Order cannot be rejected');
    if (!order.escrow) throw new BadRequestException('Escrow not found');

    const escrow = order.escrow!;

    return this.prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: escrow.walletId },
        data: { balance: { increment: order.amount } },
      });

      await tx.escrow.update({
        where: { id: escrow.id },
        data: { status: 'REFUNDED', refundedAt: new Date() },
      });

      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
      });

      await tx.transaction.create({
        data: {
          walletId: escrow.walletId,
          amount: order.amount,
          type: 'CREDIT',
          source: 'ESCROW',
          reference: `REJ-${order.id}`,
          narration: 'Order rejected refund',
        },
      });

      return { rejected: true };
    });
  }

  /* ============================
     GET DELIVERED ORDERS PENDING RELEASE
  ============================ */
  async getDeliveredOrdersPendingRelease() {
    return this.prisma.order.findMany({
      where: { status: OrderStatus.DELIVERED },
      include: { escrow: true },
    });
  }

  /* ============================
     COMPLETE ORDER AUTOMATICALLY
  ============================ */
  async completeOrderAuto(orderId: string) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.COMPLETED },
    });
  }

  /* ============================
     REFUND EXPIRED ORDERS
  ============================ */
  async refundExpiredOrders() {
    const expiredOrders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.PENDING,
        acceptBy: { lt: new Date() },
      },
      include: { escrow: true },
    });

    let refundedCount = 0;

    for (const order of expiredOrders) {
      if (!order.escrow || order.escrow.status !== 'HELD') continue;

      const escrow = order.escrow!;

      await this.prisma.$transaction(async (tx) => {
        await tx.wallet.update({
          where: { id: escrow.walletId },
          data: { balance: { increment: order.amount } },
        });

        await tx.escrow.update({
          where: { id: escrow.id },
          data: { status: 'REFUNDED', refundedAt: new Date() },
        });

        await tx.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.CANCELLED },
        });

        await tx.transaction.create({
          data: {
            walletId: escrow.walletId,
            amount: order.amount,
            type: 'CREDIT',
            source: 'TRANSFER',
            reference: `EXP-${order.id}`,
            narration: 'Auto refund (expired order)',
          },
        });
      });

      refundedCount++;
    }

    return { refunded: refundedCount };
  }
}
