import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Adjust path if needed
import { AddToCartDto, UpdateCartItemDto } from "./dto/add-to-cart.dto";


@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        vendor: { select: { id: true, name: true } },
        items: { include: { food: true } },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: {
          vendor: { select: { id: true, name: true } },
          items: { include: { food: true } },
        },
      });
    }

    const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return { ...cart, subtotal };
  }

  async addToCart(userId: string, dto: AddToCartDto) {
    const food = await this.prisma.food.findUnique({ where: { id: dto.foodId } });

    if (!food || !food.isAvailable) {
      throw new NotFoundException('Food item is unavailable or does not exist.');
    }

    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId, vendorId: food.vendorId },
        include: { items: true },
      });
    }

    if (cart.vendorId && cart.vendorId !== food.vendorId) {
      throw new BadRequestException(
        'Your cart contains items from another vendor. Clear your cart before adding items from a new vendor.',
      );
    }

    if (!cart.vendorId) {
      await this.prisma.cart.update({
        where: { id: cart.id },
        data: { vendorId: food.vendorId },
      });
    }

    const existingItem = cart.items.find((item) => item.foodId === dto.foodId);

    if (existingItem) {
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + dto.quantity,
          price: food.price,
        },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          foodId: food.id,
          quantity: dto.quantity,
          price: food.price,
        },
      });
    }

    return this.getCart(userId);
  }

  async updateItemQuantity(userId: string, itemId: string, dto: UpdateCartItemDto) {
    const cartItem = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!cartItem || cartItem.cart.userId !== userId) {
      throw new NotFoundException('Cart item not found.');
    }

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
    });

    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string) {
    const cartItem = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!cartItem || cartItem.cart.userId !== userId) {
      throw new NotFoundException('Cart item not found.');
    }

    await this.prisma.cartItem.delete({ where: { id: itemId } });

    const remainingCount = await this.prisma.cartItem.count({
      where: { cartId: cartItem.cartId },
    });

    if (remainingCount === 0) {
      await this.prisma.cart.update({
        where: { id: cartItem.cartId },
        data: { vendorId: null },
      });
    }

    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) return { message: 'Cart is already empty.' };

    await this.prisma.$transaction([
      this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } }),
      this.prisma.cart.update({
        where: { id: cart.id },
        data: { vendorId: null },
      }),
    ]);

    return { message: 'Cart cleared successfully.' };
  }
}