import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  /* ============================
     CREATE ORDER + ITEMS   + ESCROW
  ============================ */
  async createOrder(userId: string) {
    console.log('========================================');
    console.log('🛒 CREATE ORDER FROM CART');
    console.log('========================================');
    console.log('👤 User ID:', userId);

    // ============================================================
    // 🛒 GET USER CART
    // ============================================================

    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            food: true,
          },
        },
        vendor: true,
      },
    });

    if (!cart) {
      throw new BadRequestException('Cart not found');
    }

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Your cart is empty');
    }

    console.log('🛒 Cart:', {
      id: cart.id,
      userId: cart.userId,
      vendorId: cart.vendorId,
      items: cart.items.length,
    });

    // ============================================================
    // 🏪 DERIVE VENDOR FROM CART
    // ============================================================

    const vendorId = cart.vendorId;

    if (!vendorId) {
      throw new BadRequestException('Cart is not associated with a vendor');
    }

    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new BadRequestException('Vendor not found');
    }

    console.log('🏪 Vendor:', {
      id: vendor.id,
      name: vendor.name,
    });

    // ============================================================
    // 💰 GET VENDOR WALLET
    // ============================================================

    const vendorWallet = await this.prisma.wallet.findUnique({
      where: {
        vendorId: vendor.id,
      },
    });

    if (!vendorWallet) {
      throw new BadRequestException('Vendor wallet not found');
    }

    console.log('🏦 Vendor wallet:', {
      id: vendorWallet.id,
      vendorId: vendorWallet.vendorId,
      balance: vendorWallet.balance,
    });

    // ============================================================
    // 👤 GET CUSTOMER WALLET
    // ============================================================

    const userWallet = await this.prisma.wallet.findFirst({
      where: {
        userId,
      },
    });

    if (!userWallet) {
      throw new BadRequestException('User wallet not found');
    }

    console.log('💰 User wallet:', {
      id: userWallet.id,
      balance: userWallet.balance,
    });

    // ============================================================
    // 🍔 VALIDATE CART ITEMS
    // ============================================================

    let totalAmount = 0;

    const orderItemsData = cart.items.map((item) => {
      const food = item.food;

      if (!food) {
        throw new BadRequestException(`Food ${item.foodId} not found`);
      }

      if (!food.isAvailable) {
        throw new BadRequestException(`${food.name} is no longer available`);
      }

      if (item.quantity <= 0) {
        throw new BadRequestException(`Invalid quantity for ${food.name}`);
      }

      // Make sure the cart is internally consistent.
      if (food.vendorId !== vendorId) {
        throw new BadRequestException(
          `${food.name} does not belong to the cart vendor`,
        );
      }

      const price = Number(food.price);
      const itemTotal = price * item.quantity;

      totalAmount += itemTotal;

      console.log('🍔 CART ITEM:', {
        foodId: food.id,
        foodName: food.name,
        vendorId: food.vendorId,
        quantity: item.quantity,
        price,
        itemTotal,
      });

      return {
        foodId: food.id,
        quantity: item.quantity,
        price: food.price,
      };
    });

    console.log('💰 TOTAL:', totalAmount);

    // ============================================================
    // 🔒 TRANSACTION
    // ============================================================

    return this.prisma.$transaction(async (tx) => {
      // ----------------------------------------------------------
      // LOCK CUSTOMER WALLET
      // ----------------------------------------------------------

      const rows: any[] = await tx.$queryRawUnsafe(
        `SELECT * FROM "Wallet" WHERE id = $1 FOR UPDATE`,
        userWallet.id,
      );

      const wallet = rows[0];

      if (!wallet) {
        throw new BadRequestException('User wallet not found');
      }

      const walletBalance = Number(wallet.balance);

      console.log('🔒 Wallet locked');
      console.log('💰 Current balance:', walletBalance);
      console.log('💰 Required:', totalAmount);

      // ----------------------------------------------------------
      // CHECK BALANCE
      // ----------------------------------------------------------

      if (walletBalance < totalAmount) {
        throw new ForbiddenException(
          `Insufficient balance. Available: ₦${walletBalance}, Required: ₦${totalAmount}`,
        );
      }

      // ----------------------------------------------------------
      // CREATE ORDER REFERENCE
      // ----------------------------------------------------------

      const reference = `ORD-${userId}-${Date.now()}`;

      // ----------------------------------------------------------
      // CALCULATE CUSTOMER BALANCE AFTER DEBIT
      // ----------------------------------------------------------

      const customerNewBalance = walletBalance - totalAmount;

      console.log('💰 Customer new balance:', customerNewBalance);

      // ----------------------------------------------------------
      // DEBIT CUSTOMER WALLET
      // ----------------------------------------------------------

      await tx.wallet.update({
        where: {
          id: userWallet.id,
        },
        data: {
          balance: {
            decrement: totalAmount,
          },
        },
      });

      console.log('✅ Customer wallet debited');

      // ----------------------------------------------------------
      // CREATE CUSTOMER TRANSACTION
      // ----------------------------------------------------------

      await tx.transaction.create({
        data: {
          walletId: userWallet.id,
          amount: totalAmount,
          type: 'DEBIT',
          source: 'ESCROW',
          reference,
          narration: 'Payment for order held in escrow',
          balanceAfter: customerNewBalance,
          status: 'SUCCESS',
          userId,
        },
      });

      console.log('🧾 Customer debit transaction created');

      // ----------------------------------------------------------
      // CREATE ORDER
      // ----------------------------------------------------------

      const order = await tx.order.create({
        data: {
          userId,
          vendorId,
          amount: totalAmount,
          reference,
          acceptBy: new Date(Date.now() + 15 * 60 * 1000),
        },
      });

      console.log('✅ Order created:', order.id);

      // ----------------------------------------------------------
      // CREATE ORDER ITEMS
      // ----------------------------------------------------------

      await tx.orderItem.createMany({
        data: orderItemsData.map((item) => ({
          orderId: order.id,
          foodId: item.foodId,
          quantity: item.quantity,
          price: item.price,
        })),
      });

      console.log('✅ Order items created');

      // ----------------------------------------------------------
      // CREATE ESCROW
      // ----------------------------------------------------------

      const escrow = await tx.escrow.create({
        data: {
          orderId: order.id,
          amount: totalAmount,
          walletId: userWallet.id,
          vendorWalletId: vendorWallet.id,
          status: 'HELD',
          reference: `ESCROW-${order.id}`,
        },
      });

      console.log('🔐 Escrow created:', escrow.id);

      // ----------------------------------------------------------
      // CLEAR CART
      // ----------------------------------------------------------

      await tx.cartItem.deleteMany({
        where: {
          cartId: cart.id,
        },
      });

      await tx.cart.update({
        where: {
          id: cart.id,
        },
        data: {
          vendorId: null,
        },
      });

      console.log('🧹 Cart cleared');

      // ----------------------------------------------------------
      // SUCCESS
      // ----------------------------------------------------------

      console.log('========================================');
      console.log('🎉 ORDER CREATED SUCCESSFULLY');
      console.log('========================================');

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

      // ----------------------------------------------------------
      // LOCK VENDOR WALLET
      // ----------------------------------------------------------

      const rows: any[] = await tx.$queryRawUnsafe(
        `SELECT * FROM "Wallet" WHERE id = $1 FOR UPDATE`,
        escrow.vendorWalletId,
      );

      const vendorWallet = rows[0];

      if (!vendorWallet) {
        throw new BadRequestException('Vendor wallet not found');
      }

      const vendorCurrentBalance = Number(vendorWallet.balance);
      const vendorNewBalance = vendorCurrentBalance + Number(order.amount);

      console.log('🔒 Vendor wallet locked');
      console.log('💰 Vendor balance before:', vendorCurrentBalance);
      console.log('💵 Escrow amount:', Number(order.amount));
      console.log('💰 Vendor balance after:', vendorNewBalance);

      // ----------------------------------------------------------
      // CREDIT VENDOR WALLET
      // ----------------------------------------------------------

      await tx.wallet.update({
        where: {
          id: escrow.vendorWalletId,
        },
        data: {
          balance: {
            increment: order.amount,
          },
        },
      });

      console.log('✅ Vendor wallet credited');

      // ----------------------------------------------------------
      // RELEASE ESCROW
      // ----------------------------------------------------------

      await tx.escrow.update({
        where: {
          id: escrow.id,
        },
        data: {
          status: 'RELEASED',
          releasedAt: new Date(),
        },
      });

      console.log('🔓 Escrow released');

      // ----------------------------------------------------------
      // CREATE VENDOR TRANSACTION
      // ----------------------------------------------------------

      await tx.transaction.create({
        data: {
          walletId: escrow.vendorWalletId,
          amount: order.amount,
          type: 'CREDIT',
          source: 'ESCROW',
          reference: `REL-${order.id}`,
          narration: 'Escrow released to vendor',
          balanceAfter: vendorNewBalance,
          status: 'SUCCESS',
          userId: order.userId,
        },
      });

      console.log('🧾 Vendor credit transaction created');

      // ----------------------------------------------------------
      // COMPLETE ORDER
      // ----------------------------------------------------------

      const completedOrder = await tx.order.update({
        where: {
          id: orderId,
        },
        data: {
          status: OrderStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      console.log('✅ Order completed');

      return completedOrder;
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

      // Get customer's current wallet balance
      const customerWallet = await tx.wallet.findUnique({
        where: { id: escrow.walletId },
      });

      if (!customerWallet) {
        throw new BadRequestException('Customer wallet not found');
      }

      const customerNewBalance =
        Number(customerWallet.balance) + Number(order.amount);

      await tx.wallet.update({
        where: { id: escrow.walletId },
        data: {
          balance: { increment: order.amount },
        },
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
        data: {
          status: OrderStatus.CANCELLED,
        },
      });

      await tx.transaction.create({
        data: {
          walletId: escrow.walletId,
          amount: order.amount,
          type: 'CREDIT',
          source: 'ESCROW',
          reference: `REJ-${order.id}`,
          narration: 'Order rejected refund',
          balanceAfter: customerNewBalance,
          status: 'SUCCESS',
          userId: order.userId,
        },
      });

      return { rejected: true };
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
      include: {
        escrow: true,
      },
    });

    let refundedCount = 0;

    for (const order of expiredOrders) {
      if (!order.escrow || order.escrow.status !== 'HELD') {
        continue;
      }

      const escrow = order.escrow;

      await this.prisma.$transaction(async (tx) => {
        const customerWallet = await tx.wallet.findUnique({
          where: {
            id: escrow.walletId,
          },
        });

        if (!customerWallet) {
          throw new BadRequestException('Customer wallet not found');
        }

        const customerNewBalance =
          Number(customerWallet.balance) + Number(order.amount);

        console.log(
          '💰 Customer balance before refund:',
          customerWallet.balance,
        );

        console.log('💵 Refund amount:', order.amount);

        console.log(
          '💰 Customer balance after refund:',
          customerNewBalance,
        );

        await tx.wallet.update({
          where: {
            id: escrow.walletId,
          },
          data: {
            balance: {
              increment: order.amount,
            },
          },
        });

        console.log('✅ Customer wallet refunded');

        await tx.escrow.update({
          where: {
            id: escrow.id,
          },
          data: {
            status: 'REFUNDED',
            refundedAt: new Date(),
          },
        });

        console.log('🔓 Escrow refunded');

        await tx.order.update({
          where: {
            id: order.id,
          },
          data: {
            status: OrderStatus.CANCELLED,
          },
        });

        console.log('❌ Expired order cancelled');

        await tx.transaction.create({
          data: {
            walletId: escrow.walletId,
            amount: order.amount,
            type: 'CREDIT',
            source: 'ESCROW',
            reference: `EXP-${order.id}`,
            narration: 'Auto refund (expired order)',
            balanceAfter: customerNewBalance,
            status: 'SUCCESS',
            userId: order.userId,
          },
        });

        console.log('🧾 Refund transaction created');
      });

      refundedCount++;
    }

    console.log('========================================');
    console.log('🔄 EXPIRED ORDERS REFUNDED:', refundedCount);
    console.log('========================================');

    return {
      refunded: refundedCount,
    };
  }
  
}