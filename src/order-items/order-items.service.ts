import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client/wasm';
import { CreateOrderWithItemsDto } from './dto/create-order-with-items.dto'; // ✅ FIXED

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  /* ============================
     CREATE ORDER + ITEMS + ESCROW
  ============================ */
  async createOrder(userId: string, dto: CreateOrderWithItemsDto) {
    const { vendorId, items } = dto;

    if (!items || items.length === 0) {
      throw new BadRequestException('No items provided');
    }

    // 🔍 Get vendor
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new BadRequestException('Vendor not found');
    }

    const vendorWallet = await this.prisma.wallet.findFirst({
      where: { userId: vendor.userId }, // ✅ FIX
    });

    if (!vendorWallet) {
      throw new BadRequestException('Vendor wallet not found');
    }

   

    const userWallet = await this.prisma.wallet.findFirst({
      where: { userId },
    });

    if (!userWallet) {
      throw new BadRequestException('User wallet not found');
    }

    if (!vendorWallet) {
      throw new BadRequestException('Vendor wallet not found');
    }

    // 🔥 Fetch foods
    const foodIds = items.map((i) => i.foodId);

    const foods = await this.prisma.food.findMany({
      where: { id: { in: foodIds } },
    });

    if (foods.length !== items.length) {
      throw new BadRequestException('Some foods not found');
    }

    // 🚨 VERY IMPORTANT: ensure foods belong to vendor
    const invalidFood = foods.find((f) => f.vendorId !== vendorId);
    if (invalidFood) {
      throw new BadRequestException('Some items do not belong to this vendor');
    }

    // 💰 Calculate total
    let totalAmount = 0;

    const orderItemsData = items.map((item) => {
      const food = foods.find((f) => f.id === item.foodId)!;

      const itemTotal = food.price * item.quantity;
      totalAmount += itemTotal;

      return {
        foodId: item.foodId,
        quantity: item.quantity,
        price: food.price,
      };
    });

    return this.prisma.$transaction(async (tx) => {
      // 🔒 Lock wallet
      const rows: any = await tx.$queryRawUnsafe(
        `SELECT * FROM "Wallet" WHERE id = $1 FOR UPDATE`,
        userWallet.id,
      );

      const wallet = rows[0];

      if (!wallet || wallet.balance < totalAmount) {
        throw new ForbiddenException('Insufficient balance');
      }

      const reference = `ORD-${userId}-${Date.now()}`;

      // 💰 Deduct user balance
      await tx.wallet.update({
        where: { id: userWallet.id },
        data: { balance: { decrement: totalAmount } },
      });

      // 🧾 Create order
      const order = await tx.order.create({
        data: {
          userId,
          vendorId,
          amount: totalAmount,
          reference,
          acceptBy: new Date(Date.now() + 15 * 60 * 1000),
        },
      });

      // 🍔 Create order items
      await tx.orderItem.createMany({
        data: orderItemsData.map((item) => ({
          ...item,
          orderId: order.id,
        })),
      });

      // 🔒 Create escrow
      await tx.escrow.create({
        data: {
          orderId: order.id,
          amount: totalAmount,
          walletId: userWallet.id,
          vendorWalletId: vendorWallet.id,
          status: 'HELD',
          reference: `ESCROW-${order.id}`, // ✅ REQUIRED
        },
      });

      return order;
    });
  }

  /* ============================
     GET ORDER (WITH ITEMS)
  ============================ */
  async getOrderById(orderId: string) {
    return this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            food: true,
          },
        },
        escrow: true,
        vendor: true,
      },
    });
  }

  /* ============================
     ACCEPT ORDER (VENDOR)
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

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Order cannot be accepted');
    }

    if (order.acceptBy < new Date()) {
      throw new BadRequestException('Order expired');
    }

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

    if (!order || order.vendorId !== vendor.id) {
      throw new ForbiddenException('Access denied');
    }

    if (order.status !== OrderStatus.PREPARING) {
      throw new BadRequestException('Order not in preparing state');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.DELIVERED,
        deliveredAt: new Date(),
      },
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

    if (!order || order.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('Order not delivered yet');
    }

    if (!order.escrow) {
      throw new BadRequestException('Escrow not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const escrow = order.escrow!;

      await tx.wallet.update({
        where: { id: escrow.vendorWalletId },
        data: { balance: { increment: order.amount } },
      });

      await tx.escrow.update({
        where: { id: escrow.id },
        data: {
          status: 'RELEASED',
          releasedAt: new Date(),
        },
      });

      await tx.transaction.create({
        data: {
          walletId: escrow.vendorWalletId,
          amount: order.amount,
          type: 'CREDIT',
          source: 'ESCROW',
          reference: `REL-${order.id}`,
          narration: 'Escrow released to vendor',
        },
      });

      return tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.COMPLETED,
          completedAt: new Date(),
        },
      });
    });
  }

  /* ============================
     REJECT ORDER → REFUND
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

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Order cannot be rejected');
    }

    if (!order.escrow) {
      throw new BadRequestException('Escrow not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const escrow = order.escrow!;

      await tx.wallet.update({
        where: { id: escrow.walletId },
        data: { balance: { increment: order.amount } },
      });

      await tx.escrow.update({
        where: { id: escrow.id },
        data: {
          status: 'REFUNDED',
          refundedAt: new Date(),
        },
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
}
