import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client/wasm';
import { CreateOrderWithItemsDto } from './dto/create-order-with-items.dto'; // ✅ FIXED

@Injectable()
export class OrdersService  {
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
    throw new BadRequestException(
      'Cart is not associated with a vendor',
    );
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
    throw new BadRequestException(
      'Vendor wallet not found',
    );
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
    throw new BadRequestException(
      'User wallet not  found',
    );
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
      throw new BadRequestException(
        `Food ${item.foodId} not found`,
      );
    }

    if (!food.isAvailable) {
      throw new BadRequestException(
        `${food.name} is no longer available`,
      );
    }

    if (item.quantity <= 0) {
      throw new BadRequestException(
        `Invalid quantity for ${food.name}`,
      );
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
      throw new BadRequestException(
        'User wallet not found',
      );
    }

    const walletBalance = Number(wallet.balance);

    console.log('🔒 Wallet locked');
    console.log('💰 Balance:', walletBalance);
    console.log('💰 Required:', totalAmount);

    if (walletBalance < totalAmount) {
      throw new ForbiddenException(
        `Insufficient balance. Available: ₦${walletBalance}, Required: ₦${totalAmount}`,
      );
    }

    // ----------------------------------------------------------
    // CREATE REFERENCE
    // ----------------------------------------------------------

    const reference = `ORD-${userId}-${Date.now()}`;

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
    // CREATE ORDER
    // ----------------------------------------------------------

    const order = await tx.order.create({
      data: {
        userId,
        vendorId,
        amount: totalAmount,
        reference,
        acceptBy: new Date(
          Date.now() + 15 * 60 * 1000,
        ),
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
